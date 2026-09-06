import json
from dataclasses import dataclass
from pathlib import Path

from .shared_scaffold import compose_twin_system_prompt
from domain import TwinCalibrationProfile


@dataclass(frozen=True)
class AgentSpec:
    name: str
    prompt_version: str
    role_prompt: str
    profile: TwinCalibrationProfile

    @property
    def system_prompt(self) -> str:
        return compose_twin_system_prompt(self.role_prompt, self.profile)


def load_profiles() -> dict[str, TwinCalibrationProfile]:
    path = Path(__file__).parents[1] / 'data' / 'agent_profiles.json'
    profiles = [TwinCalibrationProfile.model_validate(value) for value in json.loads(path.read_text(encoding='utf-8'))]
    if len(profiles) != 5 or len({profile.agent for profile in profiles}) != 5:
        raise ValueError('Exactly one calibration profile is required per agent.')
    return {profile.agent: profile for profile in profiles}
