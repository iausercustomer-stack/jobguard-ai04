"""Typed Pydantic schemas for JobGuard AI API requests, responses, and internal models.
Supports both Pydantic v1 and Pydantic v2 environments seamlessly.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
import pydantic
from pydantic import BaseModel, Field

PYDANTIC_V2 = int(pydantic.__version__.split(".")[0]) >= 2

if PYDANTIC_V2:
    from pydantic import ConfigDict, field_validator
else:
    from pydantic import validator as _v1_validator


class CompatBaseModel(BaseModel):
    """Base model providing unified v1/v2 helper methods (.to_dict(), .from_obj(), .clone_with())."""

    def to_dict(self) -> dict[str, Any]:
        if hasattr(self, "model_dump"):
            return self.model_dump()  # type: ignore[no-any-return]
        return self.dict()  # type: ignore[no-any-return]

    @classmethod
    def from_obj(cls, obj: Any) -> "CompatBaseModel":
        if hasattr(cls, "model_validate"):
            return cls.model_validate(obj)  # type: ignore[no-any-return]
        return cls.parse_obj(obj)  # type: ignore[no-any-return]

    def clone_with(self, update: dict[str, Any]) -> Any:
        if hasattr(self, "model_copy"):
            return self.model_copy(update=update)
        return self.copy(update=update)


SeverityLevel = Literal["low", "medium", "high", "critical"]
RiskCategory = Literal[
    "Lower Risk Indicator",
    "Moderate Risk Indicator",
    "High Risk Indicator",
    "Very High Risk Indicator",
]
VerificationStatus = Literal[
    "verified_official_domain",
    "impersonation_warning",
    "domain_aligned",
    "third_party_ats",
    "domain_mismatch",
    "unverified",
    "invalid_url",
    "verification_unavailable",
]


class AnalyzeRequest(CompatBaseModel):
    """Incoming job vacancy or recruitment message analysis request."""

    if PYDANTIC_V2:
        model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    else:
        class Config:
            extra = "forbid"
            anystr_strip_whitespace = True

    message_text: str = Field(
        ...,
        min_length=10,
        max_length=12000,
        description="Recruitment message, offer letter excerpt, or job description text.",
    )
    company_name: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Stated company or employer name, if known.",
    )
    recruiter_email: Optional[str] = Field(
        default=None,
        max_length=254,
        description="Recruiter or sender email address, if available.",
    )
    job_url: Optional[str] = Field(
        default=None,
        max_length=2048,
        description="Job posting URL or employer website link, if available.",
    )
    use_ai: bool = Field(
        default=False,
        description="Whether to request optional AI-assisted explanation on top of deterministic rules.",
    )
    save_report: bool = Field(
        default=False,
        description="Whether to save the report to the authenticated user's private Supabase history.",
    )

    if PYDANTIC_V2:
        @field_validator("message_text")
        @classmethod
        def validate_non_empty_message(cls, value: str) -> str:
            cleaned = value.strip()
            if len(cleaned) < 10:
                raise ValueError(
                    "Please provide at least 10 characters of the recruitment message or job description."
                )
            return cleaned

        @field_validator("company_name", "recruiter_email", "job_url", mode="before")
        @classmethod
        def empty_string_to_none(cls, value: Optional[str]) -> Optional[str]:
            if value is None:
                return None
            cleaned = str(value).strip()
            return cleaned if cleaned else None
    else:
        @_v1_validator("message_text")
        def validate_non_empty_message(cls, value: str) -> str:
            cleaned = value.strip()
            if len(cleaned) < 10:
                raise ValueError(
                    "Please provide at least 10 characters of the recruitment message or job description."
                )
            return cleaned

        @_v1_validator("company_name", "recruiter_email", "job_url", pre=True)
        def empty_string_to_none(cls, value: Optional[str]) -> Optional[str]:
            if value is None:
                return None
            cleaned = str(value).strip()
            return cleaned if cleaned else None


class Finding(CompatBaseModel):
    """Individual heuristic warning indicator extracted from the submission."""

    code: str = Field(..., description="Stable rule identifier (e.g. JG-FEE-001).")
    title: str = Field(..., description="Human-readable warning title.")
    category: str = Field(..., description="Indicator category key.")
    severity: SeverityLevel = Field(..., description="Heuristic severity level.")
    points: int = Field(..., ge=0, le=100, description="Heuristic points added toward the 0-100 cap.")
    evidence: str = Field(..., description="Concise snippet extracted from the submitted content.")
    explanation: str = Field(..., description="Neutral explanation of why this indicator matters.")
    recommendation: str = Field(..., description="Concrete action the applicant should take.")


class DomainComparison(CompatBaseModel):
    """Result of comparing the recruiter email domain with the supplied job URL domain."""

    compared: bool = Field(
        ..., description="True if both a valid email domain and valid URL hostname were available."
    )
    email_domain: Optional[str] = None
    url_hostname: Optional[str] = None
    url_root_domain: Optional[str] = None
    relationship: Literal[
        "not_applicable",
        "exact_match",
        "subdomain_match",
        "known_ats_platform",
        "free_email_with_corporate_url",
        "different_domains",
    ] = "not_applicable"
    explanation: str = Field(..., description="Clear explanation of what was compared and what it means.")


class OfficialRegistryCheck(CompatBaseModel):
    """Result of checking stated employer against the local verified reference registry."""

    checked: bool = False
    matched_employer: Optional[str] = None
    official_domains: list[str] = Field(default_factory=list)
    official_careers_url: Optional[str] = None
    status: VerificationStatus = "unverified"
    note: str = Field(
        ...,
        description="Explanation distinguishing official domain alignment, impersonation risk, or unverified status.",
    )
    checked_at: datetime


class VerificationReport(CompatBaseModel):
    """Combined safe URL, email, and employer verification report."""

    url_provided: bool = False
    url_valid: bool = False
    normalized_url: Optional[str] = None
    normalized_hostname: Optional[str] = None
    root_domain: Optional[str] = None
    is_https: bool = False
    is_shortened_url: bool = False
    url_warnings: list[str] = Field(default_factory=list)
    email_provided: bool = False
    email_valid: bool = False
    email_domain: Optional[str] = None
    is_free_email_provider: bool = False
    domain_comparison: DomainComparison
    registry_check: OfficialRegistryCheck
    verification_status: VerificationStatus
    verification_summary: str
    manual_verification_steps: list[str] = Field(default_factory=list)


class AIExplanationPayload(CompatBaseModel):
    """Strict schema validated against any optional AI model output."""

    if PYDANTIC_V2:
        model_config = ConfigDict(extra="ignore")
    else:
        class Config:
            extra = "ignore"

    plain_language_summary: str = Field(..., min_length=15, max_length=1200)
    key_questions_to_ask_recruiter: list[str] = Field(default_factory=list)
    independent_verification_tips: list[str] = Field(default_factory=list)
    caution_note: str = Field(..., min_length=10, max_length=600)


class AIStatusReport(CompatBaseModel):
    """Metadata describing whether optional AI assistance was requested and used."""

    requested: bool = False
    used: bool = False
    provider_configured: bool = False
    model: Optional[str] = None
    fallback_reason: Optional[str] = None
    explanation: Optional[AIExplanationPayload] = None


class ReportPersistenceStatus(CompatBaseModel):
    """Status of optional private report storage in Supabase."""

    requested: bool = False
    saved: bool = False
    report_id: Optional[str] = None
    error: Optional[str] = None


class AnalyzeResponse(CompatBaseModel):
    """Complete typed response returned by POST /api/analyze."""

    risk_score: int = Field(..., ge=0, le=100)
    risk_category: RiskCategory
    category_explanation: str
    summary: str
    findings: list[Finding]
    recommendations: list[str]
    verification: VerificationReport
    analysis_mode: Literal["deterministic_only", "deterministic_plus_ai"]
    ai_status: AIStatusReport
    persistence: ReportPersistenceStatus
    redacted_preview: str
    redaction_count: int = 0
    redaction_types: list[str] = Field(default_factory=list)
    analyzed_at: datetime
    methodology_note: str
    uncertainty_disclaimer: str


class SampleMessage(CompatBaseModel):
    """Built-in sample vacancy/message for hackathon demo and testing."""

    id: str
    label: str
    kind: Literal["suspicious", "legitimate", "ambiguous"]
    company_name: str
    recruiter_email: str
    job_url: str
    message_text: str
    expected_note: str


class SavedReportRecord(CompatBaseModel):
    """Saved analysis record returned from Supabase for authenticated users."""

    id: str
    user_id: str
    company_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    job_url: Optional[str] = None
    input_text: str
    risk_score: int
    risk_level: str
    summary: str
    findings: list[Finding] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    analysis_mode: str
    created_at: datetime


class HealthResponse(CompatBaseModel):
    """Response schema for GET /health."""

    status: Literal["ok"] = "ok"
    service: str = "jobguard-ai-backend"
    version: str
    deterministic_engine: Literal["ready"] = "ready"
    ai_layer_configured: bool
    supabase_configured: bool
    max_input_chars: int
    timestamp: datetime
