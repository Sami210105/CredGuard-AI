from typing import Dict, List, Optional

from pydantic import BaseModel

class TopFactor(BaseModel):
    feature: str
    label: str
    weight: float
    direction: str  # "positive" | "negative" | "neutral"


class Counterfactual(BaseModel):
    feature: str
    label: str  
    current_value: Optional[float]
    suggested_value: float
    impact_direction: str  # "increase" | "decrease"


class LLMInsights(BaseModel):
    result_explanation: str
    situation_summary: str
    improvement_plan: str


class InferenceResponse(BaseModel):
    # Core score — CredScore out of 100
    cred_score: float           # prob_approval × 100, rounded to 1 dp
    prob_default: float         # raw default probability (0–1)
    prob_approval: float        # 1 - prob_default

    # Risk classification
    risk_tier: str              # "Low" | "Medium" | "High" | "Very High"
    decision: str               # "Approved" | "Conditionally Approved" | "Rejected"
    model_confidence: float     # std-dev-based confidence across 25 models (0–1)

    # Interpretability
    top_factors: List[TopFactor]
    counterfactuals: List[Counterfactual]

    # LLM narrative (3 sections)
    llm_insights: LLMInsights

    # Meta
    ensemble_model_count: int
    oof_auc: float
