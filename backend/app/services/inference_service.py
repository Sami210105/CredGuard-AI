"""
inference_service.py
────────────────────
Orchestrates the three-stage inference pipeline:
  1. ML ensemble  →  score, top_factors
  2. DiCE         →  counterfactuals
  3. LLM          →  insights narrative

Returns a fully-populated InferenceResponse dict.
"""

import logging

from app.models.request import UserInput
from app.models.response import InferenceResponse
from app.services.dice_service import generate_counterfactuals
from app.services.llm_service import generate_llm_insights
from app.services.ml_model import predict_ensemble

logger = logging.getLogger(__name__)


async def run_inference(data: UserInput) -> InferenceResponse:
    """
    Full pipeline execution. All three stages run sequentially.
    The internal '_X' key (raw feature DataFrame) is stripped before returning.
    """

    # ── Stage 1: Ensemble ML prediction ─────────────────────────────────────
    logger.info("Stage 1: Running 25-model LightGBM ensemble")
    ml_result = predict_ensemble(data)

    cred_score       = ml_result["cred_score"]
    prob_default     = ml_result["prob_default"]
    prob_approval    = ml_result["prob_approval"]
    risk_tier        = ml_result["risk_tier"]
    decision         = ml_result["decision"]
    model_confidence = ml_result["model_confidence"]
    top_factors      = ml_result["top_factors"]
    ensemble_count   = ml_result["ensemble_model_count"]
    oof_auc          = ml_result["oof_auc"]

    # ── Stage 2: DiCE counterfactuals ────────────────────────────────────────
    logger.info("Stage 2: Generating DiCE counterfactuals")
    try:
        counterfactuals = generate_counterfactuals(data, ml_result)
    except Exception as e:
        logger.warning(f"Counterfactual generation failed, using empty list: {e}")
        counterfactuals = []

    # ── Stage 3: LLM insights ────────────────────────────────────────────────
    logger.info("Stage 3: Generating LLM narrative insights")
    llm_insights_raw = await generate_llm_insights(
        data=data,
        cred_score=cred_score,
        prob_default=prob_default,
        risk_tier=risk_tier,
        decision=decision,
        model_confidence=model_confidence,
        top_factors=top_factors,
        counterfactuals=counterfactuals,
    )

    # ── Assemble response ─────────────────────────────────────────────────────
    return InferenceResponse(
        cred_score=cred_score,
        prob_default=prob_default,
        prob_approval=prob_approval,
        risk_tier=risk_tier,
        decision=decision,
        model_confidence=model_confidence,
        top_factors=top_factors,
        counterfactuals=counterfactuals,
        llm_insights=llm_insights_raw,
        ensemble_model_count=ensemble_count,
        oof_auc=oof_auc,
    )
