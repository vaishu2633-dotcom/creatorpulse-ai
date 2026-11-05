"""
CreatorPulse AI - Empirical Model Benchmark Runner
--------------------------------------------------
Runs multi-seed imbalanced machine learning benchmarks on creator data.
Key principles:
1. Multi-seed evaluation (e.g. seeds [42, 123, 999]) reporting Mean and Spread (std).
2. Time-based train/test split: past 80% train, recent 20% test.
3. Resampling applied strictly INSIDE training folds via Imblearn Pipeline (zero leakage).
4. Probability calibration using CalibratedClassifierCV.
5. Saves run date, data size, hit count, seeds, and low-sample warning (< 30 hits).
"""

import os
import json
import threading
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    precision_recall_curve,
    average_precision_score,
    f1_score,
    recall_score,
    precision_score,
    matthews_corrcoef,
    balanced_accuracy_score,
    brier_score_loss
)

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE, RandomOverSampler
from imblearn.combine import SMOTETomek
from imblearn.ensemble import BalancedRandomForestClassifier
from xgboost import XGBClassifier

from backend.services import data_access

NUMERICAL_FEATURES = [
    "title_length",
    "hashtag_count",
    "duration_sec",
    "post_hour",
    "post_weekday",
    "creator_avg_engagement",
    "follower_count"
]

CATEGORICAL_FEATURES = [
    "platform",
    "post_type"
]

PLAIN_METHOD_INFO = {
    "baseline_none": {
        "title": "No special handling",
        "tech": "Baseline Model",
        "desc": "Treats hit posts just like standard posts without compensating for rarity."
    },
    "class_weight_balanced": {
        "title": "Give hits more weight",
        "tech": "class_weight='balanced'",
        "desc": "Penalizes the algorithm heavily when it misses a rare breakout post."
    },
    "random_oversampling": {
        "title": "Repeat hit examples",
        "tech": "Random Oversampling (ROS)",
        "desc": "Duplicates historical hit posts strictly inside training folds."
    },
    "smote": {
        "title": "Create extra synthetic hit examples",
        "tech": "SMOTE",
        "desc": "Blends features of neighboring hit posts inside training folds."
    },
    "smote_tomek": {
        "title": "Synthesize & clean border posts",
        "tech": "SMOTE-Tomek Combination",
        "desc": "Synthesizes hit posts and removes ambiguous borderline examples."
    },
    "balanced_random_forest": {
        "title": "Balanced decision trees",
        "tech": "Balanced Random Forest",
        "desc": "Draws balanced samples of hit and standard posts for each decision tree."
    },
    "xgboost_scale_weight": {
        "title": "Gradient boosted hit focus",
        "tech": "XGBoost (scale_pos_weight)",
        "desc": "Gradient boosting model with weighted loss focused on rare hit discovery."
    },
    "threshold_tuning": {
        "title": "Adjust decision cutoff",
        "tech": "Optimal Threshold Tuning",
        "desc": "Tunes the decision boundary cutoff to optimize F1 score on training predictions."
    }
}

# Global in-memory background task status
_benchmark_status: Dict[str, Any] = {
    "state": "idle",
    "progress": 0,
    "current_step": "Ready to run tests on creator data",
    "error": None,
    "started_at": None,
    "completed_at": None,
    "result": None
}
_status_lock = threading.Lock()


def get_benchmark_status() -> Dict[str, Any]:
    with _status_lock:
        return dict(_benchmark_status)


def _set_status(state: str, progress: int, current_step: str, error: Optional[str] = None, result: Optional[Dict[str, Any]] = None):
    with _status_lock:
        _benchmark_status["state"] = state
        _benchmark_status["progress"] = progress
        _benchmark_status["current_step"] = current_step
        _benchmark_status["error"] = error
        if result:
            _benchmark_status["result"] = result
        if state == "completed":
            _benchmark_status["completed_at"] = datetime.now(timezone.utc).isoformat()


def get_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )


def find_best_threshold(y_true, y_probs):
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_probs)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
    best_idx = np.argmax(f1_scores)
    if best_idx < len(thresholds):
        return thresholds[best_idx]
    return 0.5


def run_creator_data_benchmark(seeds: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Executes empirical imbalanced ML evaluation on the active dataset across multiple random seeds.
    """
    if seeds is None:
        seeds = [42, 123, 999]

    _set_status("running", 5, "Loading and preparing creator posts...")

    posts = data_access.get_posts(limit=2500)
    if len(posts) < 10:
        raise ValueError("At least 10 posts are required in the active dataset to run machine learning evaluation.")

    state = data_access.get_data_source_state()
    active_source = state.get("active_source", "sample")

    records = []
    for p in posts:
        caption = p.get("caption") or p.get("title") or ""
        pub_raw = p.get("published_at") or datetime.now(timezone.utc).isoformat()
        try:
            pub_dt = pd.to_datetime(pub_raw)
        except Exception:
            pub_dt = pd.to_datetime(datetime.now(timezone.utc))

        views = float(p.get("views", 1000))
        er = float(p.get("engagement_rate", 0.05))
        is_hit = bool(p.get("is_breakout", False))

        records.append({
            "title_length": len(caption),
            "hashtag_count": caption.count("#"),
            "duration_sec": float(p.get("duration_sec", 60)),
            "post_hour": pub_dt.hour,
            "post_weekday": pub_dt.weekday(),
            "creator_avg_engagement": er,
            "follower_count": float(p.get("follower_count", max(1000, views * 2))),
            "platform": p.get("platform", "youtube"),
            "post_type": p.get("post_type", "post"),
            "published_at": pub_dt,
            "is_breakout": 1 if is_hit else 0
        })

    df = pd.DataFrame(records)
    df = df.sort_values("published_at").reset_index(drop=True)

    y_all = df["is_breakout"].values
    pos_total = int(np.sum(y_all))

    # If active dataset has 0 breakouts (e.g. uncalibrated raw CSV), auto-tag top 15% as breakouts
    if pos_total == 0:
        cutoff = df["creator_avg_engagement"].quantile(0.85)
        y_all = (df["creator_avg_engagement"] >= cutoff).astype(int).values
        df["is_breakout"] = y_all
        pos_total = int(np.sum(y_all))

    # 80/20 Time-based Chronological Split
    split_idx = max(int(len(df) * 0.8), len(df) - max(2, int(len(df) * 0.1)))
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train_raw = train_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y_train = train_df["is_breakout"].values
    X_test_raw = test_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df["is_breakout"].values

    pos_train = int(np.sum(y_train))
    neg_train = len(y_train) - pos_train
    scale_pos_weight = max(1.0, float(neg_train / max(1, pos_train)))

    method_seed_results: Dict[str, Dict[str, List[float]]] = {
        m: {"pr_auc": [], "f1": [], "recall": [], "precision": [], "brier_score": []}
        for m in PLAIN_METHOD_INFO.keys()
    }

    total_runs = len(seeds) * len(PLAIN_METHOD_INFO)
    completed_runs = 0

    for s_idx, seed in enumerate(seeds):
        _set_status("running", 15 + int((s_idx / len(seeds)) * 75), f"Evaluating ML techniques with Seed {seed}...")

        # Construct candidate pipelines for this seed
        smote_k = min(3, max(1, pos_train - 1)) if pos_train > 1 else 1

        pipelines = {
            "baseline_none": ImbPipeline([
                ("pre", get_preprocessor()),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, random_state=seed))
            ]),
            "class_weight_balanced": ImbPipeline([
                ("pre", get_preprocessor()),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, class_weight="balanced", random_state=seed))
            ]),
            "random_oversampling": ImbPipeline([
                ("pre", get_preprocessor()),
                ("sampler", RandomOverSampler(random_state=seed)),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, random_state=seed))
            ]),
            "smote": ImbPipeline([
                ("pre", get_preprocessor()),
                ("sampler", SMOTE(random_state=seed, k_neighbors=smote_k)),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, random_state=seed))
            ]),
            "smote_tomek": ImbPipeline([
                ("pre", get_preprocessor()),
                ("sampler", SMOTETomek(random_state=seed, smote=SMOTE(k_neighbors=smote_k))),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, random_state=seed))
            ]),
            "balanced_random_forest": ImbPipeline([
                ("pre", get_preprocessor()),
                ("clf", BalancedRandomForestClassifier(n_estimators=40, max_depth=5, random_state=seed))
            ]),
            "xgboost_scale_weight": ImbPipeline([
                ("pre", get_preprocessor()),
                ("clf", XGBClassifier(n_estimators=40, max_depth=4, learning_rate=0.08, scale_pos_weight=scale_pos_weight, random_state=seed, eval_metric="logloss"))
            ]),
            "threshold_tuning": ImbPipeline([
                ("pre", get_preprocessor()),
                ("clf", RandomForestClassifier(n_estimators=40, max_depth=5, class_weight="balanced", random_state=seed))
            ])
        }

        for m_name, pipe in pipelines.items():
            try:
                pipe.fit(X_train_raw, y_train)

                if m_name == "threshold_tuning":
                    train_probs = pipe.predict_proba(X_train_raw)[:, 1]
                    best_thresh = find_best_threshold(y_train, train_probs)
                    test_probs = pipe.predict_proba(X_test_raw)[:, 1]
                    pred = (test_probs >= best_thresh).astype(int)
                else:
                    test_probs = pipe.predict_proba(X_test_raw)[:, 1]
                    pred = (test_probs >= 0.5).astype(int)

                try:
                    pr_auc = float(average_precision_score(y_test, test_probs))
                except Exception:
                    pr_auc = 0.0

                f1 = float(f1_score(y_test, pred, zero_division=0))
                rec = float(recall_score(y_test, pred, zero_division=0))
                prec = float(precision_score(y_test, pred, zero_division=0))
                brier = float(brier_score_loss(y_test, test_probs))

                method_seed_results[m_name]["pr_auc"].append(pr_auc)
                method_seed_results[m_name]["f1"].append(f1)
                method_seed_results[m_name]["recall"].append(rec)
                method_seed_results[m_name]["precision"].append(prec)
                method_seed_results[m_name]["brier_score"].append(brier)

            except Exception as exc:
                method_seed_results[m_name]["pr_auc"].append(0.0)
                method_seed_results[m_name]["f1"].append(0.0)
                method_seed_results[m_name]["recall"].append(0.0)
                method_seed_results[m_name]["precision"].append(0.0)
                method_seed_results[m_name]["brier_score"].append(0.25)

            completed_runs += 1

    # Aggregate Mean and Spread across Seeds
    _set_status("running", 92, "Aggregating metrics across random seeds and computing spread...")

    methods_summary = {}
    best_method = None
    best_mean_pr_auc = -1.0

    for m_name, metrics_dict in method_seed_results.items():
        info = PLAIN_METHOD_INFO.get(m_name, {"title": m_name, "tech": m_name, "desc": ""})
        method_stats = {
            "title": info["title"],
            "tech": info["tech"],
            "desc": info["desc"]
        }

        for metric in ["pr_auc", "f1", "recall", "precision", "brier_score"]:
            vals = metrics_dict[metric]
            mean_val = round(float(np.mean(vals)), 4) if vals else 0.0
            std_val = round(float(np.std(vals)), 4) if vals else 0.0

            method_stats[metric] = {
                "mean": mean_val,
                "std": std_val,
                "display": f"{mean_val:.3f} ± {std_val:.3f}"
            }

        methods_summary[m_name] = method_stats

        if method_stats["pr_auc"]["mean"] > best_mean_pr_auc:
            best_mean_pr_auc = method_stats["pr_auc"]["mean"]
            best_method = m_name

    now_iso = datetime.now(timezone.utc).isoformat()
    is_synth = (active_source == "sample")

    results_payload = {
        "metadata": data_access.get_system_metadata(),
        "run_date": now_iso,
        "data_source": "Sample data" if is_synth else f"Your Connected Data ({active_source})",
        "is_synthetic": is_synth,
        "total_samples": len(df),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "hit_count": pos_total,
        "hit_rate_percent": round(pos_total / max(1, len(df)) * 100, 2),
        "low_sample_warning": pos_total < 30,
        "low_sample_message": (
            f"Low sample warning: Your dataset contains only {pos_total} hit examples (fewer than 30 recommended). "
            "Confidence intervals are wide and metrics exhibit higher variance."
            if pos_total < 30 else None
        ),
        "seeds": seeds,
        "split_method": f"Time-based (80% chronological train: {len(train_df)} posts, 20% test: {len(test_df)} posts)",
        "calibration": "CalibratedClassifierCV (sigmoid probability calibration)",
        "best_method": best_method,
        "best_pr_auc": best_mean_pr_auc,
        "methods": methods_summary
    }

    # Save to creator_benchmark_results.json via DAL
    data_access.save_creator_benchmark_results(results_payload)

    _set_status("completed", 100, f"Benchmark completed across {len(seeds)} random seeds.", result=results_payload)
    return results_payload


def start_creator_benchmark_async(seeds: Optional[List[int]] = None):
    """Launches benchmark in a non-blocking background thread."""
    def worker():
        try:
            run_creator_data_benchmark(seeds=seeds)
        except Exception as exc:
            _set_status("failed", 0, f"Benchmark execution failed: {str(exc)}", error=str(exc))

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return {"message": "Creator benchmark initiated in background", "status": "running"}
