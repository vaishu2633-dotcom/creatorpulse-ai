"""
CreatorPulse AI - Imbalance Lab (Performance Lab) Router
----------------------------------------------------------
Exposes the benchmark results comparing imbalance methods
(none, class_weight, random oversampling, SMOTE, SMOTE-Tomek, BalancedRandomForest, XGBoost, threshold tuning)
across 80:20, 90:10, 95:5, and 99:1 ratios.
"""

from fastapi import APIRouter, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.services import data_access
from backend.services import benchmark_runner

router = APIRouter(prefix="/api/ml", tags=["ML Performance Lab"])

class RunBenchmarkRequest(BaseModel):
    seeds: Optional[List[int]] = Field(default=[42, 123, 999], description="Random seeds for multi-seed variance evaluation")

@router.get("/results")
def get_ml_results():
    results = data_access.get_imbalance_lab_results()
    return {
        "metadata": data_access.get_system_metadata(),
        "data": results
    }

@router.get("/creator-benchmark")
def get_creator_benchmark():
    """Returns empirical benchmark results on creator data if already executed."""
    results = data_access.get_creator_benchmark_results()
    return {
        "metadata": data_access.get_system_metadata(),
        "has_results": results is not None,
        "results": results
    }

@router.post("/run-benchmark")
def run_benchmark(req: Optional[RunBenchmarkRequest] = None):
    """Starts empirical imbalanced benchmark across multiple random seeds in background."""
    seeds = req.seeds if req and req.seeds else [42, 123, 999]
    res = benchmark_runner.start_creator_benchmark_async(seeds=seeds)
    return {
        "metadata": data_access.get_system_metadata(),
        "status": "started",
        "message": f"Benchmark launched in background across {len(seeds)} random seeds"
    }

@router.get("/benchmark-status")
def get_benchmark_progress():
    """Polls progress of running empirical ML benchmark."""
    status = benchmark_runner.get_benchmark_status()
    return {
        "metadata": data_access.get_system_metadata(),
        "status": status
    }
