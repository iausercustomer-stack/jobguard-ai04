"""Comprehensive automated test suite for JobGuard AI Backend (compatible with both unittest and pytest)."""

from __future__ import annotations

import json
import os
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import httpx

from app.ai_explainer import AIConfig, generate_optional_ai_explanation
from app.analyzer import SAMPLE_MESSAGES, run_deterministic_analysis
from app.main import app, get_configured_cors_origins
from app.security import (
    is_ip_address_safe_public,
    redact_sensitive_text,
    validate_hostname_ssrf_safe,
)
from app.supabase_client import (
    SupabaseConfig,
    fetch_user_reports_from_supabase,
    save_analysis_report_to_supabase,
)
from app.verification import (
    compare_email_and_url_domains,
    extract_root_domain,
    parse_and_validate_email,
    parse_and_validate_url,
    verify_submission_context,
)


class TestJobGuardAnalyzerAndVerification(unittest.TestCase):
    """Tests covering all 10 deterministic categories, URL verification, SSRF, redaction, AI fallback, API, and cloud readiness."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_01_upfront_fee_detection(self) -> None:
        text = (
            "Your application is shortlisted. Please pay a refundable registration fee of Rs. 1,999 "
            "towards laptop security deposit and document verification charges today."
        )
        score, category, _, _, findings, _, _ = run_deterministic_analysis(
            message_text=text,
            company_name="Example Corp",
            recruiter_email="hr@example.com",
            job_url="https://careers.example.com/job/123",
        )
        codes = {f.code for f in findings}
        self.assertIn("JG-FEE-001", codes)
        fee_finding = next(f for f in findings if f.code == "JG-FEE-001")
        self.assertEqual(fee_finding.severity, "critical")
        self.assertIn("1,999", fee_finding.evidence)
        self.assertGreaterEqual(score, 45)
        self.assertIn(category, ("High Risk Indicator", "Very High Risk Indicator"))

    def test_02_urgency_and_guaranteed_selection_indicators(self) -> None:
        text = (
            "Congratulations! Direct joining without any interview! 100% job guarantee in our back-office team. "
            "Confirm your seat and complete registration within 30 minutes—only 2 seats left for today!"
        )
        score, _, _, _, findings, _, _ = run_deterministic_analysis(
            message_text=text,
            company_name="FastHire Services",
            recruiter_email="careers@fasthire.in",
            job_url="https://fasthire.in/apply",
        )
        codes = {f.code for f in findings}
        self.assertIn("JG-GUAR-002", codes)
        self.assertIn("JG-URG-003", codes)
        self.assertGreaterEqual(score, 40)

    def test_03_sensitive_data_requests(self) -> None:
        text = (
            "For salary account activation, please share your OTP and enter your UPI PIN after scanning the QR code, "
            "or install AnyDesk for bank KYC verification."
        )
        score, _, _, _, findings, _, _ = run_deterministic_analysis(
            message_text=text,
            company_name="Payroll Desk",
        )
        codes = {f.code for f in findings}
        self.assertIn("JG-SENS-005", codes)
        sens_finding = next(f for f in findings if f.code == "JG-SENS-005")
        self.assertEqual(sens_finding.severity, "critical")
        self.assertGreaterEqual(score, 45)

    def test_04_free_email_provider_handling_as_low_severity(self) -> None:
        text = (
            "Hello candidate, we are scheduling a 30-minute technical interview for our Junior Web Developer role "
            "at our Lucknow office next Wednesday. Please confirm your availability."
        )
        score, category, _, _, findings, _, _ = run_deterministic_analysis(
            message_text=text,
            company_name="Gomti Web Studio",
            recruiter_email="gomtiwebstudio.hr@gmail.com",
            job_url="https://gomtiwebstudio.in/careers",
        )
        codes = {f.code for f in findings}
        self.assertIn("JG-FREE-008", codes)
        free_finding = next(f for f in findings if f.code == "JG-FREE-008")
        self.assertEqual(free_finding.severity, "low")
        self.assertLessEqual(free_finding.points, 15)
        score_only_free, cat_only_free, _, _, _, _, _ = run_deterministic_analysis(
            message_text=text,
            company_name="Gomti Web Studio",
            recruiter_email="gomtiwebstudio.hr@gmail.com",
            job_url=None,
        )
        self.assertLess(score_only_free, 20)
        self.assertEqual(cat_only_free, "Lower Risk Indicator")

    def test_05_url_parsing_malformed_and_ssrf_protection(self) -> None:
        valid_res = parse_and_validate_url("https://Careers.Infosys.com/jobs/123?ref=campus")
        self.assertTrue(valid_res["valid"])
        self.assertEqual(valid_res["hostname"], "careers.infosys.com")
        self.assertEqual(valid_res["root_domain"], "infosys.com")
        self.assertTrue(valid_res["is_https"])

        short_res = parse_and_validate_url("https://bit.ly/fake-job-2026")
        self.assertTrue(short_res["valid"])
        self.assertTrue(short_res["is_shortened"])

        js_res = parse_and_validate_url("javascript:alert(1)")
        self.assertFalse(js_res["valid"])

        ftp_res = parse_and_validate_url("ftp://files.example.com/offer.pdf")
        self.assertFalse(ftp_res["valid"])

        for unsafe_url in [
            "http://127.0.0.1:8000/admin",
            "http://localhost/jobs",
            "http://169.254.169.254/latest/meta-data/",
            "http://192.168.1.10/career",
            "http://10.0.0.5/internal",
            "http://metadata.google.internal/computeMetadata/v1/",
        ]:
            parsed = parse_and_validate_url(unsafe_url)
            self.assertFalse(parsed["valid"], f"Expected {unsafe_url} to be rejected by SSRF check")

        self.assertFalse(is_ip_address_safe_public("127.0.0.1")[0])
        self.assertFalse(is_ip_address_safe_public("169.254.169.254")[0])
        self.assertFalse(is_ip_address_safe_public("10.1.2.3")[0])
        self.assertTrue(is_ip_address_safe_public("8.8.8.8")[0])

    def test_06_domain_comparison_and_ats_handling(self) -> None:
        self.assertEqual(extract_root_domain("careers.sbi.co.in"), "sbi.co.in")
        comp_sub = compare_email_and_url_domains(
            email_domain="hr@sbi.co.in".split("@")[1],
            is_free_email=False,
            url_hostname="careers.sbi.co.in",
            url_root_domain="sbi.co.in",
        )
        self.assertEqual(comp_sub.relationship, "subdomain_match")

        comp_ats = compare_email_and_url_domains(
            email_domain="acme.com",
            is_free_email=False,
            url_hostname="acme.myworkdayjobs.com",
            url_root_domain="myworkdayjobs.com",
        )
        self.assertEqual(comp_ats.relationship, "known_ats_platform")

        ver_imp = verify_submission_context(
            company_name="Tata Consultancy Services (TCS)",
            recruiter_email="hr@tcs-onboarding-india.xyz",
            job_url="https://tcs-onboarding-india.xyz/apply",
            message_text="Welcome to TCS direct joining.",
        )
        self.assertEqual(ver_imp.verification_status, "impersonation_warning")

    def test_07_score_cap_and_duplicate_indicator_prevention(self) -> None:
        repeated_fee_text = (
            "Pay registration fee of Rs. 1500 today. "
            "Deposit security fee of Rs. 2500 immediately. "
            "Mandatory training fee of Rs. 3000 is required. "
            "Pay laptop fee of Rs. 4000 for dispatch."
        )
        score, _, _, _, findings, _, _ = run_deterministic_analysis(
            message_text=repeated_fee_text,
            company_name="Acme",
            recruiter_email="hr@acme.com",
            job_url="https://acme.com/jobs",
        )
        fee_findings = [f for f in findings if f.code == "JG-FEE-001"]
        self.assertEqual(len(fee_findings), 1, "Duplicate matches for the same category must not be double-counted")
        self.assertEqual(score, fee_findings[0].points)

        extreme_sample = SAMPLE_MESSAGES[0]
        max_score, max_cat, _, _, all_findings, _, _ = run_deterministic_analysis(
            message_text=extreme_sample.message_text,
            company_name=extreme_sample.company_name,
            recruiter_email=extreme_sample.recruiter_email,
            job_url=extreme_sample.job_url,
        )
        self.assertLessEqual(max_score, 100)
        self.assertGreaterEqual(max_score, 70)
        self.assertEqual(max_cat, "Very High Risk Indicator")
        self.assertGreaterEqual(len(all_findings), 5)

    def test_08_legitimate_message_false_positive_protection(self) -> None:
        legit_sample = SAMPLE_MESSAGES[1]
        score, category, _, _, findings, _, verification = run_deterministic_analysis(
            message_text=legit_sample.message_text,
            company_name=legit_sample.company_name,
            recruiter_email=legit_sample.recruiter_email,
            job_url=legit_sample.job_url,
        )
        self.assertEqual(score, 0, f"Expected 0 score for legitimate sample with anti-fee notice, got {findings}")
        self.assertEqual(category, "Lower Risk Indicator")
        self.assertEqual(verification.verification_status, "verified_official_domain")

    def test_09_sensitive_data_redaction(self) -> None:
        raw = (
            "My Aadhaar is 4589 2310 9981, PAN is ABCDE1234F, bank account 123456789012345, "
            "and OTP: 839201 or UPI PIN = 4321."
        )
        redacted, count, types = redact_sensitive_text(raw)
        self.assertGreaterEqual(count, 4)
        self.assertNotIn("4589 2310 9981", redacted)
        self.assertNotIn("ABCDE1234F", redacted)
        self.assertNotIn("123456789012345", redacted)
        self.assertNotIn("839201", redacted)
        self.assertIn("[REDACTED-PAN]", redacted)
        self.assertIn("[REDACTED-ID-12]", redacted)
        self.assertIn("[REDACTED-SECRET]", redacted)

    def test_10_ai_failure_fallback_and_schema_validation(self) -> None:
        _, _, _, _, findings, _, verification = run_deterministic_analysis(
            message_text=SAMPLE_MESSAGES[0].message_text,
            company_name=SAMPLE_MESSAGES[0].company_name,
            recruiter_email=SAMPLE_MESSAGES[0].recruiter_email,
            job_url=SAMPLE_MESSAGES[0].job_url,
        )

        disabled_cfg = AIConfig()
        disabled_cfg.enabled = False
        status_disabled = generate_optional_ai_explanation(
            use_ai_requested=True,
            redacted_text="Sample text",
            company_name="TCS",
            recruiter_email="a@gmail.com",
            job_url="https://tcs.com",
            risk_score=85,
            risk_category="Very High Risk Indicator",
            findings=findings,
            verification=verification,
            config=disabled_cfg,
        )
        self.assertTrue(status_disabled.requested)
        self.assertFalse(status_disabled.used)
        self.assertIsNotNone(status_disabled.fallback_reason)

        enabled_cfg = AIConfig()
        enabled_cfg.enabled = True
        enabled_cfg.api_key = "test-key"
        enabled_cfg.base_url = "https://api.example.com/v1"

        mock_bad_client = MagicMock(spec=httpx.Client)
        mock_bad_resp = MagicMock()
        mock_bad_resp.status_code = 200
        mock_bad_resp.json.return_value = {
            "choices": [{"message": {"content": "NOT VALID JSON AT ALL"}}]
        }
        mock_bad_client.post.return_value = mock_bad_resp

        status_bad_json = generate_optional_ai_explanation(
            use_ai_requested=True,
            redacted_text="Sample text",
            company_name="TCS",
            recruiter_email="a@gmail.com",
            job_url="https://tcs.com",
            risk_score=85,
            risk_category="Very High Risk Indicator",
            findings=findings,
            verification=verification,
            config=enabled_cfg,
            http_client=mock_bad_client,
        )
        self.assertFalse(status_bad_json.used)
        self.assertIn("JSONDecodeError", status_bad_json.fallback_reason or "")

        mock_good_client = MagicMock(spec=httpx.Client)
        mock_good_resp = MagicMock()
        mock_good_resp.status_code = 200
        mock_good_resp.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "plain_language_summary": "<b>Warning:</b> This message requests an upfront registration fee and uses a free email address.",
                                "key_questions_to_ask_recruiter": [
                                    "What is the official requisition ID on the career portal?"
                                ],
                                "independent_verification_tips": [
                                    "Visit the official career website directly."
                                ],
                                "caution_note": "<script>alert(1)</script>Scores are heuristic indicators only.",
                            }
                        )
                    }
                }
            ]
        }
        mock_good_client.post.return_value = mock_good_resp

        status_good = generate_optional_ai_explanation(
            use_ai_requested=True,
            redacted_text="Sample text",
            company_name="TCS",
            recruiter_email="a@gmail.com",
            job_url="https://tcs.com",
            risk_score=85,
            risk_category="Very High Risk Indicator",
            findings=findings,
            verification=verification,
            config=enabled_cfg,
            http_client=mock_good_client,
        )
        self.assertTrue(status_good.used)
        self.assertIsNotNone(status_good.explanation)
        self.assertNotIn("<script>", status_good.explanation.caution_note)
        self.assertNotIn("<b>", status_good.explanation.plain_language_summary)

    def test_11_api_endpoints_and_validation(self) -> None:
        health_resp = self.client.get("/health")
        self.assertEqual(health_resp.status_code, 200)
        health_data = health_resp.json()
        self.assertEqual(health_data["status"], "ok")
        self.assertEqual(health_data["deterministic_engine"], "ready")

        samples_resp = self.client.get("/api/samples")
        self.assertEqual(samples_resp.status_code, 200)
        self.assertGreaterEqual(len(samples_resp.json()), 3)

        invalid_resp = self.client.post("/api/analyze", json={"message_text": "short"})
        self.assertEqual(invalid_resp.status_code, 422)

        suspicious = SAMPLE_MESSAGES[0]
        analyze_resp = self.client.post(
            "/api/analyze",
            json={
                "message_text": suspicious.message_text,
                "company_name": suspicious.company_name,
                "recruiter_email": suspicious.recruiter_email,
                "job_url": suspicious.job_url,
                "use_ai": True,
                "save_report": True,
            },
        )
        self.assertEqual(analyze_resp.status_code, 200)
        body = analyze_resp.json()
        self.assertGreaterEqual(body["risk_score"], 70)
        self.assertEqual(body["risk_category"], "Very High Risk Indicator")
        self.assertTrue(body["persistence"]["requested"])
        self.assertFalse(body["persistence"]["saved"])
        self.assertIsNotNone(body["persistence"]["error"])

    def test_12_unauthorized_access_and_supabase_rls_forwarding(self) -> None:
        sb_cfg = SupabaseConfig()
        sb_cfg.url = "https://example.supabase.co"
        sb_cfg.anon_key = "public-anon-key"

        records, err, status = fetch_user_reports_from_supabase(
            access_token=None,
            config=sb_cfg,
        )
        self.assertIsNone(records)
        self.assertEqual(status, 401)

        save_res = save_analysis_report_to_supabase(
            access_token=None,
            redacted_input_text="Sample message text for test",
            company_name="Acme",
            recruiter_email="hr@acme.com",
            job_url="https://acme.com",
            risk_score=10,
            risk_level="Lower Risk Indicator",
            summary="Summary",
            findings=[],
            recommendations=[],
            analysis_mode="deterministic_only",
            config=sb_cfg,
        )
        self.assertFalse(save_res.saved)
        self.assertIn("Authentication token missing", save_res.error or "")

    def test_13_cloud_deployment_readiness_cors_and_head_health(self) -> None:
        # Root info endpoint
        root_resp = self.client.get("/")
        self.assertEqual(root_resp.status_code, 200)
        self.assertEqual(root_resp.json()["health_endpoint"], "/health")

        # HEAD /health for cloud load balancers / Render health probes
        head_resp = self.client.head("/health")
        self.assertEqual(head_resp.status_code, 200)

        # CORS origin normalization strips trailing slashes and blocks wildcard '*'
        with patch.dict(
            os.environ,
            {"CORS_ORIGINS": "https://jobguard-ai.vercel.app/, *, http://localhost:5173/"},
        ):
            origins = get_configured_cors_origins()
            self.assertEqual(origins, ["https://jobguard-ai.vercel.app", "http://localhost:5173"])
            self.assertNotIn("*", origins)


if __name__ == "__main__":
    unittest.main()
