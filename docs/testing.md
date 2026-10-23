# JobGuard AI — Testing & Validation Guide

## 1. Automated Backend Unit & API Test Suite

The backend test suite (`backend/tests/test_jobguard.py`) is written using Python's standard `unittest` framework and FastAPI's `TestClient` (and is also 100% compatible with `pytest`), so it runs in both offline sandboxes and standard virtual environments.

### Run Command (Windows PowerShell)

```powershell
cd jobguard-ai04\backend
$env:PYTHONPATH = "."
python -m unittest discover -s tests -v
```

### Run Command (Linux / macOS)

```bash
cd jobguard-ai04/backend
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

### Actual Verified Test Cases & Results (12 / 12 Passed)

1. `test_01_upfront_fee_detection` — **PASS**: Verifies `JG-FEE-001` (`critical`) triggers on refundable registration/security deposit demands and extracts exact rupee evidence.
2. `test_02_urgency_and_guaranteed_selection_indicators` — **PASS**: Verifies `JG-GUAR-002` and `JG-URG-003` trigger on "direct joining without any interview", "100% job guarantee", and "within 30 minutes".
3. `test_03_sensitive_data_requests` — **PASS**: Verifies `JG-SENS-005` (`critical`) triggers on OTP, UPI PIN QR-code traps, and AnyDesk KYC requests.
4. `test_04_free_email_provider_handling_as_low_severity` — **PASS**: Verifies `@gmail.com` triggers `JG-FREE-008` with `low` severity (12 points) and keeps the overall category at `Lower Risk Indicator` when no other scam indicators exist.
5. `test_05_url_parsing_malformed_and_ssrf_protection` — **PASS**: Verifies HTTPS normalization, `bit.ly` shortener detection, rejection of `javascript:` and `ftp:` schemes, and SSRF blocking of `127.0.0.1`, `localhost`, `169.254.169.254`, `192.168.1.10`, `10.0.0.5`, and `metadata.google.internal`.
6. `test_06_domain_comparison_and_ats_handling` — **PASS**: Verifies multi-label `.co.in` subdomain matching (`careers.sbi.co.in` vs `sbi.co.in`), recognition of Workday ATS (`myworkdayjobs.com`), and TCS brand impersonation detection.
7. `test_07_score_cap_and_duplicate_indicator_prevention` — **PASS**: Verifies that 4 repeated upfront fee sentences produce only 1 `JG-FEE-001` finding (no double-counting) and that multi-indicator submissions cap strictly at `100`.
8. `test_08_legitimate_message_false_positive_protection` — **PASS**: Verifies that the legitimate Infosys campus recruitment message containing an explicit anti-fee disclaimer (*"Infosys does not charge any fee..."*) scores `0/100` (`Lower Risk Indicator`) with `verified_official_domain` status.
9. `test_09_sensitive_data_redaction` — **PASS**: Verifies Aadhaar-like 12-digit numbers, PAN numbers, 15-digit bank account numbers, and explicit OTP/UPI PIN values are masked before AI or database calls.
10. `test_10_ai_failure_fallback_and_schema_validation` — **PASS**: Verifies clean fallback when AI is disabled, clean fallback when a mocked provider returns invalid JSON, and automatic stripping of `<script>` / `<b>` HTML tags when a valid JSON response is returned.
11. `test_11_api_endpoints_and_validation` — **PASS**: Verifies `GET /health`, `GET /api/samples`, `POST /api/analyze` `422` validation on short inputs, and `POST /api/analyze` `200` response structure (including `persistence.saved = False` when Supabase is unconfigured).
12. `test_12_unauthorized_access_and_supabase_rls_forwarding` — **PASS**: Verifies `GET /api/reports` rejects unauthenticated requests with `401` and `save_analysis_report_to_supabase` refuses to save without a valid user bearer token.

## 2. Sample Messages for Manual Testing

### Sample 1: Suspicious Recruitment Message (Expected: 100/100 — Very High Risk Indicator)

- **Company Name:** `Tata Consultancy Services (TCS)`
- **Recruiter Email:** `tcs.direct.hr.onboarding2026@gmail.com`
- **Job URL:** `http://bit.ly/tcs-fast-joining-2026`
- **Message Text:**
  > CONGRATULATIONS! Your resume has been shortlisted for Direct Joining as Junior Software Associate at Tata Consultancy Services (TCS) with a package of Rs. 65,000 per month (Work From Home, only 2 hours daily). No interview required! Guaranteed 100% selection under special campus quota. To generate your confirmed Offer Letter and dispatch your company MacBook, pay the refundable security deposit and laptop registration fee of Rs. 2,499 within 30 minutes via UPI. After payment, share your transaction screenshot and verification OTP on http://bit.ly/tcs-fast-joining-2026 or Telegram https://t.me/tcs_hr_desk_2026. Hurry—only 2 seats left today!

### Sample 2: Legitimate Campus Vacancy (Expected: 0/100 — Lower Risk Indicator)

- **Company Name:** `Infosys`
- **Recruiter Email:** `campus.recruitment@infosys.com`
- **Job URL:** `https://www.infosys.com/careers/graduates.html`
- **Message Text:**
  > Infosys Campus Recruitment 2026 — Systems Engineer Role (Lucknow / Bengaluru / Hyderabad). Eligibility: B.Tech / B.E. / MCA graduates (2026 batch) with strong fundamentals in data structures, algorithms, relational databases, and software engineering. Selection Process: Round 1 Online Coding & Aptitude Assessment followed by Technical and HR Interviews. Compensation: INR 3.6 LPA – 6.25 LPA based on assessment performance. Please apply directly using your candidate profile on https://www.infosys.com/careers/graduates.html. Important Notice: Infosys does not charge any fee, security deposit, or training charge at any stage of its recruitment process, and never asks candidates for banking passwords or OTPs.
