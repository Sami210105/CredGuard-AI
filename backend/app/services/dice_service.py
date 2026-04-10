"""
dice_service.py
───────────────
Generates counterfactual explanations using DiCE-ML.

We use the "random" method because:
  • No background training dataset needed (391 MB X.npy stays offline)
  • Works with any predict function, including our 25-model ensemble
  • Fast enough for real-time API use

Returns up to 5 counterfactuals structured as:
  { feature, label, current_value, suggested_value, impact_direction }
"""

import logging
import math
from typing import Any

import numpy as np
import pandas as pd

from app.utils.preprocessing import build_feature_vector, get_feature_label

logger = logging.getLogger(__name__)

# Top features we allow DiCE to modify (actionable, user-controllable)
MUTABLE_FEATURES = [
    "EXT_SOURCE_1",
    "EXT_SOURCE_2",
    "EXT_SOURCE_3",
    "EXT_SOURCE_MEAN",
    "ANNUITY_INCOME_RATIO",
    "CREDIT_INCOME_RATIO",
    "CREDIT_TERM_MONTHS",
    "EMPLOYED_YEARS",
    "AMT_CREDIT",
    "AMT_ANNUITY",
    "GOODS_CREDIT_RATIO",
]

# Feature bounds for counterfactual search
FEATURE_BOUNDS = {
    "EXT_SOURCE_1":        (0.0, 1.0),
    "EXT_SOURCE_2":        (0.0, 1.0),
    "EXT_SOURCE_3":        (0.0, 1.0),
    "EXT_SOURCE_MEAN":     (0.0, 1.0),
    "ANNUITY_INCOME_RATIO": (0.05, 0.60),
    "CREDIT_INCOME_RATIO": (0.5, 10.0),
    "CREDIT_TERM_MONTHS":  (6.0, 120.0),
    "EMPLOYED_YEARS":      (0.0, 40.0),
    "AMT_CREDIT":          (45000, 4050000),
    "AMT_ANNUITY":         (2000, 250000),
    "GOODS_CREDIT_RATIO":  (0.1, 1.5),
}


def _ensemble_predict_fn(models: list[Any]):
    """Return a vectorised predict function for DiCE."""
    def _predict(X: np.ndarray) -> np.ndarray:
        preds = np.zeros(len(X))
        for model in models:
            try:
                p = model.predict(pd.DataFrame(X))
                preds += p
            except Exception:
                pass
        preds /= max(len(models), 1)
        # DiCE needs shape (N, 2) for binary classification: [p_positive, p_negative]
        return np.column_stack([preds, 1.0 - preds])
    return _predict


def _try_dice(data, models: list[Any], X: pd.DataFrame, n_cfs: int = 5) -> list[dict]:
    """
    Attempt DiCE counterfactual generation.
    Returns a list of structured counterfactual dicts on success, [] on failure.
    """
    try:
        import dice_ml
        from dice_ml import Dice

        # Build a minimal feature metadata dict for DiCE
        continuous_features = [f for f in MUTABLE_FEATURES if f in X.columns]
        feature_range = {
            f: list(FEATURE_BOUNDS.get(f, (float(X[f].min()), float(X[f].max()))))
            for f in continuous_features
        }

        dice_data = dice_ml.Data(
            features={f: "continuous" for f in continuous_features},
            outcome_name="TARGET",
        )

        predict_fn = _ensemble_predict_fn(models)
        dice_model = dice_ml.Model(model=predict_fn, backend="sklearn", model_type="classifier")

        exp = Dice(dice_data, dice_model, method="random")

        query = X[continuous_features].fillna(0.5)  # fill NaN with midpoint for DiCE query
        cf_result = exp.generate_counterfactuals(
            query_instances=query,
            total_CFs=n_cfs,
            desired_class="opposite",
            features_to_vary=continuous_features,
            permitted_range=feature_range,
        )

        cfs_df = cf_result.cf_examples_list[0].final_cfs_df
        if cfs_df is None or cfs_df.empty:
            return []

        results = []
        for _, cf_row in cfs_df.iterrows():
            for feat in continuous_features:
                orig_val = float(query.iloc[0][feat]) if feat in query.columns else float("nan")
                cf_val   = float(cf_row[feat]) if feat in cf_row.index else float("nan")
                if math.isnan(orig_val) or math.isnan(cf_val):
                    continue
                delta = cf_val - orig_val
                if abs(delta) < 1e-6:
                    continue
                results.append({
                    "feature":         feat,
                    "label":           get_feature_label(feat),
                    "current_value":   round(orig_val, 4),
                    "suggested_value": round(cf_val, 4),
                    "impact_direction": "increase" if delta > 0 else "decrease",
                })

        # De-duplicate: keep the largest change per feature
        seen: dict[str, dict] = {}
        for r in results:
            f = r["feature"]
            if f not in seen or abs(r["suggested_value"] - r["current_value"]) > \
                    abs(seen[f]["suggested_value"] - seen[f]["current_value"]):
                seen[f] = r

        return list(seen.values())[:5]

    except Exception as e:
        logger.warning(f"DiCE generation failed ({type(e).__name__}): {e}")
        return []


def _heuristic_counterfactuals(data, X: pd.DataFrame, prob_default: float) -> list[dict]:
    """
    Fallback: generate rule-based counterfactuals from known high-importance features.
    Suggests concrete changes that would likely reduce default probability.
    """
    suggestions = []
    row = X.iloc[0]

    def _add(feat: str, current, suggested, direction: str):
        suggestions.append({
            "feature":         feat,
            "label":           get_feature_label(feat),
            "current_value":   round(float(current), 4) if not math.isnan(float(current)) else None,
            "suggested_value": round(float(suggested), 4),
            "impact_direction": direction,
        })

    # EXT_SOURCE_MEAN — most important feature
    ext_mean = row.get("EXT_SOURCE_MEAN", float("nan"))
    if not math.isnan(ext_mean) and ext_mean < 0.55:
        _add("EXT_SOURCE_MEAN", ext_mean, min(ext_mean + 0.15, 1.0), "increase")

    # ANNUITY_INCOME_RATIO — if EMI is heavy relative to income, suggest reducing
    anim_ratio = row.get("ANNUITY_INCOME_RATIO", float("nan"))
    if not math.isnan(anim_ratio) and anim_ratio > 0.25:
        _add("ANNUITY_INCOME_RATIO", anim_ratio, max(anim_ratio - 0.08, 0.10), "decrease")

    # CREDIT_TERM_MONTHS — longer term = lower monthly burden
    term = row.get("CREDIT_TERM_MONTHS", float("nan"))
    if not math.isnan(term) and term < 48:
        _add("CREDIT_TERM_MONTHS", term, term + 12, "increase")

    # EXT_SOURCE_2 — second most actionable bureau score
    e2 = row.get("EXT_SOURCE_2", float("nan"))
    if not math.isnan(e2) and e2 < 0.60:
        _add("EXT_SOURCE_2", e2, min(e2 + 0.10, 1.0), "increase")

    # EMPLOYED_YEARS — can't change instantly, but worth surfacing
    emp = row.get("EMPLOYED_YEARS", float("nan"))
    if not math.isnan(emp) and emp < 2:
        _add("EMPLOYED_YEARS", emp, emp + 1.0, "increase")

    return suggestions[:5]


def generate_counterfactuals(data, ml_result: dict) -> list[dict]:
    """
    Main entry point.
    Tries DiCE first, falls back to heuristic suggestions.

    Parameters
    ----------
    data       : UserInput
    ml_result  : dict from predict_ensemble() — must include '_X' and 'model' list

    Returns
    -------
    list of counterfactual dicts (max 5)
    """
    from app.services.ml_model import load_ensemble
    ensemble = load_ensemble()
    X: pd.DataFrame = ml_result.get("_X", build_feature_vector(data))
    prob_default: float = ml_result.get("prob_default", 0.5)

    # Try DiCE first (only useful if default risk is meaningful)
    if 0.10 < prob_default < 0.90:
        dice_cfs = _try_dice(data, ensemble.models, X, n_cfs=5)
        if dice_cfs:
            return dice_cfs

    # Heuristic fallback
    return _heuristic_counterfactuals(data, X, prob_default)
