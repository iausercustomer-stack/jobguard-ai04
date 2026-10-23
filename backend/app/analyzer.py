"""Deterministic rule-based recruitment scam and vacancy risk analyzer."""

from __future__ import annotations

import os
import re
from typing import Callable

from .schemas import Finding, RiskCategory, SampleMessage, SeverityLevel, VerificationReport
from .verification import KNOWN_URL_SHORTENERS, verify_submission_context


# Configurable heuristic weights (initial engineering heuristics, not statistical probabilities)
DEFAULT_RULE_WEIGHTS: dict[str, int] = {
    "JG-FEE-001": int(os.getenv("WEIGHT_UPFRONT_FEE", "45")),
    "JG-SENS-005": int(os.getenv("WEIGHT_SENSITIVE_DATA", "45")),
    "JG-GUAR-002": int(os.getenv("WEIGHT_GUARANTEED_JOB", "25")),
    "JG-COMP-004": int(os.getenv("WEIGHT_UNREALISTIC_PAY", "25")),
    "JG-TASK-010": int(os.getenv("WEIGHT_PREPAID_TASK", "35")),
    "JG-DOM-007": int(os.getenv("WEIGHT_DOMAIN_MISMATCH", "25")),
    "JG-URG-003": int(os.getenv("WEIGHT_URGENCY", "18")),
    "JG-LINK-006": int(os.getenv("WEIGHT_SUSPICIOUS_LINK", "20")),
    "JG-FREE-008": int(os.getenv("WEIGHT_FREE_EMAIL", "12")),
    "JG-UNV-009": int(os.getenv("WEIGHT_MISSING_EVIDENCE", "10")),
}

# Configurable risk category thresholds (0-100 scale)
THRESHOLD_MODERATE = int(os.getenv("THRESHOLD_MODERATE", "20"))
THRESHOLD_HIGH = int(os.getenv("THRESHOLD_HIGH", "45"))
THRESHOLD_VERY_HIGH = int(os.getenv("THRESHOLD_VERY_HIGH", "70"))

METHODOLOGY_NOTE = (
    "Scores are computed by a deterministic rule-based engine using configurable heuristic weights "
    "across 10 recruitment-risk categories. Each category is counted at most once to prevent repeated "
    "keywords from inflating the score, and the total is capped at 100."
)

UNCERTAINTY_DISCLAIMER = (
    "Important Disclaimer: This risk score (0–100) is a heuristic indicator based solely on patterns in the "
    "submitted text and metadata—not a statistically validated probability or legal determination. A high score "
    "does not prove an employer is fraudulent, and a low score does not certify a vacancy as genuine. Always "
    "verify opportunities independently through official employer channels before sharing documents or attending interviews."
)


# Clauses where a legitimate employer explicitly warns candidates NEVER to pay fees or share OTPs
_BENIGN_NEGATION_RE = re.compile(
    r"(?i)\b(?:never|do\s+not|does\s+not|don't|doesn't|no|zero|refrain\s+from|beware\s+of)\b"
    r"[^.!?\n]{0,65}\b(?:charge|ask\s+for|collect|require|demand|pay|soliciting|request)\b"
    r"|\b(?:no\s+(?:registration|recruitment|application|placement|training|security)\s+fee[s]?\s+(?:is|are)\s+charged)\b"
    r"|\b(?:free\s+of\s+cost\s+recruitment|merit[- ]based\s+and\s+free)\b"
)


def _strip_benign_disclaimer_sentences(text: str) -> str:
    """
    Removes sentences that are clearly anti-fraud disclaimers (e.g. 'TCS does not charge any fee at any stage
    of recruitment') before running fee/OTP regexes, preventing false positives on legitimate job postings.
    """
    sentences = re.split(r"(?<=[.!?\n])\s+", text)
    kept: list[str] = []
    for sentence in sentences:
        if _BENIGN_NEGATION_RE.search(sentence):
            continue
        kept.append(sentence)
    return " ".join(kept)


def _extract_unique_snippets(
    text: str, patterns: list[re.Pattern[str]], max_snippets: int = 2
) -> list[str]:
    """
    Extracts up to `max_snippets` distinct matched phrases with surrounding context from `text`.
    """
    snippets: list[str] = []
    seen_lower: set[str] = set()

    for pattern in patterns:
        for match in pattern.finditer(text):
            start = max(0, match.start() - 25)
            end = min(len(text), match.end() + 25)
            raw_snippet = " ".join(text[start:end].strip().split())
            if len(raw_snippet) > 140:
                raw_snippet = raw_snippet[:137] + "..."
            key = match.group(0).strip().lower()
            if key not in seen_lower and raw_snippet:
                seen_lower.add(key)
                snippets.append(f'"{raw_snippet}"')
                if len(snippets) >= max_snippets:
                    return snippets
    return snippets


# 1. Upfront fees (registration, security deposit, training, laptop, gate pass, processing, documentation)
_UPFRONT_FEE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:pay|deposit|transfer|remit|send|submit)\b[^.!?\n]{0,45}"
        r"\b(?:registration|processing|security|training|onboarding|verification|documentation|laptop|equipment|id\s*card|gate\s*pass|interview|medical|agreement|placement)\s*"
        r"(?:fee[s]?|charge[s]?|deposit|amount|cost)\b"
    ),
    re.compile(
        r"(?i)\b(?:refundable|mandatory|one[- ]time|nominal|initial)\s+"
        r"(?:registration|security|training|onboarding|laptop|verification|processing|documentation|interview|seat\s*booking)\s*"
        r"(?:fee[s]?|deposit|charge[s]?|amount)\b"
    ),
    re.compile(
        r"(?i)\b(?:registration|processing|security|documentation|laptop|seat\s*confirmation|offer\s*letter)\s+"
        r"(?:fee[s]?|deposit|charge[s]?)\s*(?:of|:|-|is)?\s*(?:rs\.?|inr|₹|\$)\s*[0-9,]+\b"
    ),
    re.compile(
        r"(?i)\b(?:rs\.?|inr|₹)\s*[0-9,]+\s*(?:for|towards|as)\s+"
        r"(?:registration|security\s*deposit|document\s*verification|laptop\s*dispatch|training\s*kit|background\s*check|interview\s*slot)\b"
    ),
]

# 2. Guaranteed selection or direct appointment without evaluation
_GUARANTEED_SELECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:100%\s*(?:job|placement|selection)\s*guarantee[d]?|guaranteed\s+(?:selection|job|placement|joining|offer\s*letter))\b"
    ),
    re.compile(
        r"(?i)\b(?:direct\s+(?:joining|selection|offer\s*letter|appointment)\s+without\s+(?:any\s+)?(?:interview|test|exam|assessment))\b"
    ),
    re.compile(
        r"(?i)\b(?:no\s+interview\s+required|no\s+exam\s+direct\s+selection|(?:confirmed|confirm)\s+selection\s+letter\s+ready|backdoor\s+(?:entry|placement))\b"
    ),
]

# 3. Artificial urgency and pressure tactics
_URGENCY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:pay|respond|confirm|complete\s+registration|send\s+details|transfer)\s+"
        r"(?:within|in\s+the\s+next)\s+\d+\s*(?:minute[s]?|min[s]?|hour[s]?|hr[s]?)\b"
    ),
    re.compile(
        r"(?i)\b(?:offer\s+(?:expires|valid\s+only)\s+(?:today|in\s+\d+\s*(?:hours|minutes))|immediate\s+payment\s+required|urgent\s+slot\s+booking)\b"
    ),
    re.compile(
        r"(?i)\b(?:only\s+\d+\s+(?:seats|slots|vacancies)\s+left\s+for\s+today|fail(?:ure)?\s+to\s+pay\s+today\s+will\s+cancel\s+your\s+offer)\b"
    ),
]

# 4. Suspiciously attractive compensation / unrealistic low-effort pay
_UNREALISTIC_COMPENSATION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:earn|make|get|income\s+of)\s*(?:up\s+to\s*)?(?:rs\.?|inr|₹|\$)\s*[0-9,]+\s*"
        r"(?:to|-|–)\s*(?:rs\.?|inr|₹|\$)?\s*[0-9,]+\s*(?:per\s+day|daily|every\s+day|per\s+hour)\b"
    ),
    re.compile(
        r"(?i)\b(?:work\s+just\s+[1-3]\s*hour[s]?\s*(?:a\s+day|daily)\s+from\s+(?:mobile|phone|home)|earn\s+(?:rs\.?|inr|₹)\s*[3-9][0-9,]+\s*(?:daily|per\s+day))\b"
    ),
    re.compile(
        r"(?i)\b(?:no\s+experience\s+(?:or\s+skills?\s+)?needed[^.!?\n]{0,35}(?:rs\.?|inr|₹)\s*[5-9][0-9],[0-9]{3}\s*(?:per\s+month|/month|pm))\b"
    ),
]

# 5. Requests for OTPs, UPI PINs, banking passwords, CVV, or screen-sharing apps
_SENSITIVE_DATA_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:share|send|provide|enter|tell|verify\s+with)\s+(?:your\s+|the\s+)?"
        r"(?:otp|upi\s*pin|atm\s*pin|mpin|net\s*banking\s*password|bank\s*login\s*password|credit\s*card\s*cvv|debit\s*card\s*pin)\b"
    ),
    re.compile(
        r"(?i)\b(?:scan\s+(?:the\s+|this\s+)?qr\s*code\s+and\s+enter\s+(?:your\s+)?upi\s*pin|install\s+(?:anydesk|teamviewer|quicksupport)\s+for\s+(?:salary|bank|kyc)\s+verification)\b"
    ),
    re.compile(
        r"(?i)\b(?:otp|upi\s*pin|atm\s*pin|cvv|netbanking\s*password)\s*(?:required|needed|mandatory)\s+for\s+(?:onboarding|salary\s*account|verification)\b"
    ),
]

# 6. Shortened URLs or Telegram/WhatsApp-only recruitment funnel links inside message text
_INLINE_LINK_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\bhttps?://(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd|tiny\.cc|ow\.ly|rebrand\.ly|shorturl\.at|lnkd\.in)/[A-Za-z0-9_-]+\b"
    ),
    re.compile(
        r"(?i)\b(?:https?://)?(?:t\.me|telegram\.me|wa\.me|chat\.whatsapp\.com)/[A-Za-z0-9_+/-]+\b"
    ),
]

# 10. Prepaid task / rating / YouTube-like / crypto recharge job scams
_PREPAID_TASK_SCAM_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?i)\b(?:like\s+and\s+subscribe\s+youtube|google\s+map[s]?\s+review\s+task|hotel\s+rating\s+task|telegram\s+prepaid\s+task|vip\s+task\s+upgrade|recharge\s+to\s+unlock\s+commission)\b"
    ),
    re.compile(
        r"(?i)\b(?:complete\s+\d+\s+welfare\s+tasks|merchant\s+prepaid\s+order\s+task|freeze\s+commission\s+until\s+next\s+recharge)\b"
    ),
]


def classify_risk_score(score: int) -> tuple[RiskCategory, str]:
    """Maps a 0–100 heuristic score to a risk category and carefully worded explanation."""
    if score >= THRESHOLD_VERY_HIGH:
        return (
            "Very High Risk Indicator",
            "Multiple high-severity warning indicators (such as upfront payment demands, credential/OTP requests, "
            "or severe domain impersonation) were detected. Do not send money, share sensitive credentials, or click "
            "embedded links until you verify the vacancy through an independent official source.",
        )
    if score >= THRESHOLD_HIGH:
        return (
            "High Risk Indicator",
            "Significant warning signs associated with recruitment scams were found in this submission. Exercise "
            "strong caution and verify the job opening directly on the employer's official career portal before proceeding.",
        )
    if score >= THRESHOLD_MODERATE:
        return (
            "Moderate Risk Indicator",
            "Some ambiguity, pressure language, or unverified contact details were identified. While these indicators "
            "do not prove fraud on their own, you should independently confirm the recruiter's identity and company details.",
        )
    return (
        "Lower Risk Indicator",
        "Few or no explicit scam indicators were triggered in the submitted text. However, absence of warning signs "
        "is not a certificate of authenticity—scammers can copy real job descriptions. Always verify the employer independently.",
    )


def run_deterministic_analysis(
    message_text: str,
    company_name: str | None = None,
    recruiter_email: str | None = None,
    job_url: str | None = None,
    weights: dict[str, int] | None = None,
) -> tuple[int, RiskCategory, str, str, list[Finding], list[str], VerificationReport]:
    """
    Executes the deterministic 10-category scam indicator engine and safe URL/domain verification.
    Guarantees deduplication per rule code and caps the final score at 100.
    """
    rule_weights = dict(DEFAULT_RULE_WEIGHTS)
    if weights:
        rule_weights.update(weights)

    verification = verify_submission_context(
        company_name=company_name,
        recruiter_email=recruiter_email,
        job_url=job_url,
        message_text=message_text,
    )

    filtered_text_for_fees = _strip_benign_disclaimer_sentences(message_text)
    findings_by_code: dict[str, Finding] = {}

    def add_finding(
        code: str,
        title: str,
        category: str,
        severity: SeverityLevel,
        evidence_items: list[str],
        explanation: str,
        recommendation: str,
    ) -> None:
        """Adds or merges a finding by stable code so duplicate matches never inflate the score."""
        if not evidence_items:
            return
        evidence_str = "; ".join(evidence_items[:2])
        if code in findings_by_code:
            existing = findings_by_code[code]
            if evidence_str not in existing.evidence:
                merged_ev = f"{existing.evidence}; {evidence_str}"[:280]
                findings_by_code[code] = existing.clone_with(update={"evidence": merged_ev})
            return

        findings_by_code[code] = Finding(
            code=code,
            title=title,
            category=category,
            severity=severity,
            points=rule_weights.get(code, 15),
            evidence=evidence_str,
            explanation=explanation,
            recommendation=recommendation,
        )

    # Category 1: Upfront fees
    fee_snippets = _extract_unique_snippets(filtered_text_for_fees, _UPFRONT_FEE_PATTERNS)
    if fee_snippets:
        add_finding(
            code="JG-FEE-001",
            title="Upfront Fee or Security Deposit Demand",
            category="upfront_fee",
            severity="critical",
            evidence_items=fee_snippets,
            explanation=(
                "The message requests an upfront payment (such as a registration, processing, training, security "
                "deposit, laptop, or document verification fee). Legitimate employers in India do not charge job "
                "applicants money to issue offer letters or schedule interviews."
            ),
            recommendation="Refuse any request to pay fees, deposits, or charges—even if promised as '100% refundable'.",
        )

    # Category 2: Guaranteed selection / no-interview claims
    guar_snippets = _extract_unique_snippets(message_text, _GUARANTEED_SELECTION_PATTERNS)
    if guar_snippets:
        add_finding(
            code="JG-GUAR-002",
            title="Guaranteed Selection or No-Interview Offer Claim",
            category="guaranteed_selection",
            severity="high",
            evidence_items=guar_snippets,
            explanation=(
                "The text promises guaranteed employment, 100% selection, or an immediate offer letter without a "
                "standard interview or technical assessment."
            ),
            recommendation="Treat unsolicited 'direct selection' offers with skepticism and verify whether you ever applied through an official portal.",
        )

    # Category 3: Artificial urgency and pressure tactics
    urg_snippets = _extract_unique_snippets(message_text, _URGENCY_PATTERNS)
    if urg_snippets:
        add_finding(
            code="JG-URG-003",
            title="Artificial Urgency or High-Pressure Deadline",
            category="urgency_pressure",
            severity="medium",
            evidence_items=urg_snippets,
            explanation=(
                "The message pressures you to pay, respond, or submit documents within minutes or hours to avoid "
                "losing a seat. Scammers use countdown pressure to prevent applicants from verifying the offer."
            ),
            recommendation="Pause and take time to verify the organization independently; genuine HR teams provide reasonable onboarding timelines.",
        )

    # Category 4: Suspiciously attractive compensation claims
    comp_snippets = _extract_unique_snippets(message_text, _UNREALISTIC_COMPENSATION_PATTERNS)
    if comp_snippets:
        add_finding(
            code="JG-COMP-004",
            title="Unrealistic Earning Promise for Low-Effort Work",
            category="unrealistic_compensation",
            severity="high",
            evidence_items=comp_snippets,
            explanation=(
                "The vacancy advertises unusually high daily or monthly payouts for minimal hours, mobile-only tasks, "
                "or zero-skill requirements—a classic hook used in recruitment and task scams."
            ),
            recommendation="Benchmark the offered compensation against standard market salaries for the role and qualification level.",
        )

    # Category 5: Requests for OTPs, UPI PINs, banking passwords, or remote screen-sharing
    sens_snippets = _extract_unique_snippets(filtered_text_for_fees, _SENSITIVE_DATA_PATTERNS)
    if sens_snippets:
        add_finding(
            code="JG-SENS-005",
            title="Request for OTP, UPI PIN, Banking Password, or Remote Access",
            category="sensitive_credentials",
            severity="critical",
            evidence_items=sens_snippets,
            explanation=(
                "The message asks for an OTP, UPI PIN, ATM PIN, banking password, CVV, or remote screen-sharing tool "
                "(e.g., AnyDesk/TeamViewer). No employer ever needs your PIN, OTP, or banking password to deposit salary."
            ),
            recommendation="Never share OTPs, UPI PINs, or banking passwords, and never scan a QR code and enter a UPI PIN to 'receive' money.",
        )

    # Category 10: Prepaid task / commission scam patterns
    task_snippets = _extract_unique_snippets(message_text, _PREPAID_TASK_SCAM_PATTERNS)
    if task_snippets:
        add_finding(
            code="JG-TASK-010",
            title="Prepaid Task or Commission-Unlock Scheme Indicator",
            category="prepaid_task_scam",
            severity="high",
            evidence_items=task_snippets,
            explanation=(
                "The message matches patterns from online 'task scams' (liking videos, rating merchants, or upgrading "
                "VIP tiers via prepaid recharges to unlock commissions)."
            ),
            recommendation="Exit any Telegram or WhatsApp task group that asks you to recharge money or buy prepaid task packages.",
        )

    # Category 6: Shortened URLs or suspicious link / URL anomalies
    inline_link_snippets = _extract_unique_snippets(message_text, _INLINE_LINK_PATTERNS)
    url_anomaly_evidences: list[str] = list(inline_link_snippets)
    if verification.is_shortened_url and verification.normalized_hostname:
        url_anomaly_evidences.append(f'Shortened job URL domain: "{verification.normalized_hostname}"')
    for warning in verification.url_warnings:
        url_anomaly_evidences.append(f'URL check: "{warning}"')

    if url_anomaly_evidences:
        add_finding(
            code="JG-LINK-006",
            title="Shortened, Messaging-Only, or Anomalous Link Detected",
            category="suspicious_link",
            severity="medium",
            evidence_items=url_anomaly_evidences,
            explanation=(
                "Shortened links (like bit.ly/tinyurl), Telegram/WhatsApp invite links, unencrypted HTTP links, or "
                "anomalous domain structures obscure the real destination and are frequently used in phishing."
            ),
            recommendation="Do not click shortened or untrusted links. Navigate to the employer's official career portal by typing its known address in your browser.",
        )

    # Category 7: Recruiter email-domain mismatch or brand impersonation warning
    domain_mismatch_evidences: list[str] = []
    if verification.registry_check.status == "impersonation_warning":
        domain_mismatch_evidences.append(f'Registry check: "{verification.registry_check.note}"')
    if verification.domain_comparison.relationship in ("free_email_with_corporate_url", "different_domains"):
        domain_mismatch_evidences.append(
            f'Email "{verification.domain_comparison.email_domain}" vs URL "{verification.domain_comparison.url_root_domain}"'
        )

    if domain_mismatch_evidences:
        add_finding(
            code="JG-DOM-007",
            title="Email Domain Mismatch or Official Brand Impersonation Signal",
            category="domain_mismatch",
            severity="high",
            evidence_items=domain_mismatch_evidences,
            explanation=(
                "The recruiter's email domain does not align with the supplied job website domain or the documented "
                "official domain of the named company. While third-party staffing agencies sometimes use their own "
                "corporate domain, scammers frequently impersonate major brands using unrelated or free email domains."
            ),
            recommendation="Verify on the employer's official website whether the sender domain is authorized to recruit on their behalf.",
        )

    # Category 8: Free email provider usage (low-severity warning, never proof of fraud)
    free_email_evidences: list[str] = []
    if verification.is_free_email_provider and verification.email_domain:
        free_email_evidences.append(f'Recruiter email uses free provider "@{verification.email_domain}"')
    else:
        inline_free = re.search(
            r"(?i)\b[A-Za-z0-9._%+-]+@(gmail\.com|yahoo\.com|yahoo\.co\.in|outlook\.com|hotmail\.com|rediffmail\.com)\b",
            message_text,
        )
        if inline_free:
            free_email_evidences.append(f'Contact email in text: "{inline_free.group(0)}"')

    if free_email_evidences:
        add_finding(
            code="JG-FREE-008",
            title="Recruiter Uses a Free Personal Webmail Provider",
            category="free_email_provider",
            severity="low",
            evidence_items=free_email_evidences,
            explanation=(
                "The recruiter contact uses a free consumer email service (such as Gmail, Yahoo, Outlook, or Rediffmail). "
                "This is a low-severity indicator and is never proof of fraud on its own—some small local businesses use "
                "free webmail—but large established companies almost always communicate from their corporate domain."
            ),
            recommendation="If the offer claims to be from a large corporation or PSU, treat a personal webmail address as a strong reason to verify directly with the company's HR department.",
        )

    # Category 9: Missing evidence needed to verify the employer ("unverified", not automatically fraudulent)
    missing_fields: list[str] = []
    if not (company_name and company_name.strip()):
        missing_fields.append("company name not provided")
    if not verification.email_valid:
        missing_fields.append("valid recruiter email not provided")
    if not verification.url_valid:
        missing_fields.append("valid official job URL not provided")

    if len(missing_fields) >= 2:
        add_finding(
            code="JG-UNV-009",
            title="Missing Verifiable Employer Metadata (Unverified Opportunity)",
            category="missing_verification_evidence",
            severity="low",
            evidence_items=[f"Missing metadata: {', '.join(missing_fields)}"],
            explanation=(
                "Key details needed to independently cross-check the employer (company name, corporate recruiter email, "
                "or official job posting URL) are missing. This marks the vacancy as 'unverified' rather than fraudulent."
            ),
            recommendation="Ask the recruiter for the company's full legal name, corporate website, official job requisition link, and landline/office address before sharing personal documents.",
        )

    # Sort findings by points descending, then severity
    findings = sorted(findings_by_code.values(), key=lambda f: f.points, reverse=True)
    raw_score = sum(f.points for f in findings)
    risk_score = min(100, max(0, raw_score))
    risk_category, category_explanation = classify_risk_score(risk_score)

    # Build concise, accurate summary
    if not findings:
        summary = (
            "No explicit heuristic scam patterns were triggered in the submitted text, and the supplied metadata "
            f"status is '{verification.verification_status.replace('_', ' ')}'. Because scammers can copy legitimate "
            "job descriptions verbatim, please still verify the opening on the employer's official career portal."
        )
    else:
        top_titles = ", ".join(f.title for f in findings[:3])
        summary = (
            f"Detected {len(findings)} heuristic warning indicator(s) (score {risk_score}/100 — {risk_category}), "
            f"including: {top_titles}. Review each extracted evidence snippet and complete the independent verification "
            "steps before taking action."
        )

    # Compile deduplicated recommendations
    recommendations: list[str] = []
    for f in findings:
        if f.recommendation not in recommendations:
            recommendations.append(f.recommendation)
    for step in verification.manual_verification_steps:
        if step not in recommendations and len(recommendations) < 7:
            recommendations.append(step)

    return (
        risk_score,
        risk_category,
        category_explanation,
        summary,
        findings,
        recommendations,
        verification,
    )


# Built-in sample messages for one-click hackathon demo and automated testing
SAMPLE_MESSAGES: list[SampleMessage] = [
    SampleMessage(
        id="suspicious-fee-scam",
        label="Suspicious Offer (Upfront Fee + Impersonation + Urgency)",
        kind="suspicious",
        company_name="Tata Consultancy Services (TCS)",
        recruiter_email="tcs.direct.hr.onboarding2026@gmail.com",
        job_url="http://bit.ly/tcs-fast-joining-2026",
        message_text=(
            "CONGRATULATIONS! Your resume has been shortlisted for Direct Joining as Junior Software Associate at "
            "Tata Consultancy Services (TCS) with a package of Rs. 65,000 per month (Work From Home, only 2 hours daily). "
            "No interview required! Guaranteed 100% selection under special campus quota.\n\n"
            "To generate your confirmed Offer Letter and dispatch your company MacBook, pay the refundable security "
            "deposit and laptop registration fee of Rs. 2,499 within 30 minutes via UPI. After payment, share your "
            "transaction screenshot and verification OTP on http://bit.ly/tcs-fast-joining-2026 or Telegram "
            "https://t.me/tcs_hr_desk_2026. Hurry—only 2 seats left today!"
        ),
        expected_note="Triggers upfront fee, guaranteed selection, urgency, unrealistic pay, sensitive OTP request, shortened/Telegram links, brand impersonation domain mismatch, and free webmail indicators.",
    ),
    SampleMessage(
        id="legitimate-campus-role",
        label="Legitimate Vacancy (Official Domain + Anti-Fee Notice)",
        kind="legitimate",
        company_name="Infosys",
        recruiter_email="campus.recruitment@infosys.com",
        job_url="https://www.infosys.com/careers/graduates.html",
        message_text=(
            "Infosys Campus Recruitment 2026 — Systems Engineer Role (Lucknow / Bengaluru / Hyderabad).\n\n"
            "Eligibility: B.Tech / B.E. / MCA graduates (2026 batch) with strong fundamentals in data structures, "
            "algorithms, relational databases, and software engineering.\n"
            "Selection Process: Round 1 Online Coding & Aptitude Assessment followed by Technical and HR Interviews.\n"
            "Compensation: INR 3.6 LPA – 6.25 LPA based on assessment performance.\n\n"
            "Please apply directly using your candidate profile on https://www.infosys.com/careers/graduates.html.\n"
            "Important Notice: Infosys does not charge any fee, security deposit, or training charge at any stage "
            "of its recruitment process, and never asks candidates for banking passwords or OTPs."
        ),
        expected_note="Aligns with Infosys's official domain, includes standard multi-round selection details, and recognizes the anti-fee notice without false-positive fee triggers.",
    ),
    SampleMessage(
        id="ambiguous-local-startup",
        label="Ambiguous Local Listing (Free Email + Unverified Company)",
        kind="ambiguous",
        company_name="Gomti Tech Solutions Pvt Ltd",
        recruiter_email="hr.gomtitech.lucknow@outlook.com",
        job_url="",
        message_text=(
            "Hi Candidate, we saw your profile and have an opening for a React & Python Intern at our Gomti Nagar, "
            "Lucknow office. Stipend is Rs. 12,000/month during the 3-month internship with a full-time conversion "
            "review after completion. There will be a 45-minute coding test and an in-person technical interview at "
            "our office next Tuesday. Reply to hr.gomtitech.lucknow@outlook.com if you would like the interview schedule."
        ),
        expected_note="Demonstrates balanced handling: flags free webmail and missing official website as low-to-moderate 'unverified' caution indicators rather than falsely labeling a small local business fraudulent.",
    ),
]
