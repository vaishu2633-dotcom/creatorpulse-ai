"""
CreatorPulse AI - ML Sentiment Classifier
-----------------------------------------
Loads the trained TF-IDF vectorizer and best-performing ML model.
Performs real-time text classification for YouTube comments.
"""

import os
import sys
import json
import joblib
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from backend.ml.preprocessor import clean_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

_vectorizer = None
_best_model = None
_model_comparison = None


def load_ml_assets():
    """Lazy loader for trained TF-IDF vectorizer and best model."""
    global _vectorizer, _best_model, _model_comparison

    if _best_model is not None and _vectorizer is not None:
        return _vectorizer, _best_model, _model_comparison

    vec_path = os.path.join(SAVED_MODELS_DIR, "tfidf_vectorizer.joblib")
    model_path = os.path.join(SAVED_MODELS_DIR, "best_model.joblib")
    comp_path = os.path.join(SAVED_MODELS_DIR, "model_comparison.json")

    # If assets don't exist yet, run the trainer
    if not (os.path.exists(vec_path) and os.path.exists(model_path)):
        from backend.ml.trainer import train_and_evaluate_models
        train_and_evaluate_models()

    _vectorizer = joblib.load(vec_path)
    _best_model = joblib.load(model_path)

    if os.path.exists(comp_path):
        with open(comp_path, "r", encoding="utf-8") as f:
            _model_comparison = json.load(f)
    else:
        _model_comparison = {}

    return _vectorizer, _best_model, _model_comparison


def get_model_metadata() -> Dict[str, Any]:
    """Returns the ML model comparison and training metadata."""
    _, _, comp = load_ml_assets()
    return comp or {}


def classify_single_text(text: str) -> Dict[str, Any]:
    """
    Classifies a single text string into positive, negative, or neutral.
    Returns:
    {
        "sentiment": "positive" | "negative" | "neutral",
        "confidence": float,
        "clean_text": str
    }
    """
    cleaned = clean_text(text)
    if not cleaned.strip():
        return {
            "sentiment": "neutral",
            "confidence": 0.333,
            "clean_text": ""
        }

    vec, model, _ = load_ml_assets()
    tfidf_vec = vec.transform([cleaned])

    # If the text has no matching features in the vocabulary,
    # it carries no positive or negative sentiment evidence; classify as neutral.
    if tfidf_vec.nnz == 0:
        return {
            "sentiment": "neutral",
            "confidence": 0.333,
            "clean_text": cleaned
        }

    confidence = 0.85
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(tfidf_vec)[0]
        classes = list(model.classes_)
        # If probabilities are completely flat/tied (total uncertainty), classify as neutral
        if max(probas) - min(probas) < 0.02:
            return {
                "sentiment": "neutral",
                "confidence": round(float(1.0 / len(classes)), 3),
                "clean_text": cleaned
            }
        pred = model.predict(tfidf_vec)[0]
        if pred in classes:
            idx = classes.index(pred)
            confidence = round(float(probas[idx]), 3)
    else:
        pred = model.predict(tfidf_vec)[0]

    return {
        "sentiment": str(pred),
        "confidence": confidence,
        "clean_text": cleaned
    }


def classify_comments(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Classifies a batch of comments or texts using the trained ML model.
    """
    if not texts:
        return []

    cleaned_texts = [clean_text(t) for t in texts]
    vec, model, _ = load_ml_assets()

    # Filter non-empty for vectorizer
    results = []
    non_empty_indices = [i for i, c in enumerate(cleaned_texts) if c.strip()]
    non_empty_cleaned = [cleaned_texts[i] for i in non_empty_indices]

    predictions = []
    confidences = []

    if non_empty_cleaned:
        tfidf_mat = vec.transform(non_empty_cleaned)
        preds = model.predict(tfidf_mat)
        has_probas = hasattr(model, "predict_proba")
        probas = model.predict_proba(tfidf_mat) if has_probas else None
        classes = list(model.classes_) if has_probas else []

        for row_idx in range(len(non_empty_cleaned)):
            row_nnz = tfidf_mat[row_idx].nnz
            prob_row = probas[row_idx] if has_probas else None

            # If zero features matched or probabilities are flat (uncertainty), classify as neutral
            if row_nnz == 0 or (has_probas and (max(prob_row) - min(prob_row) < 0.02)):
                predictions.append("neutral")
                confidences.append(0.333)
            else:
                p = str(preds[row_idx])
                predictions.append(p)
                if has_probas:
                    idx = classes.index(p) if p in classes else 0
                    confidences.append(round(float(prob_row[idx]), 3))
                else:
                    confidences.append(0.85)

    pred_map = {idx: (p, c) for idx, p, c in zip(non_empty_indices, predictions, confidences)}

    for i, orig_text in enumerate(texts):
        if i in pred_map:
            sentiment, conf = pred_map[i]
            results.append({
                "text": orig_text,
                "clean_text": cleaned_texts[i],
                "sentiment": sentiment,
                "confidence": conf
            })
        else:
            results.append({
                "text": orig_text,
                "clean_text": "",
                "sentiment": "neutral",
                "confidence": 0.333
            })

    return results
