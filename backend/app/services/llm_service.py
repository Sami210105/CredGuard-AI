"""
llm_service.py
──────────────
Calls the OpenRouter API (google/gemini-2.5-flash) to generate a rich,
three-section narrative about the applicant's CredScore result.

Sections returned as structured JSON:
  result_explanation  – why this exact score, what the top features mean
  situation_summary   – strengths and risk flags in plain language
  improvement_plan    – numbered 90-day action items with expected score impact
"""

import json
import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL              = "google/gemini-2.5-flash-preview"

_SYSTEM_PROMPT = """\
You are CredGuard AI, an expert financial analyst and loan underwriting assistant.
Your job is to explain credit risk assessment results in clear, empathetic language.
You always return a valid JSON object — nothing else.
"""

_USER_PROMPT_TEMPLATE = """\
A loan applicant has been assessed by our 25-model LightGBM ensemble. Here are the results:

CredScore: {cred_score}/100
Default probability: {prob_default_pct}%
Risk tier: {risk_tier}
Decision: {decision}
Ensemble confidence: {confidence_pct}%

Top factors that influenced this score:
{top_factors_text}

Counterfactual suggestions (what changes would improve the score):
{counterfactuals_text}

Applicant profile:
{profile_text}

Please respond with ONLY a JSON object with exactly these three keys:

{{
  "result_explanation": "2–3 paragraphs explaining WHY this score was assigned — specifically reference the top factors by their plain names and explain what each factor signals about creditworthiness. Mention the ensemble confidence. Be factual and objective.",

  "situation_summary": "2–3 paragraphs describing the applicant's CURRENT financial situation — their strengths (what is working in their favour) and their risk flags (what is concerning the model). Use plain everyday language. Show empathy. Do not repeat the score number.",

  "improvement_plan": "A numbered list of 5–7 specific, actionable steps the applicant can take over the next 90 days to improve their CredScore. For each step: state the action, the timeline (e.g. 'within 30 days'), and the estimated score impact (e.g. '+3–5 points'). Reference the counterfactual suggestions where relevant."
}}

Important rules:
- Return ONLY the JSON object. No markdown, no code fences, no preamble.
- Write in plain English that a non-financial person can understand.
- Be specific — reference actual feature names in plain English, not variable names.
- Be realistic about score improvement expectations.
"""


def _build_profile_text(data) -> str:
    lines = []
    if data.age_years:
        lines.append(f"Age: {data.age_years} years")
    if data.gender:
        lines.append(f"Gender: {'Male' if data.gender.upper() == 'M' else 'Female'}")
    if data.income:
        lines.append(f"Annual income: ₹{data.income:,.0f}")
    if data.credit_amount:
        lines.append(f"Requested loan: ₹{data.credit_amount:,.0f}")
    if data.annuity_amount:
        lines.append(f"Monthly EMI: ₹{data.annuity_amount:,.0f}")
    if data.employed_years is not None:
        lines.append(f"Employment tenure: {data.employed_years:.1f} years")
    if data.income_type:
        lines.append(f"Income type: {data.income_type}")
    if data.education_type:
        lines.append(f"Education: {data.education_type}")
    if data.ext_source_1 is not None:
        lines.append(f"Credit bureau score 1: {data.ext_source_1:.2f}/1.00")
    if data.ext_source_2 is not None:
        lines.append(f"Credit bureau score 2: {data.ext_source_2:.2f}/1.00")
    if data.ext_source_3 is not None:
        lines.append(f"Credit bureau score 3: {data.ext_source_3:.2f}/1.00")
    if not lines:
        lines.append("Limited profile data provided")
    return "\n".join(f"  • {line}" for line in lines)


def _build_factors_text(top_factors: list[dict]) -> str:
    lines = []
    for i, f in enumerate(top_factors[:6], 1):
        w = round(f["weight"] * 100, 1)
        dir_text = {"positive": "↑ helps score", "negative": "↓ hurts score", "neutral": "— neutral"}.get(
            f["direction"], ""
        )
        lines.append(f"  {i}. {f['label']} (weight {w}%) — {dir_text}")
    return "\n".join(lines) if lines else "  (no factor data)"


def _build_counterfactuals_text(counterfactuals: list[dict]) -> str:
    lines = []
    for cf in counterfactuals[:5]:
        curr = f"{cf['current_value']:.3f}" if cf.get("current_value") is not None else "N/A"
        sugg = f"{cf['suggested_value']:.3f}"
        arrow = "→ increase to" if cf["impact_direction"] == "increase" else "→ decrease to"
        lines.append(f"  • {cf['label']}: {curr} {arrow} {sugg}")
    return "\n".join(lines) if lines else "  (no counterfactual data)"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
async def generate_llm_insights(
    data,
    cred_score: float,
    prob_default: float,
    risk_tier: str,
    decision: str,
    model_confidence: float,
    top_factors: list[dict],
    counterfactuals: list[dict],
) -> dict[str, str]:
    """
    Call OpenRouter to produce the three-section LLM narrative.
    Returns dict with keys: result_explanation, situation_summary, improvement_plan.
    Falls back to structured placeholders on any error.
    """
    user_prompt = _USER_PROMPT_TEMPLATE.format(
        cred_score=cred_score,
        prob_default_pct=round(prob_default * 100, 1),
        risk_tier=risk_tier,
        decision=decision,
        confidence_pct=round(model_confidence * 100, 1),
        top_factors_text=_build_factors_text(top_factors),
        counterfactuals_text=_build_counterfactuals_text(counterfactuals),
        profile_text=_build_profile_text(data),
    )

    payload: dict[str, Any] = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": 0.4,
        "max_tokens":  1200,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization":  f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type":   "application/json",
        "HTTP-Referer":   "https://credguard.ai",
        "X-Title":        "CredGuard AI",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            body = resp.json()

        raw_text = body["choices"][0]["message"]["content"]
        insights = json.loads(raw_text)

        # Validate keys
        required = {"result_explanation", "situation_summary", "improvement_plan"}
        if not required.issubset(insights.keys()):
            raise ValueError(f"LLM response missing keys: {required - set(insights.keys())}")

        return {
            "result_explanation": insights["result_explanation"],
            "situation_summary":  insights["situation_summary"],
            "improvement_plan":   insights["improvement_plan"],
        }

    except Exception as e:
        logger.error(f"LLM insights generation failed: {type(e).__name__}: {e}")
        # Graceful fallback — never break the scoring response over an LLM failure
        tier_desc = {
            "Low":       "a strong creditworthiness profile",
            "Medium":    "a moderate creditworthiness profile with some areas to improve",
            "High":      "a higher-risk profile that needs attention before loan approval",
            "Very High": "a high-risk profile that requires significant improvement",
        }.get(risk_tier, "a creditworthiness profile")

        return {
            "result_explanation": (
                f"Your CredScore of {cred_score}/100 reflects {tier_desc}. "
                f"The ensemble of 25 models assessed your application with {round(model_confidence*100,0):.0f}% confidence. "
                f"The most influential factor was {top_factors[0]['label'] if top_factors else 'your external credit history'}."
            ),
            "situation_summary": (
                f"Based on the data provided, your profile sits in the {risk_tier} risk tier. "
                "Positive indicators include your submitted profile data. "
                "To get a full situation analysis, please ensure the Gemini API key is configured correctly."
            ),
            "improvement_plan": (
                "1. Improve your external credit bureau scores by maintaining timely payments (within 30 days, +5–8 pts). "
                "2. Reduce your EMI-to-income ratio below 25% by increasing income or choosing a longer tenure (within 60 days, +3–5 pts). "
                "3. Avoid taking new loans or credit inquiries for 90 days to reduce hard-inquiry impact (+2–4 pts). "
                "4. Build a longer employment history at your current job (+1–3 pts per year of tenure). "
                "5. Reduce outstanding credit card balances to below 30% of the credit limit (+3–5 pts)."
            ),
        }
