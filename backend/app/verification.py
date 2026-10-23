"""Safe URL parsing, email-domain comparison, and official employer registry verification."""

from __future__ import annotations

from datetime import datetime, timezone
import re
from urllib.parse import urlparse

from .schemas import (
    DomainComparison,
    OfficialRegistryCheck,
    VerificationReport,
    VerificationStatus,
)
from .security import validate_hostname_ssrf_safe


# Known URL shorteners commonly abused in recruitment phishing/WhatsApp scams
KNOWN_URL_SHORTENERS: frozenset[str] = frozenset(
    {
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "cutt.ly",
        "rb.gy",
        "is.gd",
        "tiny.cc",
        "ow.ly",
        "rebrand.ly",
        "shorturl.at",
        "buff.ly",
        "bl.ink",
        "lnkd.in",
        "s.id",
        "v.gd",
        "clck.ru",
        "qr.ae",
    }
)

# Known consumer/free webmail providers
FREE_EMAIL_PROVIDERS: frozenset[str] = frozenset(
    {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.co.in",
        "ymail.com",
        "outlook.com",
        "hotmail.com",
        "live.com",
        "msn.com",
        "rediffmail.com",
        "proton.me",
        "protonmail.com",
        "icloud.com",
        "me.com",
        "aol.com",
        "zoho.com",
        "zohomail.in",
        "mail.com",
        "gmx.com",
        "yandex.com",
        "tutanota.com",
    }
)

# Legitimate third-party Applicant Tracking Systems (ATS) and Indian job portals
KNOWN_ATS_AND_JOB_PORTALS: dict[str, str] = {
    "myworkdayjobs.com": "Workday Recruiting",
    "workday.com": "Workday",
    "greenhouse.io": "Greenhouse ATS",
    "lever.co": "Lever ATS",
    "icims.com": "iCIMS ATS",
    "smartrecruiters.com": "SmartRecruiters ATS",
    "ashbyhq.com": "Ashby ATS",
    "bamboohr.com": "BambooHR",
    "zohorecruit.com": "Zoho Recruit",
    "zohorecruit.in": "Zoho Recruit India",
    "darwinbox.in": "Darwinbox HRMS",
    "darwinbox.com": "Darwinbox HRMS",
    "keka.com": "Keka HR",
    "freshteam.com": "Freshteam HR",
    "naukri.com": "Naukri Job Portal",
    "linkedin.com": "LinkedIn Jobs",
    "indeed.com": "Indeed",
    "co.in.indeed.com": "Indeed India",
    "internshala.com": "Internshala",
    "unstop.com": "Unstop",
    "joinsuperset.com": "Superset Campus Portal",
    "apna.co": "Apna Jobs",
    "foundit.in": "Foundit (Monster India)",
}

# Multi-label country-code second-level domains for accurate root-domain extraction
_MULTI_PART_PUBLIC_SUFFIXES: frozenset[str] = frozenset(
    {
        "co.in",
        "org.in",
        "ac.in",
        "gov.in",
        "nic.in",
        "net.in",
        "res.in",
        "edu.in",
        "ind.in",
        "firm.in",
        "gen.in",
        "co.uk",
        "org.uk",
        "ac.uk",
        "gov.uk",
        "com.au",
        "org.au",
        "edu.au",
        "co.jp",
        "co.nz",
        "co.za",
        "com.sg",
        "com.br",
    }
)

# Suspicious top-level domains frequently seen in disposable recruitment lure sites
SUSPICIOUS_TLDS: frozenset[str] = frozenset(
    {
        "xyz",
        "top",
        "click",
        "work",
        "buzz",
        "loan",
        "gq",
        "tk",
        "ml",
        "cf",
        "ga",
        "icu",
        "monster",
        "rest",
        "fit",
        "vip",
    }
)

# Curated local reference registry of major Indian & global employers targeted by impersonation scams
OFFICIAL_EMPLOYER_REGISTRY: list[dict[str, object]] = [
    {
        "name": "Tata Consultancy Services (TCS)",
        "aliases": ["tcs", "tata consultancy services", "tata consultancy", "tcs ion", "tcs nextstep"],
        "domains": ["tcs.com", "tcsion.com"],
        "careers_url": "https://www.tcs.com/careers",
    },
    {
        "name": "Infosys",
        "aliases": ["infosys", "infosys limited", "infosys bpm"],
        "domains": ["infosys.com"],
        "careers_url": "https://www.infosys.com/careers/",
    },
    {
        "name": "Wipro",
        "aliases": ["wipro", "wipro limited", "wipro wilp"],
        "domains": ["wipro.com"],
        "careers_url": "https://careers.wipro.com/",
    },
    {
        "name": "HCLTech",
        "aliases": ["hcl", "hcltech", "hcl technologies"],
        "domains": ["hcltech.com", "hcl.com"],
        "careers_url": "https://www.hcltech.com/careers",
    },
    {
        "name": "Tech Mahindra",
        "aliases": ["tech mahindra", "techmahindra", "techm"],
        "domains": ["techmahindra.com"],
        "careers_url": "https://careers.techmahindra.com/",
    },
    {
        "name": "Accenture",
        "aliases": ["accenture", "accenture india"],
        "domains": ["accenture.com"],
        "careers_url": "https://www.accenture.com/in-en/careers",
    },
    {
        "name": "Cognizant",
        "aliases": ["cognizant", "cts", "cognizant technology solutions"],
        "domains": ["cognizant.com"],
        "careers_url": "https://careers.cognizant.com/",
    },
    {
        "name": "Capgemini",
        "aliases": ["capgemini", "capgemini india"],
        "domains": ["capgemini.com"],
        "careers_url": "https://www.capgemini.com/in-en/careers/",
    },
    {
        "name": "Amazon",
        "aliases": ["amazon", "amazon india", "amazon web services", "aws"],
        "domains": ["amazon.com", "amazon.in", "amazon.jobs"],
        "careers_url": "https://www.amazon.jobs/",
    },
    {
        "name": "Google",
        "aliases": ["google", "google india", "alphabet"],
        "domains": ["google.com"],
        "careers_url": "https://www.google.com/about/careers/",
    },
    {
        "name": "Microsoft",
        "aliases": ["microsoft", "microsoft india"],
        "domains": ["microsoft.com"],
        "careers_url": "https://careers.microsoft.com/",
    },
    {
        "name": "Flipkart",
        "aliases": ["flipkart", "flipkart internet"],
        "domains": ["flipkart.com", "flipkartcareers.com"],
        "careers_url": "https://www.flipkartcareers.com/",
    },
    {
        "name": "Zoho Corporation",
        "aliases": ["zoho", "zoho corp", "zoho corporation"],
        "domains": ["zohocorp.com", "zoho.com"],
        "careers_url": "https://www.zoho.com/careers/",
    },
    {
        "name": "Razorpay",
        "aliases": ["razorpay"],
        "domains": ["razorpay.com"],
        "careers_url": "https://razorpay.com/jobs/",
    },
    {
        "name": "State Bank of India (SBI)",
        "aliases": ["sbi", "state bank of india"],
        "domains": ["sbi.co.in", "bank.sbi"],
        "careers_url": "https://sbi.co.in/web/careers",
    },
    {
        "name": "Indian Space Research Organisation (ISRO)",
        "aliases": ["isro", "indian space research organisation"],
        "domains": ["isro.gov.in", "nrsc.gov.in", "vssc.gov.in"],
        "careers_url": "https://www.isro.gov.in/Careers.html",
    },
    {
        "name": "Deloitte",
        "aliases": ["deloitte", "deloitte india", "deloitte usi"],
        "domains": ["deloitte.com"],
        "careers_url": "https://www2.deloitte.com/ui/en/careers/careers.html",
    },
]

_EMAIL_RE = re.compile(r"^[^@\s]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)$")
_HOSTNAME_LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def extract_root_domain(hostname: str) -> str:
    """
    Extracts the registrable root domain from a normalized hostname, accounting
    for multi-label suffixes such as .co.in, .gov.in, .ac.in, .co.uk.
    """
    cleaned = hostname.strip().lower().rstrip(".")
    parts = [p for p in cleaned.split(".") if p]
    if len(parts) <= 2:
        return cleaned

    last_two = ".".join(parts[-2:])
    if last_two in _MULTI_PART_PUBLIC_SUFFIXES and len(parts) >= 3:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def parse_and_validate_email(email: str | None) -> tuple[bool, str | None, bool]:
    """
    Validates recruiter email format and returns (is_valid, domain, is_free_provider).
    """
    if not email or not email.strip():
        return False, None, False

    candidate = email.strip()
    match = _EMAIL_RE.match(candidate)
    if not match:
        return False, None, False

    domain = match.group(1).lower().rstrip(".")
    labels = domain.split(".")
    if len(labels) < 2 or not all(_HOSTNAME_LABEL_RE.match(lbl) for lbl in labels):
        return False, None, False

    root_dom = extract_root_domain(domain)
    is_free = domain in FREE_EMAIL_PROVIDERS or root_dom in FREE_EMAIL_PROVIDERS
    return True, domain, is_free


def parse_and_validate_url(raw_url: str | None) -> dict[str, object]:
    """
    Safely parses a user-supplied URL without making any network requests.
    Accepts only valid HTTP and HTTPS URLs, normalizes hostnames via IDNA,
    and flags shorteners, userinfo tricks, non-HTTPS, IP literals, and anomalous domains.
    """
    result: dict[str, object] = {
        "provided": False,
        "valid": False,
        "normalized_url": None,
        "hostname": None,
        "root_domain": None,
        "is_https": False,
        "is_shortened": False,
        "warnings": [],
    }
    if not raw_url or not raw_url.strip():
        return result

    result["provided"] = True
    candidate = raw_url.strip()
    warnings: list[str] = []

    if len(candidate) > 2048 or any(ch.isspace() for ch in candidate):
        warnings.append("URL contains whitespace or exceeds maximum safe length.")
        result["warnings"] = warnings
        return result

    try:
        parsed = urlparse(candidate)
    except ValueError:
        warnings.append("Malformed URL structure could not be parsed.")
        result["warnings"] = warnings
        return result

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        warnings.append(
            f"Unsupported or missing URL scheme '{scheme or 'none'}'. Only http:// and https:// URLs are accepted."
        )
        result["warnings"] = warnings
        return result

    if parsed.username or parsed.password or "@" in (parsed.netloc or ""):
        warnings.append(
            "URL contains embedded '@' credentials/userinfo before the hostname, a common phishing obfuscation technique."
        )

    raw_host = parsed.hostname
    if not raw_host:
        warnings.append("URL does not contain a valid hostname.")
        result["warnings"] = warnings
        return result

    try:
        normalized_host = raw_host.encode("idna").decode("ascii").lower().rstrip(".")
    except UnicodeError:
        warnings.append("Hostname failed internationalized domain name (IDNA) normalization.")
        result["warnings"] = warnings
        return result

    ssrf_ok, ssrf_reason = validate_hostname_ssrf_safe(normalized_host, resolve_dns=False)
    if not ssrf_ok:
        warnings.append(ssrf_reason)
        result["hostname"] = normalized_host
        result["warnings"] = warnings
        return result

    labels = normalized_host.split(".")
    if len(labels) < 2 or not all(_HOSTNAME_LABEL_RE.match(lbl) for lbl in labels):
        warnings.append(f"Hostname '{normalized_host}' is not a valid public domain name.")
        result["hostname"] = normalized_host
        result["warnings"] = warnings
        return result

    root_domain = extract_root_domain(normalized_host)
    is_https = scheme == "https"
    if not is_https:
        warnings.append("Job URL uses unencrypted HTTP rather than HTTPS.")

    is_shortened = normalized_host in KNOWN_URL_SHORTENERS or root_domain in KNOWN_URL_SHORTENERS
    if is_shortened:
        warnings.append(
            f"URL uses a link shortener ({normalized_host}), which hides the true destination domain."
        )

    if len(labels) > 4:
        warnings.append(
            f"Hostname '{normalized_host}' has an unusually deep subdomain chain ({len(labels)} levels)."
        )

    if "xn--" in normalized_host:
        warnings.append(
            f"Hostname '{normalized_host}' uses Punycode (xn--), which can be used for lookalike character spoofing."
        )

    tld = labels[-1]
    if tld in SUSPICIOUS_TLDS:
        warnings.append(
            f"Domain ends with '.{tld}', a top-level domain frequently abused by short-lived scam pages."
        )

    # Check for deceptive multi-hyphen recruitment keywords in root domain
    root_label = root_domain.split(".")[0]
    if root_label.count("-") >= 2 and any(
        kw in root_label for kw in ("job", "career", "hire", "hiring", "offer", "recruit", "apply", "verify")
    ):
        warnings.append(
            f"Root domain '{root_domain}' combines multiple hyphens with recruitment keywords, a common pattern in lookalike domains."
        )

    normalized_path = parsed.path or "/"
    normalized_url = f"{scheme}://{normalized_host}{normalized_path}"
    if parsed.query:
        normalized_url += f"?{parsed.query}"

    result.update(
        {
            "valid": True,
            "normalized_url": normalized_url,
            "hostname": normalized_host,
            "root_domain": root_domain,
            "is_https": is_https,
            "is_shortened": is_shortened,
            "warnings": warnings,
        }
    )
    return result


def compare_email_and_url_domains(
    email_domain: str | None,
    is_free_email: bool,
    url_hostname: str | None,
    url_root_domain: str | None,
) -> DomainComparison:
    """
    Compares the recruiter's email domain with the supplied job URL hostname.
    Accounts for subdomains and legitimate third-party ATS platforms.
    """
    if not email_domain or not url_hostname or not url_root_domain:
        return DomainComparison(
            compared=False,
            email_domain=email_domain,
            url_hostname=url_hostname,
            url_root_domain=url_root_domain,
            relationship="not_applicable",
            explanation="Domain comparison requires both a valid recruiter email and a valid job URL.",
        )

    email_root = extract_root_domain(email_domain)

    if email_domain == url_hostname or email_root == url_root_domain:
        if email_domain == url_hostname:
            return DomainComparison(
                compared=True,
                email_domain=email_domain,
                url_hostname=url_hostname,
                url_root_domain=url_root_domain,
                relationship="exact_match",
                explanation=(
                    f"Recruiter email domain '{email_domain}' matches the job URL domain '{url_hostname}'. "
                    "Note: email sender headers can still be spoofed, so verify the message in your email client."
                ),
            )
        return DomainComparison(
            compared=True,
            email_domain=email_domain,
            url_hostname=url_hostname,
            url_root_domain=url_root_domain,
            relationship="subdomain_match",
            explanation=(
                f"Recruiter email domain '{email_domain}' and job URL '{url_hostname}' share the same "
                f"root domain '{url_root_domain}'."
            ),
        )

    # Check if the URL is hosted on a known third-party ATS or job board
    ats_name = KNOWN_ATS_AND_JOB_PORTALS.get(url_root_domain) or KNOWN_ATS_AND_JOB_PORTALS.get(url_hostname)
    if ats_name and not is_free_email:
        return DomainComparison(
            compared=True,
            email_domain=email_domain,
            url_hostname=url_hostname,
            url_root_domain=url_root_domain,
            relationship="known_ats_platform",
            explanation=(
                f"The job URL is hosted on '{url_root_domain}' ({ats_name}), a known recruitment/ATS platform, "
                f"while the recruiter email uses '{email_domain}'. Legitimate companies often use third-party ATS "
                "portals, but you should confirm on the employer's main website that they use this portal."
            ),
        )

    if is_free_email:
        return DomainComparison(
            compared=True,
            email_domain=email_domain,
            url_hostname=url_hostname,
            url_root_domain=url_root_domain,
            relationship="free_email_with_corporate_url",
            explanation=(
                f"The job URL points to '{url_root_domain}', but the recruiter is writing from a free personal "
                f"email provider ('{email_domain}') instead of an official '@{url_root_domain}' address."
            ),
        )

    return DomainComparison(
        compared=True,
        email_domain=email_domain,
        url_hostname=url_hostname,
        url_root_domain=url_root_domain,
        relationship="different_domains",
        explanation=(
            f"The recruiter email root domain ('{email_root}') does not match the job URL root domain "
            f"('{url_root_domain}'). While some external staffing agencies use their own domain, verify "
            "whether the sender is an authorized recruiter for the stated employer."
        ),
    )


def check_official_employer_registry(
    company_name: str | None,
    message_text: str,
    email_domain: str | None,
    url_root_domain: str | None,
) -> OfficialRegistryCheck:
    """
    Checks whether the stated company name (or brand prominently claimed in the message)
    matches an entry in our documented official employer registry, and compares the supplied
    email/URL domains against the employer's documented official domains.
    """
    now = datetime.now(timezone.utc)
    candidate_name = (company_name or "").strip().lower()
    lower_msg = message_text.lower()

    matched_entry: dict[str, object] | None = None
    for entry in OFFICIAL_EMPLOYER_REGISTRY:
        aliases: list[str] = entry["aliases"]  # type: ignore[assignment]
        if candidate_name:
            for alias in aliases:
                if candidate_name == alias or re.search(rf"\b{re.escape(alias)}\b", candidate_name):
                    matched_entry = entry
                    break
        if matched_entry:
            break

    # If no company_name was entered in the field, check if the message explicitly claims to be from a registry brand
    if not matched_entry and not candidate_name:
        for entry in OFFICIAL_EMPLOYER_REGISTRY:
            aliases = entry["aliases"]  # type: ignore[assignment]
            for alias in aliases:
                if len(alias) >= 4 and re.search(
                    rf"(?i)\b(?:welcome to|selected at|offer from|hiring for|recruitment team of)\s+{re.escape(alias)}\b",
                    lower_msg,
                ):
                    matched_entry = entry
                    break
            if matched_entry:
                break

    if not matched_entry:
        return OfficialRegistryCheck(
            checked=True,
            matched_employer=None,
            official_domains=[],
            official_careers_url=None,
            status="unverified",
            note=(
                "The stated employer is not in JobGuard AI's built-in reference registry of major employers. "
                "This means the employer is 'unverified' (not automatically fraudulent). Use the manual "
                "verification checklist below to confirm the company's MCA registration and official website."
            ),
            checked_at=now,
        )

    official_name = str(matched_entry["name"])
    official_domains: list[str] = list(matched_entry["domains"])  # type: ignore[arg-type]
    careers_url = str(matched_entry["careers_url"])

    email_root = extract_root_domain(email_domain) if email_domain else None
    email_matches = email_root in official_domains if email_root else False
    url_matches = url_root_domain in official_domains if url_root_domain else False
    url_is_ats = (url_root_domain in KNOWN_ATS_AND_JOB_PORTALS) if url_root_domain else False

    if (email_root and not email_matches) or (url_root_domain and not url_matches and not url_is_ats):
        mismatched_parts: list[str] = []
        if email_domain and not email_matches:
            mismatched_parts.append(f"recruiter email domain '{email_domain}'")
        if url_root_domain and not url_matches and not url_is_ats:
            mismatched_parts.append(f"job URL domain '{url_root_domain}'")
        mismatch_str = " and ".join(mismatched_parts)
        return OfficialRegistryCheck(
            checked=True,
            matched_employer=official_name,
            official_domains=official_domains,
            official_careers_url=careers_url,
            status="impersonation_warning",
            note=(
                f"Impersonation Alert: The submission references {official_name}, whose official domains are "
                f"{', '.join(official_domains)}, but the supplied {mismatch_str} does not match {official_name}'s "
                f"official domains. Verify directly at {careers_url}."
            ),
            checked_at=now,
        )

    if email_matches or url_matches:
        return OfficialRegistryCheck(
            checked=True,
            matched_employer=official_name,
            official_domains=official_domains,
            official_careers_url=careers_url,
            status="verified_official_domain",
            note=(
                f"The supplied domain aligns with {official_name}'s documented official domain "
                f"({', '.join(official_domains)}). Because email headers or pasted links can still be forged in "
                f"messages, always cross-check the requisition ID directly on {careers_url}."
            ),
            checked_at=now,
        )

    return OfficialRegistryCheck(
        checked=True,
        matched_employer=official_name,
        official_domains=official_domains,
        official_careers_url=careers_url,
        status="unverified",
        note=(
            f"The submission mentions {official_name}, Dual-check that any recruiter email ends in "
            f"{' or '.join('@' + d for d in official_domains)} and verify openings on {careers_url}."
        ),
        checked_at=now,
    )


def verify_submission_context(
    company_name: str | None,
    recruiter_email: str | None,
    job_url: str | None,
    message_text: str,
) -> VerificationReport:
    """
    Runs the complete safe URL, email, domain comparison, and official employer registry
    verification pipeline without making arbitrary outbound network requests.
    """
    url_info = parse_and_validate_url(job_url)
    email_provided = bool(recruiter_email and recruiter_email.strip())
    email_valid, email_domain, is_free_email = parse_and_validate_email(recruiter_email)

    url_warnings: list[str] = list(url_info["warnings"])  # type: ignore[arg-type]
    if email_provided and not email_valid:
        url_warnings.append("Supplied recruiter email address is not in a valid user@domain.tld format.")

    domain_comp = compare_email_and_url_domains(
        email_domain=email_domain,
        is_free_email=is_free_email,
        url_hostname=url_info["hostname"] if url_info["valid"] else None,  # type: ignore[arg-type]
        url_root_domain=url_info["root_domain"] if url_info["valid"] else None,  # type: ignore[arg-type]
    )

    registry_check = check_official_employer_registry(
        company_name=company_name,
        message_text=message_text,
        email_domain=email_domain,
        url_root_domain=url_info["root_domain"] if url_info["valid"] else None,  # type: ignore[arg-type]
    )

    # Determine overall verification status
    if url_info["provided"] and not url_info["valid"]:
        overall_status: VerificationStatus = "invalid_url"
        summary = "The supplied job URL is malformed or uses an unsupported/unsafe format."
    elif registry_check.status == "impersonation_warning":
        overall_status = "impersonation_warning"
        summary = registry_check.note
    elif domain_comp.relationship in ("free_email_with_corporate_url", "different_domains"):
        overall_status = "domain_mismatch"
        summary = domain_comp.explanation
    elif registry_check.status == "verified_official_domain":
        overall_status = "verified_official_domain"
        summary = registry_check.note
    elif domain_comp.relationship in ("exact_match", "subdomain_match"):
        overall_status = "domain_aligned"
        summary = (
            f"Recruiter email and job URL share the domain '{url_info['root_domain']}'. "
            "Domain alignment is a positive consistency signal, though domain heuristics alone cannot prove a vacancy is genuine."
        )
    elif domain_comp.relationship == "known_ats_platform":
        overall_status = "third_party_ats"
        summary = domain_comp.explanation
    else:
        overall_status = "unverified"
        summary = (
            "Employer authenticity cannot be confirmed from the provided metadata alone. "
            "Domain heuristics cannot prove a job is genuine; please complete the independent checks below."
        )

    manual_steps = [
        "Open a new browser tab and navigate to the employer's official website independently rather than clicking links inside unsolicited messages.",
        "Verify corporate registration on the Ministry of Corporate Affairs (MCA21) portal (mca.gov.in) for Indian companies.",
        "Cross-check the job requisition ID on the company's official Careers page or verified LinkedIn page.",
        "Confirm that the recruiter's email address uses the company's primary domain and check email authentication headers (SPF/DKIM) in your mail client.",
        "Never pay any registration, refundable deposit, training, laptop, or document verification fee—legitimate employers in India do not charge applicants to get hired.",
    ]

    return VerificationReport(
        url_provided=bool(url_info["provided"]),
        url_valid=bool(url_info["valid"]),
        normalized_url=url_info["normalized_url"],  # type: ignore[arg-type]
        normalized_hostname=url_info["hostname"],  # type: ignore[arg-type]
        root_domain=url_info["root_domain"],  # type: ignore[arg-type]
        is_https=bool(url_info["is_https"]),
        is_shortened_url=bool(url_info["is_shortened"]),
        url_warnings=url_warnings,
        email_provided=email_provided,
        email_valid=email_valid,
        email_domain=email_domain,
        is_free_email_provider=is_free_email,
        domain_comparison=domain_comp,
        registry_check=registry_check,
        verification_status=overall_status,
        verification_summary=summary,
        manual_verification_steps=manual_steps,
    )
