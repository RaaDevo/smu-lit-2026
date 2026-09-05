from fastapi import APIRouter, Depends
from auth import require_user
from domain import (ComparativeInput, ComparativeResult, StressInput, ImpactResult,
    RemediationInput, RemediationResult, PatchReviewInput, PatchReviewResult,
    ReportInput, ResilienceBrief, SeedPack, DirectResult, ProjectSnapshot, TwinRunResult)
from services.ai_service import run_stage
from services.demo_twin import load_seed, demo_comparative, demo_direct, demo_remediation
from services import pipeline
from services.propagation import propagate
from services.twin_orchestrator import run_twins

router = APIRouter()

@router.get('/seed', response_model=SeedPack)
def seed():
    return load_seed()

@router.post('/analyse/comparative', response_model=ComparativeResult, dependencies=[Depends(require_user)])
async def comparative(data: ComparativeInput):
    pipeline.validate_comparative_input(data)
    result = await run_stage('comparative', data, ComparativeResult, demo_comparative, pipeline.validate_comparative)
    return result

@router.post('/analyse/stress-test', response_model=ImpactResult, dependencies=[Depends(require_user)])
async def stress(data: StressInput):
    pipeline.validate_stress_input(data)
    result = await run_stage('impact', data, DirectResult, demo_direct, pipeline.validate_direct)
    return propagate(result, data.dependencies, pipeline.context_hash(data))

@router.post('/analyse/twin-run', response_model=TwinRunResult, dependencies=[Depends(require_user)])
async def twin_run(data: StressInput):
    pipeline.validate_stress_input(data)
    return await run_twins(data)

@router.post('/analyse/remediation', response_model=RemediationResult, dependencies=[Depends(require_user)])
async def remediation(data: RemediationInput):
    pipeline.validate_impact(data)
    result = await run_stage('remediation', data, RemediationResult, demo_remediation, pipeline.validate_remediation)
    return result

@router.post('/reports/review-patch', response_model=PatchReviewResult)
def review(data: PatchReviewInput, user: str | None = Depends(require_user)):
    return pipeline.review_patch(data, user)

@router.post('/reports/generate', response_model=ResilienceBrief, dependencies=[Depends(require_user)])
def report(data: ReportInput):
    return pipeline.generate_brief(data)

@router.post('/reports/validate-project', response_model=ProjectSnapshot, dependencies=[Depends(require_user)])
def validate_project(data: ProjectSnapshot):
    pipeline.validate_snapshot(data)
    return data
