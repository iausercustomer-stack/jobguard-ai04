# JobGuard AI — Architecture Overview

## 1. System Design Philosophy

JobGuard AI is designed around three core engineering principles for the **SRIMT Parakram Hackathon 2026 (Problem Statement AI-04)**:

1. **Deterministic Core First:** The 10-category heuristic scam analyzer and safe URL/domain verifier run deterministically in Python with zero dependency on external paid AI services.
2. **Defense-in-Depth Security:** Sensitive personal identifiers are automatically redacted before any optional external AI call or database storage; user-supplied URLs are never blindly fetched (preventing SSRF); and all AI API keys remain strictly server-side.
3. **Epistemic Humility:** The platform never labels an employer "100% fraudulent" solely because of a high score, nor certifies a vacancy as "genuine" because few indicators were triggered. Missing metadata or free webmail usage is treated cautiously as "unverified" or low-severity.

## 2. High-Level Request Lifecycle

1. **Client Input (`frontend/src/components/AnalysisForm.tsx`)**
   - Validates message length (`10` to `12,000` characters) and optional email syntax on the client.
   - Sends a typed `POST /api/analyze` request via `frontend/src/lib/api.ts`, forwarding `Authorization: Bearer <token>` only when the user is signed in and checks **"Save to Private Report History"**.

2. **API Gateway & Rate Limiting (`backend/app/main.py`, `backend/app/security.py`)**
   - Enforces CORS origin restrictions (`CORS_ORIGINS`), Pydantic schema validation (`AnalyzeRequest`), and per-IP sliding-window rate limiting (`SlidingWindowRateLimiter`).

3. **Sensitive-Data Redaction (`backend/app/security.py`)**
   - `redact_sensitive_text()` masks Aadhaar-like 12-digit numbers (`[REDACTED-ID-12]`), PAN numbers (`[REDACTED-PAN]`), 13–19 digit account/card numbers (`[REDACTED-ACCOUNT-NUM]`), and explicit OTP/PIN values (`[REDACTED-SECRET]`).

4. **Safe URL, Domain & Official Registry Verification (`backend/app/verification.py`)**
   - Parses only `http://` and `https://` URLs; rejects `javascript:`, `data:`, `ftp:`, embedded `@` userinfo, and private/loopback/link-local/metadata IPs (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
   - Extracts registrable root domains with awareness of multi-part country suffixes (`.co.in`, `.gov.in`, `.ac.in`, `.org.in`).
   - Compares recruiter email domain against job URL domain, accounting for subdomains and legitimate third-party ATS portals (`myworkdayjobs.com`, `greenhouse.io`, `lever.co`, `naukri.com`, `internshala.com`, `darwinbox.in`).
   - Checks stated company names against `OFFICIAL_EMPLOYER_REGISTRY` to detect brand impersonation vs. official domain alignment.

5. **Deterministic 10-Category Scam Engine (`backend/app/analyzer.py`)**
   - Strips benign anti-scam disclaimer sentences (e.g., *"We never charge any fee at any stage of recruitment"*) before evaluating fee/credential rules to avoid false positives on genuine job posts.
   - Evaluates 10 categories (`JG-FEE-001` through `JG-TASK-010`), deduplicating matches by rule code so repeated phrases never inflate the score, and caps the final score at `100`.

6. **Optional Backend-Only AI Explanation Layer (`backend/app/ai_explainer.py`)**
   - When `use_ai=true` and `AI_ENABLED=true`, sends only the redacted submission wrapped inside `<untrusted_recruitment_submission>` tags plus the deterministic findings digest to the configured OpenAI-compatible `/chat/completions` endpoint.
   - Validates the JSON response against `AIExplanationPayload`, strips any HTML tags, and falls back to deterministic output on any error or timeout.

7. **Supabase PostgreSQL RLS Persistence (`backend/app/supabase_client.py`, `supabase/schema.sql`)**
   - Verifies the user's JWT with Supabase Auth (`/auth/v1/user`) and inserts into `public.analyses` forwarding the user's JWT so PostgreSQL Row Level Security (`auth.uid() = user_id`) is enforced at the database layer.
