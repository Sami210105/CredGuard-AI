import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import inference
from app.core.logging import setup_logging
from app.core.throttling import limiter

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CredGuard AI — Loan Scoring API",
    description="25-model LightGBM ensemble with DiCE counterfactuals and LLM insights",
    version="1.0.0",
)

# Allow React Native Expo dev client + simulators
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# slowapi rate-limit state + handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(inference.router, prefix="/api/v1")

logger.info("CredGuard API started — model ensemble will load on first request")
