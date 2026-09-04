from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AnalysisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50_000)


class AnalysisIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    severity: RiskLevel
    explanation: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(min_length=1)
    risk_level: RiskLevel
    issues: list[AnalysisIssue]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    ai_mode: Literal["mock", "live"]
