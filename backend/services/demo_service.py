import re

from models import AnalysisIssue, AnalysisResponse, RiskLevel


def create_demo_analysis(text: str) -> AnalysisResponse:
    """Return deterministic, realistic data without calling an external service."""
    normalized = " ".join(text.split())
    lowered = normalized.lower()
    issues: list[AnalysisIssue] = []

    if any(term in lowered for term in ("deadline", "expires", "within ", "days")):
        issues.append(
            AnalysisIssue(
                title="Time-sensitive obligation",
                severity=RiskLevel.HIGH,
                explanation="The supplied text appears to include a deadline or time-limited obligation.",
                recommendation="Confirm the exact date, responsible person, and consequence of missing the deadline.",
            )
        )

    if any(term in lowered for term in ("must", "shall", "required", "obligation")):
        issues.append(
            AnalysisIssue(
                title="Mandatory language",
                severity=RiskLevel.MEDIUM,
                explanation="The text uses language that may create or describe a mandatory requirement.",
                recommendation="Identify who must act, what performance is required, and any stated exceptions.",
            )
        )

    if any(term in lowered for term in ("personal data", "confidential", "privacy", "disclose")):
        issues.append(
            AnalysisIssue(
                title="Information handling",
                severity=RiskLevel.MEDIUM,
                explanation="The supplied information may involve confidential or personal material.",
                recommendation="Check the permitted purpose, access controls, retention period, and disclosure limits.",
            )
        )

    if not issues:
        issues.append(
            AnalysisIssue(
                title="Insufficient context",
                severity=RiskLevel.LOW,
                explanation="No clear high-risk indicator is present in the supplied text, but the surrounding facts are unknown.",
                recommendation="Add the relevant parties, dates, obligations, and intended outcome for a more useful analysis.",
            )
        )

    overall = max((issue.severity for issue in issues), key=_severity_rank)
    word_count = len(re.findall(r"\S+", normalized))
    return AnalysisResponse(
        summary=(
            f"Demo analysis reviewed {word_count} words and identified "
            f"{len(issues)} notable issue{'s' if len(issues) != 1 else ''}. "
            "This deterministic result is for interface development and is not legal advice."
        ),
        risk_level=overall,
        issues=issues,
    )


def _severity_rank(level: RiskLevel) -> int:
    return {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3}[level]

