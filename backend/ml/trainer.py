"""
CreatorPulse AI - ML Trainer & Model Comparison Engine
------------------------------------------------------
Trains and compares four traditional Machine Learning algorithms for YouTube comment sentiment classification:
1. Multinomial Naive Bayes
2. Logistic Regression
3. Linear Support Vector Machine (Linear SVM)
4. Random Forest Classifier

Pipeline:
- Text Preprocessing & Cleaning (preprocessor.py)
- Train-Test Split (80% Train, 20% Test, stratified, random_state=42) - ZERO data leakage
- TF-IDF Feature Extraction (unigrams & bigrams, sublinear TF)
- Model Training with Scikit-learn
- Full Evaluation:
  * Accuracy
  * Precision (Weighted & Macro)
  * Recall (Weighted & Macro)
  * F1-score (Weighted & Macro)
  * Confusion Matrix (Positive, Neutral, Negative)
- Selection and persistence of the best-performing model based on weighted F1-score.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from backend.ml.preprocessor import clean_text

LABELS = ["positive", "neutral", "negative"]


def train_and_evaluate_models(
    dataset_path: str = None,
    save_dir: str = None
) -> Dict[str, Any]:
    """
    Loads labeled dataset, trains 4 traditional ML algorithms, evaluates them,
    selects the winner based on weighted F1-score, and saves the artifacts to disk.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if dataset_path is None:
        dataset_path = os.path.join(base_dir, "dataset", "sentiment_dataset.csv")
    if save_dir is None:
        save_dir = os.path.join(base_dir, "saved_models")

    os.makedirs(save_dir, exist_ok=True)

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    if "text" not in df.columns or "sentiment" not in df.columns:
        raise ValueError("Dataset must contain 'text' and 'sentiment' columns.")

    # 1. Clean and normalize texts
    print(f"[ML Trainer] Loading {len(df)} samples from {dataset_path}...")
    df["clean_text"] = df["text"].astype(str).apply(clean_text)

    # Filter out empty texts if any
    df = df[df["clean_text"].str.strip().str.len() > 0].reset_index(drop=True)
    X = df["clean_text"].values
    y = df["sentiment"].values

    # 2. Train-Test Split (80% Train, 20% Test with stratification)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[ML Trainer] Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    # 3. TF-IDF Vectorizer (Fit strictly on X_train to avoid data leakage)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        min_df=2,
        sublinear_tf=True
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # 4. Define candidate models (4 traditional ML algorithms)
    candidate_models = {
        "Multinomial Naive Bayes": MultinomialNB(
            alpha=0.5
        ),
        "Logistic Regression": LogisticRegression(
            C=1.5,
            max_iter=1000,
            solver="lbfgs",
            random_state=42
        ),
        "Linear SVM": CalibratedClassifierCV(
            LinearSVC(C=1.0, random_state=42, dual="auto")
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=30,
            random_state=42,
            n_jobs=-1
        )
    }

    results = {}
    best_model_name = None
    best_f1 = -1.0

    print("\n[ML Trainer] Starting model training & evaluation:")
    print("=" * 75)

    for name, model in candidate_models.items():
        # Train model
        model.fit(X_train_tfidf, y_train)

        # Evaluate on test set
        y_pred = model.predict(X_test_tfidf)

        acc = float(accuracy_score(y_test, y_pred))
        prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

        cm = confusion_matrix(y_test, y_pred, labels=LABELS).tolist()
        report = classification_report(y_test, y_pred, labels=LABELS, output_dict=True)

        results[name] = {
            "model_name": name,
            "accuracy": round(acc, 4),
            "precision_weighted": round(prec_weighted, 4),
            "recall_weighted": round(rec_weighted, 4),
            "f1_score_weighted": round(f1_weighted, 4),
            "precision_macro": round(prec_macro, 4),
            "recall_macro": round(rec_macro, 4),
            "f1_score_macro": round(f1_macro, 4),
            "confusion_matrix": {
                "labels": LABELS,
                "matrix": cm
            },
            "per_class_metrics": {
                label: {
                    "precision": round(report[label]["precision"], 4),
                    "recall": round(report[label]["recall"], 4),
                    "f1_score": round(report[label]["f1-score"], 4),
                    "support": int(report[label]["support"])
                }
                for label in LABELS if label in report
            }
        }

        # Save individual model
        slug = name.lower().replace(" ", "_")
        joblib.dump(model, os.path.join(save_dir, f"{slug}.joblib"))

        print(f"-> {name:25s} | Accuracy: {acc*100:.2f}% | Weighted F1: {f1_weighted*100:.2f}%")

        if f1_weighted > best_f1:
            best_f1 = f1_weighted
            best_model_name = name

    print("=" * 75)
    print(f"[ML Trainer] BEST PERFORMING MODEL: {best_model_name} (Weighted F1: {best_f1*100:.2f}%)\n")

    # 5. Persist Best Model and matching TF-IDF Vectorizer
    best_model = candidate_models[best_model_name]
    vectorizer_path = os.path.join(save_dir, "tfidf_vectorizer.joblib")
    best_model_path = os.path.join(save_dir, "best_model.joblib")

    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(best_model, best_model_path)

    # 6. Save Model Comparison Metadata
    comparison_meta = {
        "status": "success",
        "dataset_info": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features_extracted": X_train_tfidf.shape[1],
            "labels": LABELS
        },
        "best_model": best_model_name,
        "models": results,
        "pipeline_details": {
            "vectorizer": "TfidfVectorizer(ngram_range=(1,2), max_features=5000, sublinear_tf=True)",
            "preprocessing": "clean_text (lowercase, URLs, mentions, contractions, emoticons, noise normalization, negations preserved)",
            "test_split_ratio": 0.20,
            "random_state": 42
        }
    }

    comparison_path = os.path.join(save_dir, "model_comparison.json")
    with open(comparison_path, "w", encoding="utf-8") as f:
        json.dump(comparison_meta, f, indent=2)

    print(f"[ML Trainer] Artifacts saved in {save_dir}")
    print(f"  - Vectorizer: {vectorizer_path}")
    print(f"  - Best Model: {best_model_path}")
    print(f"  - Comparison JSON: {comparison_path}")

    return comparison_meta


if __name__ == "__main__":
    train_and_evaluate_models()
