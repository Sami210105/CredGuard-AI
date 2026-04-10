"""
ml_model.py
───────────
Loads all 25 LightGBM models (5 folds × 5 seeds) from notebooks/output/
and exposes:

  predict_ensemble(data: UserInput)
    → prob_default, cred_score, model_confidence, top_factors

Models are loaded once at startup into a module-level singleton to avoid
re-loading on every request.
"""

import json
import logging
import pickle
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from app.config import settings
from app.models.request import UserInput
from app.utils.preprocessing import (
    build_feature_vector,
    get_feature_label,
    set_feature_names,
)

logger = logging.getLogger(__name__)

# ── Feature importance from training (used to annotate top_factors) ─────────
_FEATURE_IMPORTANCE: dict[str, float] = {}
_feature_names_loaded: list[str] = []


class EnsembleModel:
    """Container for all 25 LightGBM booster objects."""

    def __init__(self, models: list[Any], feature_names: list[str], config: dict):
        self.models = models
        self.feature_names = feature_names
        self.config = config
        self.n_folds: int = config.get("n_folds", 5)
        self.seeds: list[int] = config.get("seeds", [42, 43, 44, 45, 46])
        self.oof_auc: float = config.get("lgbm_oof_auc", 0.0)

    @property
    def count(self) -> int:
        return len(self.models)


@lru_cache(maxsize=1)
def load_ensemble() -> EnsembleModel:
    """
    Load all lgbm_fold{f}_seed{s}.pkl files from MODEL_DIR.
    Called once — subsequent calls return the cached instance.
    """
    model_dir: Path = settings.MODEL_DIR
    logger.info(f"Loading LightGBM ensemble from {model_dir} ...")

    # Load feature names
    with open(model_dir / "feature_names.json") as f:
        feature_names: list[str] = json.load(f)
    set_feature_names(feature_names)
    global _feature_names_loaded
    _feature_names_loaded = feature_names

    # Load model config
    with open(model_dir / "model_config.json") as f:
        config: dict = json.load(f)

    # Load feature importance
    global _FEATURE_IMPORTANCE
    try:
        import pandas as pd
        fi_df = pd.read_csv(model_dir / "feature_importance.csv")
        _FEATURE_IMPORTANCE = dict(zip(fi_df["feature"], fi_df["importance"]))
    except Exception as e:
        logger.warning(f"Could not load feature_importance.csv: {e}")

    n_folds = config.get("n_folds", 5)
    seeds   = config.get("seeds", [42, 43, 44, 45, 46])

    models: list[Any] = []
    missing: list[str] = []
    for fold in range(n_folds):
        for seed in seeds:
            pkl_path = model_dir / f"lgbm_fold{fold}_seed{seed}.pkl"
            if pkl_path.exists():
                with open(pkl_path, "rb") as f:
                    models.append(pickle.load(f))
                logger.debug(f"Loaded {pkl_path.name}")
            else:
                missing.append(str(pkl_path))

    if missing:
        logger.warning(f"Missing model files: {missing}")
    if not models:
        raise RuntimeError("No LightGBM model files found — check MODEL_DIR in config")

    logger.info(f"Ensemble ready: {len(models)} models loaded (expected 25)")
    return EnsembleModel(models, feature_names, config)


def predict_ensemble(data: UserInput) -> dict:
    """
    Run ensemble inference on a UserInput.

    Returns
    -------
    dict with keys:
        prob_default      float  — mean default probability (0–1)
        prob_approval     float  — 1 - prob_default
        cred_score        float  — prob_approval × 100, 1 dp
        model_confidence  float  — ensemble agreement (1 - std of predictions)
        top_factors       list   — top 6 features by importance, with direction
    """
    ensemble = load_ensemble()
    X = build_feature_vector(data)

    predictions: list[float] = []
    for model in ensemble.models:
        try:
            prob = model.predict(X, num_iteration=model.best_iteration)[0]
            predictions.append(float(prob))
        except Exception as e:
            logger.warning(f"Model prediction failed: {e}")

    if not predictions:
        raise RuntimeError("All models failed to produce predictions")

    preds_arr       = np.array(predictions)
    prob_default    = float(np.mean(preds_arr))
    prob_approval   = 1.0 - prob_default
    cred_score      = round(prob_approval * 100, 1)
    pred_std        = float(np.std(preds_arr))
    # Confidence: 1 when all models agree (std=0), lower when they diverge
    model_confidence = round(max(0.0, 1.0 - pred_std * 10), 3)

    # ── Risk tier ────────────────────────────────────────────────────────────
    if prob_default < 0.15:
        risk_tier = "Low"
        decision  = "Approved"
    elif prob_default < 0.30:
        risk_tier = "Medium"
        decision  = "Conditionally Approved"
    elif prob_default < 0.50:
        risk_tier = "High"
        decision  = "Rejected"
    else:
        risk_tier = "Very High"
        decision  = "Rejected"

    # ── Top factors from feature importance ──────────────────────────────────
    # Use global importance ranking filtered to features the user actually
    # provided (non-NaN) first, then fill with top overall features.
    x_row = X.iloc[0]
    provided_features = [f for f in _FEATURE_IMPORTANCE if not _is_nan(x_row.get(f, float("nan")))]
    all_sorted = sorted(_FEATURE_IMPORTANCE.items(), key=lambda kv: kv[1], reverse=True)

    seen: set[str] = set()
    top_features: list[tuple[str, float]] = []
    # Prefer features the user supplied
    for feat, imp in all_sorted:
        if feat in provided_features and feat not in seen:
            top_features.append((feat, imp))
            seen.add(feat)
        if len(top_features) >= 6:
            break
    # Fall back to overall top if we don't have enough
    for feat, imp in all_sorted:
        if feat not in seen:
            top_features.append((feat, imp))
            seen.add(feat)
        if len(top_features) >= 6:
            break

    top_factors = []
    for feat, imp in top_features:
        val = x_row.get(feat, float("nan"))
        direction = _infer_direction(feat, val, prob_default)
        top_factors.append({
            "feature":   feat,
            "label":     get_feature_label(feat),
            "weight":    round(float(imp), 4),
            "direction": direction,
        })

    return {
        "prob_default":      round(prob_default, 4),
        "prob_approval":     round(prob_approval, 4),
        "cred_score":        cred_score,
        "risk_tier":         risk_tier,
        "decision":          decision,
        "model_confidence":  model_confidence,
        "top_factors":       top_factors,
        "ensemble_model_count": ensemble.count,
        "oof_auc":           ensemble.oof_auc,
        "_X":                X,          # passed to DiCE — removed before response
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _is_nan(v) -> bool:
    try:
        import math
        return math.isnan(float(v))
    except (TypeError, ValueError):
        return True


def _infer_direction(feature: str, value, prob_default: float) -> str:
    """
    Heuristic: features whose higher values correlate with lower default risk
    are 'positive' when high, 'negative' when low.
    """
    positive_features = {
        "EXT_SOURCE_MEAN", "EXT_SOURCE_MAX", "EXT_SOURCE_MIN",
        "EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3",
        "EXT_SOURCE_PROD", "EMPLOYED_YEARS", "DAYS_EMPLOYED",
        "INCOME_PER_PERSON", "AMT_INCOME_TOTAL", "inst_early_rate",
        "prev_approval_rate", "pos_completed_rate",
    }
    negative_features = {
        "ANNUITY_INCOME_RATIO", "CREDIT_INCOME_RATIO",
        "bur_CREDIT_DEBT_RATIO_max", "bur_CREDIT_DEBT_RATIO_mean",
        "inst_late_rate", "inst_recent_late_rate",
        "DEF_30_CNT_SOCIAL_CIRCLE", "DEF_60_CNT_SOCIAL_CIRCLE",
        "pos_dpd_mean", "pos_dpd_max", "cc_dpd_mean", "cc_dpd_max",
    }
    if feature in positive_features:
        return "positive" if not _is_nan(value) and float(value) > 0.5 else "negative"
    if feature in negative_features:
        return "negative" if not _is_nan(value) and float(value) > 0.3 else "positive"
    return "neutral"
