"""
CreatorPulse AI - Imbalance Lab (Performance Lab) Router
----------------------------------------------------------
Exposes the benchmark results comparing imbalance methods
(none, class_weight, random oversampling, SMOTE, SMOTE-Tomek, BalancedRandomForest, XGBoost, threshold tuning)
across 80:20, 90:10, 95:5, and 99:1 ratios.
"""

from fastapi import APIRouter
from backend.services import data_access

router = APIRouter(prefix="/api/ml", tags=["ML Performance Lab"])

@router.get("/results")
def get_ml_results():
    results = data_access.get_imbalance_lab_results()
    return {
        "metadata": data_access.get_system_metadata(),
        "data": results
    }
