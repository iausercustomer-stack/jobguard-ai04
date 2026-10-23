"""FastAPI entrypoint for JobGuard AI — Local Job Scam and Vacancy Verifier (AI-04)."""

from __future__ import annotations

from datetime import datetime, timezone
import logging
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .ai_explainer import AIConfig, generate_optional_ai_explanation
from .analyzer import (
    METHODOLOGY_NOTE,
    SAMPLE_MESSAGES,
    UNCERTAINTY_DISCLAIMER,
    run_deterministic_analysis,
)
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    ReportPersistenceStatus,
    SampleMessage,
    SavedReportRecord,
)
from .security import SlidingWindowRateLimiter, redact_sensitive_text
from .supabase_client import (
    SupabaseConfig,
    extract_bearer_token,
    fetch_user_reports_from_supabase,
    save_analysis_report_to_supabase,
)

# Configure safe logging (never log raw user secrets or API keys)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("jobguard.api")

MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "12000"))
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))


def get_configured_cors_origins() -> list[str]:
    """
    Reads allowed frontend origins from CORS_ORIGINS environment variable.
    Normalizes origins by stripping trailing slashes and rejecting wildcard '*'
    so credentialed cross-origin requests from Vercel never fail due to a trailing slash.
    """
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    )
    origins: list[str] = []
    for item in raw.split(","):
        cleaned = item.strip().rstrip("/")
        if cleaned and cleaned != "*" and cleaned not in origins:
            origins.append(cleaned)
    return origins or ["http://localhost:5173"]


app = FastAPI(
    title="JobGuard AI API",
    description=(
        "SRIMT Parakram Hackathon 2026 (Problem Statement AI-04) — "
        "Deterministic & AI-Assisted Local Job Scam and Vacancy Verifier."
    ),
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_configured_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "HEAD", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

rate_limiter = SlidingWindowRateLimiter(max_requests=RATE_LIMIT_PER_MINUTE, window_seconds=60)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Returns clean, user-friendly validation errors without exposing internal stack traces."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(part) for part in err.get("loc", []) if part != "body")
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}" if loc else msg)
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request input. " + "; ".join(errors),
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Prevents stack traces or internal configuration details from leaking to clients."""
    logger.error("Unhandled server exception on %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred while processing the request. Please try again."
        },
    )


@app.get("/", tags=["System"])
async def root_info() -> dict[str, str]:
    """Root informational endpoint for cloud deployment verification."""
    return {
        "service": "JobGuard AI Backend API (SRIMT Parakram Hackathon 2026 | AI-04)",
        "version": __version__,
        "health_endpoint": "/health",
        "openapi_docs": "/docs",
        "samples_endpoint": "/api/samples",
        "analyze_endpoint": "/api/analyze",
    }


@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Returns service health and capability readiness without revealing any secret values."""
    ai_cfg = AIConfig()
    sb_cfg = SupabaseConfig()
    return HealthResponse(
        status="ok",
        service="jobguard-ai-backend",
        version=__version__,
        deterministic_engine="ready",
        ai_layer_configured=ai_cfg.is_ready,
        supabase_configured=sb_cfg.is_configured,
        max_input_chars=MAX_INPUT_CHARS,
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/api/samples", response_model=list[SampleMessage], tags=["Analysis"])
async def list_sample_messages() -> list[SampleMessage]:
    """Returns built-in suspicious, legitimate, and ambiguous sample messages for quick testing."""
    return SAMPLE_MESSAGES


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_vacancy(
    payload: AnalyzeRequest,
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> AnalyzeResponse:
    """
    Validates input, redacts obvious sensitive numbers, runs the deterministic scam analyzer
    and safe URL/domain verifier, optionally invokes the AI explanation layer with safe fallback,
    and optionally saves the report to Supabase for authenticated users.
    """
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = rate_limiter.check_allowed(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Please wait {retry_after} seconds before submitting another analysis.",
            headers={"Retry-After": str(retry_after)},
        )

    if len(payload.message_text) > MAX_INPUT_CHARS:
        raise HTTPException(
            status_code=422,
            detail=f"Message text exceeds the configured limit of {MAX_INPUT_CHARS} characters.",
        )

    # 1. Redact sensitive numeric/identity sequences before AI or database persistence
    redacted_text, redaction_count, redaction_types = redact_sensitive_text(payload.message_text)

    # 2. Run deterministic rule-based scam analysis engine & safe URL/domain verification
    (
        risk_score,
        risk_category,
        category_explanation,
        summary,
        findings,
        recommendations,
        verification,
    ) = run_deterministic_analysis(
        message_text=payload.message_text,
        company_name=payload.company_name,
        recruiter_email=payload.recruiter_email,
        job_url=payload.job_url,
    )

    # 3. Optionally invoke backend-only AI explanation layer (using redacted text only)
    ai_status = generate_optional_ai_explanation(
        use_ai_requested=payload.use_ai,
        redacted_text=redacted_text,
        company_name=payload.company_name,
        recruiter_email=payload.recruiter_email,
        job_url=payload.job_url,
        risk_score=risk_score,
        risk_category=risk_category,
        findings=findings,
        verification=verification,
    )

    analysis_mode = "deterministic_plus_ai" if ai_status.used else "deterministic_only"

    # 4. Optionally save report to Supabase (never fake success if save fails)
    if payload.save_report:
        access_token = extract_bearer_token(authorization)
        persistence = save_analysis_report_to_supabase(
            access_token=access_token,
            redacted_input_text=redacted_text,
            company_name=payload.company_name,
            recruiter_email=payload.recruiter_email,
            job_url=payload.job_url,
            risk_score=risk_score,
            risk_level=risk_category,
            summary=summary,
            findings=findings,
            recommendations=recommendations,
            analysis_mode=analysis_mode,
        )
    else:
        persistence = ReportPersistenceStatus(requested=False, saved=False, report_id=None, error=None)

    logger.info(
        "Completed analysis: score=%d category='%s' findings=%d ai_used=%s saved=%s",
        risk_score,
        risk_category,
        len(findings),
        ai_status.used,
        persistence.saved,
    )

    return AnalyzeResponse(
        risk_score=risk_score,
        risk_category=risk_category,
        category_explanation=category_explanation,
        summary=summary,
        findings=findings,
        recommendations=recommendations,
        verification=verification,
        analysis_mode=analysis_mode,
        ai_status=ai_status,
        persistence=persistence,
        redacted_preview=redacted_text[:600] + ("..." if len(redacted_text) > 600 else ""),
        redaction_count=redaction_count,
        redaction_types=redaction_types,
        analyzed_at=datetime.now(timezone.utc),
        methodology_note=METHODOLOGY_NOTE,
        uncertainty_disclaimer=UNCERTAINTY_DISCLAIMER,
    )


@app.get("/api/reports", response_model=list[SavedReportRecord], tags=["History"])
async def list_my_saved_reports(
    limit: int = Query(default=20, ge=1, le=50),
    authorization: Optional[str] = Header(default=None),
) -> list[SavedReportRecord]:
    """
    Returns authenticated user's private saved analysis history from Supabase.
    Enforces authentication and preserves Row Level Security (RLS).
    """
    access_token = extract_bearer_token(authorization)
    records, err_msg, status_code = fetch_user_reports_from_supabase(
        access_token=access_token,
        limit=limit,
    )
    if err_msg is not None or records is None:
        raise HTTPException(status_code=status_code, detail=err_msg or "Unable to fetch reports.")
    return records
