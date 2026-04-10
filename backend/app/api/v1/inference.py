from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.throttling import limiter
from app.models.request import UserInput
from app.models.response import InferenceResponse
from app.services.inference_service import run_inference

router = APIRouter()


@router.post("/score", response_model=InferenceResponse, summary="Run CredScore inference")
@limiter.limit("10/minute")
async def get_score(request: Request, data: UserInput) -> InferenceResponse:
    """
    POST /api/v1/score

    Accepts a UserInput JSON body and returns a full InferenceResponse containing:
    - CredScore (0–100) from the 25-model LightGBM ensemble
    - Risk tier and decision
    - Top 6 factors by importance
    - Up to 5 DiCE counterfactual suggestions
    - 3-section LLM narrative (result explanation, situation summary, improvement plan)
    """
    return await run_inference(data)
