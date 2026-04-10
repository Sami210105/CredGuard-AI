from typing import Optional

from pydantic import BaseModel, Field


class UserInput(BaseModel):
    """
    Input fields for the CredGuard scoring API.

    Fields are mapped to the top-importance features from the LightGBM ensemble.
    All fields are Optional — missing values become NaN in the feature vector,
    which LightGBM handles natively (trained on real missing data).

    Field → Dataset column mapping:
      age_years          → AGE_YEARS / DAYS_BIRTH
      employed_years     → EMPLOYED_YEARS / DAYS_EMPLOYED
      income             → AMT_INCOME_TOTAL
      credit_amount      → AMT_CREDIT
      annuity_amount     → AMT_ANNUITY
      goods_price        → AMT_GOODS_PRICE
      ext_source_1       → EXT_SOURCE_1  (bureau score, 0–1)
      ext_source_2       → EXT_SOURCE_2  (bureau score, 0–1)
      ext_source_3       → EXT_SOURCE_3  (bureau score, 0–1)
      gender             → CODE_GENDER   ("M" | "F")
      owns_car           → FLAG_OWN_CAR  ("Y" | "N")
      owns_realty        → FLAG_OWN_REALTY ("Y" | "N")
      family_members     → CNT_FAM_MEMBERS
      children           → CNT_CHILDREN
      income_type        → NAME_INCOME_TYPE
      education_type     → NAME_EDUCATION_TYPE
      organization_type  → ORGANIZATION_TYPE
    """

    # Demographics
    age_years: Optional[float] = Field(None, ge=18, le=100, description="Applicant age in years")
    gender: Optional[str] = Field(None, description="'M' or 'F'")
    family_members: Optional[float] = Field(None, ge=1, le=20)
    children: Optional[int] = Field(None, ge=0, le=10)
    owns_car: Optional[str] = Field(None, description="'Y' or 'N'")
    owns_realty: Optional[str] = Field(None, description="'Y' or 'N'")

    # Employment
    employed_years: Optional[float] = Field(None, ge=0, le=50, description="Years at current job")
    income_type: Optional[str] = Field(None, description="e.g. 'Working', 'Commercial associate', 'State servant'")
    organization_type: Optional[str] = Field(None, description="Employer organisation type")
    education_type: Optional[str] = Field(None, description="e.g. 'Higher education', 'Secondary / secondary special'")

    # Financials
    income: Optional[float] = Field(None, ge=0, description="Total annual income")
    credit_amount: Optional[float] = Field(None, ge=0, description="Requested loan amount")
    annuity_amount: Optional[float] = Field(None, ge=0, description="Monthly loan annuity")
    goods_price: Optional[float] = Field(None, ge=0, description="Price of goods being financed")

    # External bureau scores (0–1 normalised, higher = better)
    ext_source_1: Optional[float] = Field(None, ge=0.0, le=1.0)
    ext_source_2: Optional[float] = Field(None, ge=0.0, le=1.0)
    ext_source_3: Optional[float] = Field(None, ge=0.0, le=1.0)
