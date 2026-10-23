"""Security utilities: sensitive-data redaction, SSRF IP/hostname checks, prompt isolation, and rate limiting."""

from __future__ import annotations

import ipaddress
import re
import socket
import time
from collections import defaultdict, deque
from typing import Tuple


# Patterns for redacting sensitive personal or financial identifiers before AI submission or storage
_REDACTION_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    (
        "explicit_secret_value",
        re.compile(
            r"(?i)\b(otp|upi\s*pin|atm\s*pin|mpin|cvv|net\s*banking\s*password|password|passcode)\s*(?:is|=|:|-)\s*([A-Za-z0-9@#$%^&*!]{3,20})\b"
        ),
        r"\1: [REDACTED-SECRET]",
    ),
    (
        "pan_number",
        re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),
        "[REDACTED-PAN]",
    ),
    (
        "aadhaar_like_12digit",
        re.compile(r"(?<!\d)(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})(?!\d)"),
        "[REDACTED-ID-12]",
    ),
    (
        "card_or_account_number",
        re.compile(r"(?<!\d)(?:\d{4}[\s-]){3}\d{1,4}(?!\d)|(?<!\d)\d{13,19}(?!\d)"),
        "[REDACTED-ACCOUNT-NUM]",
    ),
]

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def redact_sensitive_text(text: str) -> Tuple[str, int, list[str]]:
    """
    Redacts obvious sensitive numeric/identity sequences (Aadhaar-like 12-digit numbers,
    PAN numbers, long card/account numbers, and explicit OTP/PIN values) from text.

    Returns (redacted_text, total_redactions, redaction_types).
    """
    if not text:
        return "", 0, []

    redacted = _CONTROL_CHAR_RE.sub("", text)
    total_count = 0
    matched_types: list[str] = []

    for label, pattern, replacement in _REDACTION_PATTERNS:
        redacted, count = pattern.subn(replacement, redacted)
        if count > 0:
            total_count += count
            if label not in matched_types:
                matched_types.append(label)

    return redacted, total_count, matched_types


def strip_html_tags(text: str) -> str:
    """Strips raw HTML tags from untrusted or model-generated strings so they are never rendered as HTML."""
    if not text:
        return ""
    cleaned = _HTML_TAG_RE.sub("", text)
    return _CONTROL_CHAR_RE.sub("", cleaned).strip()


def wrap_untrusted_submission(
    redacted_text: str,
    company_name: str | None,
    recruiter_email: str | None,
    job_url: str | None,
) -> str:
    """
    Wraps user-supplied recruitment text inside strict XML-like data delimiters so
    an LLM treats it strictly as passive data and ignores any embedded prompt-injection text.
    """
    safe_company = strip_html_tags(company_name or "Not provided")[:200]
    safe_email = strip_html_tags(recruiter_email or "Not provided")[:254]
    safe_url = strip_html_tags(job_url or "Not provided")[:500]
    safe_body = strip_html_tags(redacted_text)[:6000]

    return (
        "<untrusted_recruitment_submission>\n"
        f"Stated Company: {safe_company}\n"
        f"Stated Recruiter Email: {safe_email}\n"
        f"Stated Job URL: {safe_url}\n"
        "Submitted Text:\n"
        f"{safe_body}\n"
        "</untrusted_recruitment_submission>"
    )


# Cloud metadata and internal hostnames that must always be rejected by SSRF checks
_FORBIDDEN_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
        "metadata",
        "instance-data",
        "169.254.169.254",
        "100.100.100.200",
        "fd00:ec2::254",
    }
)

_FORBIDDEN_HOSTNAME_SUFFIXES = (
    ".localhost",
    ".local",
    ".internal",
    ".home.arpa",
    ".localdomain",
    ".lan",
)


def is_ip_address_safe_public(ip_str: str) -> tuple[bool, str]:
    """
    Validates that an IPv4 or IPv6 address is a globally routable public IP
    and NOT loopback, private, link-local, cloud metadata, multicast, or reserved.
    """
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return False, "Invalid IP address syntax."

    # Check IPv4-mapped IPv6 addresses as well
    if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped is not None:
        ip_obj = ip_obj.ipv4_mapped

    if ip_obj.is_loopback:
        return False, "Loopback IP address is blocked (SSRF protection)."
    if ip_obj.is_private:
        return False, "Private network IP address is blocked (SSRF protection)."
    if ip_obj.is_link_local:
        return False, "Link-local / cloud metadata IP address is blocked (SSRF protection)."
    if ip_obj.is_multicast:
        return False, "Multicast IP address is blocked."
    if ip_obj.is_reserved:
        return False, "Reserved IP address range is blocked."
    if ip_obj.is_unspecified:
        return False, "Unspecified IP address (0.0.0.0 / ::) is blocked."
    if not ip_obj.is_global:
        return False, "Non-global IP address range is blocked (SSRF protection)."

    return True, "Global public IP address."


def validate_hostname_ssrf_safe(hostname: str, resolve_dns: bool = False) -> tuple[bool, str]:
    """
    Validates that a hostname is syntactically valid and does not target localhost,
    internal suffixes, or private/loopback/metadata IP literals.
    Optionally resolves DNS to verify all resolved A/AAAA records are public IPs.
    """
    if not hostname:
        return False, "Hostname is empty."

    normalized = hostname.strip().lower().rstrip(".")
    if not normalized:
        return False, "Hostname is empty."

    if normalized in _FORBIDDEN_HOSTNAMES:
        return False, f"Hostname '{normalized}' is restricted (internal/metadata host)."

    if any(normalized.endswith(suffix) for suffix in _FORBIDDEN_HOSTNAME_SUFFIXES):
        return False, f"Hostname '{normalized}' uses a restricted local/internal domain suffix."

    # Check if hostname is an IP literal (IPv4 or bracket-stripped IPv6)
    ip_candidate = normalized.strip("[]")
    try:
        ipaddress.ip_address(ip_candidate)
        is_safe, reason = is_ip_address_safe_public(ip_candidate)
        if not is_safe:
            return False, reason
        return False, "Direct IP-literal URLs are flagged as suspicious for job applications."
    except ValueError:
        pass

    if resolve_dns:
        try:
            addr_info = socket.getaddrinfo(normalized, None, proto=socket.IPPROTO_TCP)
            for family, _, _, _, sockaddr in addr_info:
                ip_str = sockaddr[0]
                is_safe, reason = is_ip_address_safe_public(ip_str)
                if not is_safe:
                    return False, f"DNS resolution for '{normalized}' returned restricted IP ({reason})."
        except socket.gaierror:
            return False, f"DNS resolution failed for '{normalized}'."

    return True, "Hostname passed static SSRF validation."


class SlidingWindowRateLimiter:
    """Thread-safe in-memory per-key sliding-window rate limiter for API endpoints."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check_allowed(self, key: str) -> tuple[bool, int]:
        """
        Returns (allowed, retry_after_seconds).
        """
        now = time.monotonic()
        bucket = self._hits[key]
        cutoff = now - self.window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        if len(bucket) >= self.max_requests:
            retry_after = max(1, int(self.window_seconds - (now - bucket[0])) + 1)
            return False, retry_after

        bucket.append(now)
        return True, 0
