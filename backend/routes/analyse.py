from fastapi import APIRouter, HTTPException

from models import AnalysisRequest, AnalysisResponse
from services.ai_service import AIServiceError, analyse_text


router = APIRouter(tags=["analysis"])


@router.post("/analyse", response_model=AnalysisResponse)
async def analyse(request: AnalysisRequest) -> AnalysisResponse:
    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="Text must not be empty.",
        )

    try:
        return await analyse_text(text)
    except AIServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
