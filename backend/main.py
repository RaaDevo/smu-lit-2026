from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models import HealthResponse
from routes.analyse import router as analyse_router


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


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        ai_mode="mock" if settings.use_mock_ai else "live",
    )

