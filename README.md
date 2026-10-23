# JobGuard AI — Local Job Scam and Vacancy Verifier

**SRIMT Parakram Hackathon 2026 | Problem Statement AI-04**

> *“Before you trust the offer, verify the opportunity.”*

JobGuard AI is a full-stack recruitment-safety platform built for students, fresh graduates, and job seekers in India to evaluate suspicious recruitment messages, offer letters, recruiter emails, and job URLs. It combines a deterministic 10-category scam indicator engine, safe zero-fetch URL and domain-alignment verification, automatic sensitive-ID redaction, an optional backend-only OpenAI-compatible AI explanation layer, and optional private report history backed by Supabase PostgreSQL Row Level Security (RLS).

## Key Features Implemented

1. **Deterministic 10-Category Scam Analysis Engine (`backend/app/analyzer.py`)**
   - Works 100% offline/without any paid AI credentials.
   - Detects:
     1. Upfront registration, security deposit, training, laptop, or document verification fees (`JG-FEE-001`, +45 pts)
     2. Guaranteed selection or no-interview direct joining claims (`JG-GUAR-002`, +25 pts)
     3. Artificial urgency and countdown pressure (`JG-URG-003`, +18 pts)
     4. Unrealistic low-effort earning promises (`JG-COMP-004`, +25 pts)
     5. Requests for OTPs, UPI PINs, banking passwords, CVVs, or AnyDesk/TeamViewer screen-share (`JG-SENS-005`, +45 pts)
     6. Shortened links (`bit.ly`, `tinyurl.com`, etc.), Telegram/WhatsApp-only funnels, and anomalous URLs (`JG-LINK-006`, +20 pts)
     7. Recruiter email-domain mismatch against the job website or official brand impersonation (`JG-DOM-007`, +25 pts)
     8. Free personal webmail usage (`@gmail.com`, `@yahoo.com`, `@outlook.com`, `@rediffmail.com`) as a low-severity caution signal (`JG-FREE-008`, +12 pts)—never treated as proof of fraud on its own
     9. Missing verifiable employer metadata represented as “unverified” (`JG-UNV-009`, +10 pts)
     10. Prepaid task / YouTube-like / commission-unlock scam patterns (`JG-TASK-010`, +35 pts)
   - **False-Positive Protection:** Filters out benign anti-fraud disclaimers on legitimate job postings (e.g., *"Infosys does not charge any fee at any stage of recruitment"*).
   - **Deduplication & Score Cap:** Each category is counted at most once (merging up to two evidence snippets), and the final heuristic score is capped at `100`.

2. **Safe URL, Domain & Official Employer Verification (`backend/app/verification.py`)**
   - Accepts only valid `http://` and `https://` URLs; rejects `javascript:`, `data:`, `ftp:`, and malformed URLs without crashing.
   - Enforces SSRF protections rejecting loopback (`127.0.0.1`, `localhost`), private RFC1918 networks, link-local / cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`), and IP-literal URLs.
   - Compares recruiter email domain with the supplied job URL root domain (handling multi-label Indian TLDs like `.co.in`, `.gov.in`, `.ac.in`), and accounts for legitimate third-party ATS platforms (`myworkdayjobs.com`, `greenhouse.io`, `lever.co`, `naukri.com`, `internshala.com`, `darwinbox.in`, etc.).
   - Cross-checks stated employer names against a local reference registry of major Indian and global employers (TCS, Infosys, Wipro, HCLTech, Tech Mahindra, Accenture, Cognizant, Capgemini, Amazon, Google, Microsoft, Flipkart, Zoho, Razorpay, SBI, ISRO, Deloitte) to flag brand impersonation.

3. **Sensitive Data Redaction & Optional Backend-Only AI Layer (`backend/app/security.py`, `backend/app/ai_explainer.py`)**
   - Automatically masks 12-digit Aadhaar-like numbers, PAN numbers, 13–19 digit account/card numbers, and explicit OTP/PIN values before any optional AI call or database storage.
   - Wraps submitted job text inside `<untrusted_recruitment_submission>` delimiters to defend against prompt injection.
   - Validates AI JSON responses against `AIExplanationPayload` and strips raw HTML tags.
   - Gracefully falls back to deterministic results if `AI_ENABLED=false`, API key is missing, rate limits occur, or output fails schema validation.

4. **Supabase Authentication & Row Level Security (`supabase/schema.sql`, `backend/app/supabase_client.py`)**
   - Version-controlled SQL schema with `public.analyses` table, check constraints, indexes, and strict RLS policies (`auth.uid() = user_id` for `SELECT`, `INSERT`, `DELETE`; anonymous access revoked).
   - Backend verifies the user's Supabase JWT via `/auth/v1/user` and forwards the user's `Bearer` token to PostgREST—never exposing or requiring a `service_role` key.

## Project Structure

```text
jobguard-ai04/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── AnalysisForm.tsx
│   │   │   ├── AnalysisResultView.tsx
│   │   │   ├── AuthModal.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── EducationalSections.tsx
│   │   │   └── Footer.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── samples.ts
│   │   │   └── supabase.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── analyzer.py
│   │   ├── verification.py
│   │   ├── ai_explainer.py
│   │   ├── supabase_client.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── tests/
│   │   └── test_jobguard.py
│   ├── requirements.txt
│   └── .env.example
├── supabase/
│   └── schema.sql
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   ├── testing.md
│   └── presentation.md
├── .gitignore
└── README.md
```

## Exact Windows PowerShell Commands to Run Locally

### 1. Start the FastAPI Backend (Terminal 1 — Windows PowerShell)

```powershell
cd jobguard-ai04\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify the health endpoint in PowerShell:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

### 2. Run Backend Automated Tests (Windows PowerShell)

```powershell
cd jobguard-ai04\backend
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
python -m unittest discover -s tests -v
# Or with pytest:
pytest -v
```

### 3. Start the React + Vite Frontend (Terminal 2 — Windows PowerShell)

```powershell
cd jobguard-ai04\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. To verify the production build:

```powershell
npm run build
npm run preview
```

## Environment Variables Reference

| Layer | Variable | Required | Default / Placeholder | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| Frontend | `VITE_API_BASE_URL` | Yes | `http://127.0.0.1:8000` | FastAPI backend base URL |
| Frontend | `VITE_SUPABASE_URL` | Optional | `https://your-project-ref.supabase.co` | Supabase project URL for Auth |
| Frontend | `VITE_SUPABASE_ANON_KEY` | Optional | `your-supabase-anon-public-key-placeholder` | Public anon key (RLS enforced) |
| Backend | `CORS_ORIGINS` | Yes | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| Backend | `MAX_INPUT_CHARS` | Optional | `12000` | Maximum message character limit |
| Backend | `SUPABASE_URL` | Optional | `https://your-project-ref.supabase.co` | Supabase URL for Auth & PostgREST |
| Backend | `SUPABASE_ANON_KEY` | Optional | `your-supabase-anon-public-key-placeholder` | Supabase public anon key |
| Backend | `AI_ENABLED` | Optional | `false` | Enables optional AI explanation layer |
| Backend | `AI_BASE_URL` | Optional | `https://api.openai.com/v1` | OpenAI-compatible base URL |
| Backend | `AI_API_KEY` | Optional | `your-server-side-ai-api-key-placeholder` | Server-side AI API key (never on client) |
| Backend | `AI_MODEL` | Optional | `gpt-4o-mini` | Model identifier |
| Backend | `AI_TIMEOUT_SECONDS` | Optional | `12.0` | Timeout before deterministic fallback |

## Security, Privacy & Heuristic Limitations

- **Heuristic Indicator, Not Proof:** The 0–100 score reflects initial engineering weights across 10 pattern categories. A high score does not legally prove fraud, and a low score does not certify a job is genuine (scammers can copy real job descriptions).
- **Zero Arbitrary URL Crawling:** To prevent SSRF and malware exposure, the MVP inspects URL syntax, hostnames, and domain alignment without executing or fetching arbitrary user-supplied URLs.
- **Screenshot OCR:** Marked transparently in the UI as a Phase-2 roadmap feature; users paste text directly in the MVP.
