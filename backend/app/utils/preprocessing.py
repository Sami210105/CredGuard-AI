"""
preprocessing.py
────────────────
Maps a UserInput (sparse mobile-form fields) onto the full 318-feature
vector expected by the LightGBM ensemble.

Strategy
────────
• Known fields are placed into their exact dataset columns.
• Derived features (ratios, aggregates) are computed where possible.
• Everything else is left as NaN — LightGBM handles missing values natively;
  the models were trained on the original Home Credit dataset which has many
  real NaN values, so this is correct behaviour (not a hack).
"""

import math
from typing import Optional

import numpy as np
import pandas as pd

# Feature ordering is defined by the training pipeline
FEATURE_NAMES_PATH = None   # injected by ml_model on first import
_feature_names: list[str] = []


def set_feature_names(names: list[str]) -> None:
    global _feature_names
    _feature_names = names


# ── Human-readable labels for top features ─────────────────────────────────
FEATURE_LABELS: dict[str, str] = {
    "EXT_SOURCE_MEAN":            "External credit score (mean)",
    "EXT_SOURCE_MAX":             "External credit score (best)",
    "EXT_SOURCE_MIN":             "External credit score (worst)",
    "EXT_SOURCE_1":               "Credit bureau score 1",
    "EXT_SOURCE_2":               "Credit bureau score 2",
    "EXT_SOURCE_3":               "Credit bureau score 3",
    "CODE_GENDER":                "Gender",
    "AMT_ANNUITY":                "Monthly annuity (EMI)",
    "CREDIT_TERM_MONTHS":         "Loan tenure (months)",
    "GOODS_CREDIT_RATIO":         "Goods-to-credit ratio",
    "NAME_EDUCATION_TYPE":        "Education level",
    "OWN_CAR_AGE":                "Car age",
    "NAME_FAMILY_STATUS":         "Marital status",
    "DAYS_EMPLOYED":              "Days employed",
    "EMPLOYED_YEARS":             "Years employed",
    "ANNUITY_INCOME_RATIO":       "EMI-to-income ratio",
    "CREDIT_INCOME_RATIO":        "Credit-to-income ratio",
    "AMT_CREDIT":                 "Loan amount",
    "AMT_INCOME_TOTAL":           "Annual income",
    "AGE_YEARS":                  "Applicant age",
    "NAME_INCOME_TYPE":           "Income type",
    "ORGANIZATION_TYPE":          "Employer type",
    "INCOME_PER_PERSON":          "Income per family member",
    "EXT_SOURCE_PROD":            "Credit score product",
    "EXT_SOURCE_STD":             "Credit score variability",
    "DAYS_BIRTH":                 "Age (days)",
    "DAYS_ID_PUBLISH":            "ID document age (days)",
    "REGION_POPULATION_RELATIVE": "Region population density",
}


def _safe(value: Optional[float]) -> float:
    """Return NaN if value is None, else the value."""
    return float("nan") if value is None else float(value)


def build_feature_vector(data) -> pd.DataFrame:
    """
    Build a 1-row DataFrame with all 318 features in training order.
    Unmapped features are NaN; LightGBM splits on the NaN branch internally.

    Parameters
    ----------
    data : UserInput
        Validated Pydantic model from the API request.

    Returns
    -------
    pd.DataFrame  shape (1, 318)
    """
    if not _feature_names:
        raise RuntimeError("Feature names not loaded — call set_feature_names() first")

    # Start with a row of all NaN
    row: dict[str, float] = {f: float("nan") for f in _feature_names}

    # ── Demographics ────────────────────────────────────────────────────────
    age = _safe(data.age_years)
    if not math.isnan(age):
        row["AGE_YEARS"] = age
        row["DAYS_BIRTH"] = -age * 365.25         # dataset stores as negative days

    gender = (data.gender or "").strip().upper()
    if gender in ("M", "F"):
        row["CODE_GENDER"] = 0.0 if gender == "M" else 1.0

    fam = _safe(data.family_members)
    if not math.isnan(fam):
        row["CNT_FAM_MEMBERS"] = fam

    children = _safe(data.children)
    if not math.isnan(children):
        row["CNT_CHILDREN"] = children
        if not math.isnan(fam) and fam > 0:
            row["CHILDREN_RATIO"] = children / fam

    row["FLAG_OWN_CAR"]    = 1.0 if (data.owns_car or "").upper() == "Y" else 0.0
    row["FLAG_OWN_REALTY"] = 1.0 if (data.owns_realty or "").upper() == "Y" else 0.0

    # ── Employment ──────────────────────────────────────────────────────────
    emp = _safe(data.employed_years)
    if not math.isnan(emp):
        row["EMPLOYED_YEARS"] = emp
        row["DAYS_EMPLOYED"]  = -emp * 365.25
        if not math.isnan(age) and age > 0:
            row["DAYS_EMPLOYED_RATIO"] = emp / age

    # ── Financials ──────────────────────────────────────────────────────────
    income  = _safe(data.income)
    credit  = _safe(data.credit_amount)
    annuity = _safe(data.annuity_amount)
    goods   = _safe(data.goods_price)

    row["AMT_INCOME_TOTAL"] = income
    row["AMT_CREDIT"]       = credit
    row["AMT_ANNUITY"]      = annuity
    row["AMT_GOODS_PRICE"]  = goods

    if not math.isnan(income) and income > 0:
        if not math.isnan(credit):
            row["CREDIT_INCOME_RATIO"] = credit / income
        if not math.isnan(annuity):
            row["ANNUITY_INCOME_RATIO"] = annuity / income
        fam_size = fam if not math.isnan(fam) else 1.0
        row["INCOME_PER_PERSON"] = income / fam_size

    if not math.isnan(credit) and credit > 0:
        if not math.isnan(annuity) and annuity > 0:
            row["CREDIT_TERM_MONTHS"] = credit / annuity
        if not math.isnan(goods):
            row["GOODS_CREDIT_RATIO"] = goods / credit

    # ── External bureau scores ───────────────────────────────────────────────
    e1 = _safe(data.ext_source_1)
    e2 = _safe(data.ext_source_2)
    e3 = _safe(data.ext_source_3)

    row["EXT_SOURCE_1"] = e1
    row["EXT_SOURCE_2"] = e2
    row["EXT_SOURCE_3"] = e3

    ext_vals = [v for v in (e1, e2, e3) if not math.isnan(v)]
    if ext_vals:
        row["EXT_SOURCE_MEAN"] = float(np.mean(ext_vals))
        row["EXT_SOURCE_MAX"]  = float(np.max(ext_vals))
        row["EXT_SOURCE_MIN"]  = float(np.min(ext_vals))
        row["EXT_SOURCE_STD"]  = float(np.std(ext_vals)) if len(ext_vals) > 1 else 0.0
        if len(ext_vals) == 3:
            row["EXT_SOURCE_PROD"] = float(e1 * e2 * e3)
        if not math.isnan(e1) and not math.isnan(e2):
            row["EXT12_RATIO"] = e1 / (e2 + 1e-9)
        if not math.isnan(e2) and not math.isnan(e3):
            row["EXT23_RATIO"] = e2 / (e3 + 1e-9)
        if not math.isnan(annuity):
            row["EXT_ANNUITY_X2"] = row.get("EXT_SOURCE_MEAN", float("nan")) * annuity
        if not math.isnan(credit):
            row["EXT_CREDIT_X2"] = row.get("EXT_SOURCE_MEAN", float("nan")) * credit

    # ── Age-ratio features ───────────────────────────────────────────────────
    if not math.isnan(age) and age > 0:
        if not math.isnan(data.employed_years or float("nan")):
            row["ID_PUBLISH_AGE_RATIO"] = 0.2   # placeholder; user doesn't supply this
            row["REG_AGE_RATIO"]        = 0.1   # placeholder

    return pd.DataFrame([row], columns=_feature_names)


def get_feature_label(feature_name: str) -> str:
    """Return a human-friendly label for a feature column name."""
    return FEATURE_LABELS.get(feature_name, feature_name.replace("_", " ").title())
