import json
from typing import Any

import httpx
from pydantic import ValidationError

from config import get_settings
from models import AnalysisResponse
from services.demo_service import create_demo_analysis


SYSTEM_PROMPT = """You are an analysis assistant inside a legal-technology prototype.
Analyse only the information supplied by the user.
Identify notable issues and explain them clearly.
Do not invent missing facts.
Where information is insufficient, state this explicitly."""


class AIServiceError(Exception):
    """A safe, user-facing failure from the configured AI provider."""


async def analyse_text(text: str) -> AnalysisResponse:
    settings = get_settings()
    if settings.use_mock_ai:
        return create_demo_analysis(text)

    if not settings.openrouter_api_key:
        raise AIServiceError("Live AI is enabled, but OPENROUTER_API_KEY is not configured.")
    if not settings.openrouter_model:
        raise AIServiceError("Live AI is enabled, but OPENROUTER_MODEL is not configured.")

    return await _request_openrouter(text)


async def _request_openrouter(text: str) -> AnalysisResponse:
    settings = get_settings()
    endpoint = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    base_payload: dict[str, Any] = {
        "model": settings.openrouter_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Analyse the text below. Return only a JSON object with this shape: "
                    '{"summary":"...","risk_level":"low|medium|high","issues":['
                    '{"title":"...","severity":"low|medium|high",'
                    '"explanation":"...","recommendation":"..."}]}. '
                    "Use an empty issues array when no notable issue is supported.\n\n"
                    f"{text}"
                ),
            },
        ],
        "temperature": 0.1,
    }
    structured_payload = {
        **base_payload,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "analysis_response",
                "strict": True,
                "schema": AnalysisResponse.model_json_schema(),
            },
        },
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
            response = await client.post(endpoint, headers=headers, json=structured_payload)
            if response.status_code in (400, 422):
                fallback_payload = {
                    **base_payload,
                    "response_format": {"type": "json_object"},
                }
                response = await client.post(endpoint, headers=headers, json=fallback_payload)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise AIServiceError("The AI provider timed out. Please try again.") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403):
            message = "The AI provider rejected the configured credentials."
        elif status == 429:
            message = "The AI provider is rate-limited. Please try again shortly."
        else:
            message = "The AI provider could not complete the request."
        raise AIServiceError(message) from exc
    except httpx.RequestError as exc:
        raise AIServiceError("The AI provider is currently unreachable.") from exc

    try:
        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        if not isinstance(content, str):
            raise TypeError("Expected model content to be a string")
        parsed = json.loads(_strip_code_fence(content))
        return AnalysisResponse.model_validate(parsed)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError, ValidationError) as exc:
        raise AIServiceError("The AI provider returned a malformed response. Please try again.") from exc


def _strip_code_fence(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```") and stripped.endswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return stripped
