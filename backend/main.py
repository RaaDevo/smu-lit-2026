from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from config import get_settings
from domain import HealthResponse
from routes.twin import router as analyse_router
from services.ai_service import AIServiceError


settings = get_settings()

app = FastAPI(
    title="LegalTech Sandbox API",
    version="0.1.0",
    description="Generic infrastructure starter for the SMU LIT Hackathon.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(analyse_router)

@app.exception_handler(ValueError)
async def invalid_context(request, exc):
    return JSONResponse(status_code=422, content={'detail': str(exc)})

@app.exception_handler(AIServiceError)
async def provider_error(request, exc):
    return JSONResponse(status_code=503, content={'detail': str(exc)})

@app.exception_handler(RequestValidationError)
async def invalid_request(request, exc):
    return JSONResponse(status_code=422, content={'detail': 'Invalid request. Check required fields, approval, status values and confidence bounds.'})


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    current = get_settings()
    return HealthResponse(
        status="ok",
        ai_mode="mock" if current.use_mock_ai else "live",
        require_auth=current.require_auth,
    )
