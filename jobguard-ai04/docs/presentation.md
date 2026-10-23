# JobGuard AI — Hackathon Presentation & 90-Second Demo Script

**SRIMT Parakram Hackathon 2026 | Problem Statement AI-04: Local Job Scam and Vacancy Verifier**

## Part 1: Six-Slide Presentation Outline

### Slide 1 — The Problem & Intended Users
- **Headline:** Recruitment Fraud Targeting Students & Fresh Graduates in India
- **Problem Context:** Every placement season, thousands of engineering students, diploma holders, and freshers receive WhatsApp, Telegram, and email offers impersonating major recruiters (TCS, Infosys, Wipro, PSUs) or offering fake "work-from-home tasks."
- **How Victims Are Trapped:** Scammers demand "refundable" registration/laptop deposits (₹1,500–₹10,000), harvest UPI PINs/OTPs under the guise of salary verification, or use high-pressure countdowns.
- **Intended Users:** College students, campus placement cells, fresh graduates, and first-time job seekers across India.

### Slide 2 — Our Proposed Solution: JobGuard AI
- **Tagline:** *“Before you trust the offer, verify the opportunity.”*
- **What JobGuard AI Delivers:**
  - Transparent **0–100 heuristic risk-indicator score** (capped at 100, zero double-counting).
  - Extracted text evidence snippets and plain-language explanations for 10 scam categories.
  - Safe, zero-fetch URL inspection, email-vs-website domain comparison, and official brand impersonation alerts.
  - Epistemic honesty: Treats free webmail or missing details as "unverified" rather than claiming certainty, and never certifies a copied job post as 100% genuine.

### Slide 3 — Full-Stack Security-First Architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide icons (deployable on Vercel).
- **Backend:** Python 3.11 + FastAPI + Pydantic + HTTPX (deployable on Render).
- **Core Engine:** Deterministic 10-rule scam analyzer + anti-scam disclaimer filter + SSRF-safe URL & domain verifier (works 100% without paid AI keys).
- **Privacy & Optional Layers:**
  - Automatic pre-processing redaction of Aadhaar, PAN, bank account numbers, and explicit OTP/PIN values.
  - Optional backend-only OpenAI-compatible AI explainer with `<untrusted_recruitment_submission>` prompt isolation and strict schema fallback.
  - Optional private report history in Supabase PostgreSQL protected by Row Level Security (`auth.uid() = user_id`).

### Slide 4 — Live Comparison: Suspicious Scam vs. Legitimate Vacancy
- **Case A — Suspicious Offer (TCS Impersonation + ₹2,499 Fee + `bit.ly` Link + `@gmail.com`):**
  - Score: **100 / 100 (`Very High Risk Indicator`)**
  - Flags: `JG-FEE-001` (Upfront Fee), `JG-SENS-005` (OTP request), `JG-GUAR-002` (No-interview guarantee), `JG-DOM-007` (TCS brand impersonation), `JG-LINK-006` (`bit.ly` + Telegram link), `JG-URG-003` (30-min deadline), `JG-FREE-008` (`@gmail.com`).
- **Case B — Legitimate Vacancy (Infosys Campus Role + `@infosys.com` + Anti-Fee Notice):**
  - Score: **0 / 100 (`Lower Risk Indicator`)**
  - Verification Status: `VERIFIED OFFICIAL DOMAIN` (`infosys.com`)
  - Smart Negation Guard: Recognizes *"Infosys does not charge any fee"* as an anti-fraud notice rather than a false positive.

### Slide 5 — Social Impact & Alignment with Indian Cyber Safety
- **Immediate Protection at the Moment of Doubt:** Gives students an instant, objective second opinion before they transfer money via UPI or upload identity documents.
- **Actionable India-Specific Guidance:** Integrates direct verification workflows for **MCA21 Master Data (`mca.gov.in`)**, **National Career Service (`ncs.gov.in`)**, and immediate reporting via the **National Cyber Crime Helpline (`1930` / `cybercrime.gov.in`)**.
- **Campus Placement Cell Ready:** Can be self-hosted by colleges at zero AI cost using the deterministic engine.

### Slide 6 — Current Limitations & Phase-2 Roadmap
- **Transparent Current Limitations:**
  - Heuristic scores are initial engineering weights, not statistically calibrated probabilities.
  - Scammers can copy real job descriptions verbatim; domain alignment alone cannot prove email header authenticity (SPF/DKIM must still be checked).
  - Arbitrary URLs are not crawled live in the MVP to eliminate SSRF and drive-by malware risks.
- **Next Improvements (Roadmap):**
  1. Phase-2 OCR pipeline for WhatsApp/Telegram offer letter screenshots and PDF attachments.
  2. Raw `.eml` header parser to verify SPF, DKIM, and DMARC cryptographic signatures.
  3. Live MCA21 CIN lookup & WHOIS domain-age integration (flagging domains registered < 30 days ago).

---

## Part 2: Concise 90-Second Live Demo Script

- **0:00 – 0:15 (Hook & Problem):**
  *"Hello judges! Every placement season, students receive convincing messages offering direct joining at companies like TCS or Infosys—if they just pay a 'refundable' ₹2,499 laptop or registration deposit within 30 minutes. We built **JobGuard AI** for Problem Statement AI-04: Before you trust the offer, verify the opportunity."*

- **0:15 – 0:45 (Live Demo 1 — Suspicious Offer Analysis):**
  *"Let's click **Sample Suspicious** on our analyzer. This message claims to be from TCS, uses a Gmail address and a `bit.ly` link, promises ₹65,000/month with no interview, and asks for a ₹2,499 deposit and OTP. When we click **Analyze Vacancy Risk**, our FastAPI deterministic engine immediately returns a **100/100 Very High Risk Indicator**. Notice how every finding shows its stable code (`JG-FEE-001`, `JG-DOM-007`), exact extracted evidence snippet, and an **Impersonation Alert** because `@gmail.com` and `bit.ly` do not match `tcs.com`."*

- **0:45 – 1:10 (Live Demo 2 — Legitimate Vacancy & False-Positive Guard):**
  *"Now let's test false positives by clicking **Sample Legitimate**—an Infosys campus drive notice from `campus.recruitment@infosys.com` that includes the sentence 'Infosys does not charge any fee.' A naive keyword scanner would flag the word 'fee.' JobGuard AI's negation guard recognizes the anti-scam disclaimer, verifies that the email and URL match `infosys.com`, and scores it **0/100 Lower Risk Indicator**—while still reminding the student that a low score is not a certificate of authenticity."*

- **1:10 – 1:30 (Security, Privacy & Wrap-Up):**
  *"Under the hood, JobGuard AI automatically redacts Aadhaar, PAN, and bank numbers before any optional AI call or Supabase RLS storage, blocks SSRF against internal/cloud metadata IPs, and provides one-click guidance for MCA21 verification and the 1930 National Cyber Crime Helpline. Thank you—we're ready for your questions!"*
