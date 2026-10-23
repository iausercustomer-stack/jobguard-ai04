"""Supabase REST and Auth integration preserving Row Level Security (RLS) via user access tokens."""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx

from .schemas import Finding, ReportPersistenceStatus, SavedReportRecord

logger = logging.getLogger("jobguard.supabase")


class SupabaseConfig:
    """Environment configuration for Supabase PostgreSQL REST API and Auth."""

    def __init__(self) -> None:
        self.url: str = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        self.anon_key: str = os.getenv("SUPABASE_ANON_KEY", "").strip()
        self.timeout_seconds: float = float(os.getenv("SUPABASE_TIMEOUT_SECONDS", "8.0"))

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.anon_key)


def extract_bearer_token(authorization_header: Optional[str]) -> Optional[str]:
    """Extracts the JWT access token from an Authorization: Bearer <token> header."""
    if not authorization_header:
        return None
    parts = authorization_header.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1]:
        return parts[1]
    return None


def verify_supabase_user(
    access_token: str,
    config: Optional[SupabaseConfig] = None,
    http_client: Optional[httpx.Client] = None,
) -> tuple[Optional[str], Optional[str]]:
    """
    Verifies the user's Supabase JWT by calling GET /auth/v1/user with the user's access token.
    Returns (user_id, error_message). Never uses a service-role key.
    """
    cfg = config or SupabaseConfig()
    if not cfg.is_configured:
        return None, "Supabase is not configured on the backend server."

    headers = {
        "apikey": cfg.anon_key,
        "Authorization": f"Bearer {access_token}",
    }
    endpoint = f"{cfg.url}/auth/v1/user"

    try:
        if http_client is not None:
            resp = http_client.get(endpoint, headers=headers, timeout=cfg.timeout_seconds)
        else:
            with httpx.Client(timeout=cfg.timeout_seconds) as client:
                resp = client.get(endpoint, headers=headers)

        if resp.status_code == 401 or resp.status_code == 403:
            return None, "Authentication session is invalid or expired. Please sign in again."
        if resp.status_code >= 400:
            return None, f"Supabase Auth verification failed (HTTP {resp.status_code})."

        user_data = resp.json()
        user_id = user_data.get("id")
        if not user_id or not isinstance(user_id, str):
            return None, "Authenticated user ID could not be resolved."
        return user_id, None
    except httpx.HTTPError as exc:
        logger.warning("Supabase Auth verification network error (%s)", type(exc).__name__)
        return None, "Could not reach Supabase authentication service."


def save_analysis_report_to_supabase(
    access_token: Optional[str],
    redacted_input_text: str,
    company_name: Optional[str],
    recruiter_email: Optional[str],
    job_url: Optional[str],
    risk_score: int,
    risk_level: str,
    summary: str,
    findings: list[Finding],
    recommendations: list[str],
    analysis_mode: str,
    config: Optional[SupabaseConfig] = None,
    http_client: Optional[httpx.Client] = None,
) -> ReportPersistenceStatus:
    """
    Inserts an analysis report into `public.analyses` via the Supabase PostgREST API
    forwarding the user's `Bearer <access_token>` so PostgreSQL Row Level Security (RLS)
    is strictly enforced (`auth.uid() = user_id`).
    Never reports `saved=True` unless the insert actually succeeded.
    """
    cfg = config or SupabaseConfig()
    if not cfg.is_configured:
        return ReportPersistenceStatus(
            requested=True,
            saved=False,
            report_id=None,
            error="Supabase database is not configured on the backend (SUPABASE_URL / SUPABASE_ANON_KEY missing).",
        )

    if not access_token:
        return ReportPersistenceStatus(
            requested=True,
            saved=False,
            report_id=None,
            error="Authentication token missing. Please sign in to save reports to your private history.",
        )

    user_id, auth_err = verify_supabase_user(access_token, config=cfg, http_client=http_client)
    if not user_id:
        return ReportPersistenceStatus(
            requested=True,
            saved=False,
            report_id=None,
            error=auth_err or "User authentication failed.",
        )

    headers = {
        "apikey": cfg.anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    row_payload = {
        "user_id": user_id,
        "input_text": redacted_input_text[:6000],
        "company_name": company_name,
        "recruiter_email": recruiter_email,
        "job_url": job_url,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "summary": summary,
        "findings": [f.to_dict() for f in findings],
        "recommendations": recommendations,
        "analysis_mode": analysis_mode,
    }

    endpoint = f"{cfg.url}/rest/v1/analyses"
    try:
        if http_client is not None:
            resp = http_client.post(endpoint, headers=headers, json=row_payload, timeout=cfg.timeout_seconds)
        else:
            with httpx.Client(timeout=cfg.timeout_seconds) as client:
                resp = client.post(endpoint, headers=headers, json=row_payload)

        if resp.status_code in (200, 201):
            rows = resp.json()
            report_id = rows[0].get("id") if isinstance(rows, list) and rows else None
            return ReportPersistenceStatus(
                requested=True,
                saved=True,
                report_id=str(report_id) if report_id else None,
                error=None,
            )

        return ReportPersistenceStatus(
            requested=True,
            saved=False,
            report_id=None,
            error=f"Database save rejected by Supabase (HTTP {resp.status_code}). The analysis succeeded, but the report was not saved.",
        )
    except httpx.HTTPError as exc:
        logger.warning("Supabase report save error (%s)", type(exc).__name__)
        return ReportPersistenceStatus(
            requested=True,
            saved=False,
            report_id=None,
            error="Could not reach Supabase database. The analysis succeeded, but the report was not saved.",
        )


def fetch_user_reports_from_supabase(
    access_token: Optional[str],
    limit: int = 20,
    config: Optional[SupabaseConfig] = None,
    http_client: Optional[httpx.Client] = None,
) -> tuple[Optional[list[SavedReportRecord]], Optional[str], int]:
    """
    Fetches the authenticated user's private analysis reports from Supabase PostgREST,
    relying on RLS (`auth.uid() = user_id`) and explicit user verification.
    Returns (records, error_message, http_status_code).
    """
    cfg = config or SupabaseConfig()
    if not cfg.is_configured:
        return None, "Supabase database is not configured on the backend.", 503

    if not access_token:
        return None, "Authentication required to access private report history.", 401

    user_id, auth_err = verify_supabase_user(access_token, config=cfg, http_client=http_client)
    if not user_id:
        return None, auth_err or "Invalid or expired authentication token.", 401

    headers = {
        "apikey": cfg.anon_key,
        "Authorization": f"Bearer {access_token}",
    }
    safe_limit = max(1, min(50, limit))
    endpoint = (
        f"{cfg.url}/rest/v1/analyses"
        f"?user_id=eq.{user_id}&order=created_at.desc&limit={safe_limit}"
    )

    try:
        if http_client is not None:
            resp = http_client.get(endpoint, headers=headers, timeout=cfg.timeout_seconds)
        else:
            with httpx.Client(timeout=cfg.timeout_seconds) as client:
                resp = client.get(endpoint, headers=headers)

        if resp.status_code >= 400:
            return None, f"Failed to load reports from Supabase (HTTP {resp.status_code}).", 502

        raw_rows = resp.json()
        records = [SavedReportRecord.from_obj(row) for row in raw_rows]
        return records, None, 200
    except Exception as exc:
        logger.warning("Failed to fetch user reports (%s)", type(exc).__name__)
        return None, "Unable to retrieve private reports from Supabase at this time.", 502
