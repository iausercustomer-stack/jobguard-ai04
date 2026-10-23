import React from 'react';
import {
  ShieldCheck,
  SearchCheck,
  KeyRound,
  PhoneCall,
  ExternalLink,
  AlertCircle,
  Layers,
  CheckCircle,
} from 'lucide-react';

const INDICATOR_CATEGORIES = [
  {
    code: 'JG-FEE-001',
    title: 'Upfront Registration, Security, or Laptop Fees',
    weight: '45 pts (Critical)',
    desc: 'Detects demands for refundable deposits, gate passes, document verification charges, training kits, or laptop dispatch fees.',
  },
  {
    code: 'JG-SENS-005',
    title: 'OTP, UPI PIN, Password, or Screen-Share Requests',
    weight: '45 pts (Critical)',
    desc: 'Flags requests for OTPs, UPI PINs, QR code scan-to-pay traps, CVVs, netbanking logins, or AnyDesk/TeamViewer remote access.',
  },
  {
    code: 'JG-TASK-010',
    title: 'Prepaid Task & Commission-Unlock Schemes',
    weight: '35 pts (High)',
    desc: 'Identifies YouTube like/subscribe, Google Maps review, or Telegram VIP task recharge traps.',
  },
  {
    code: 'JG-GUAR-002',
    title: '100% Guaranteed Selection / No-Interview Claims',
    weight: '25 pts (High)',
    desc: 'Flags promises of direct joining or instant appointment letters without interviews or technical assessments.',
  },
  {
    code: 'JG-COMP-004',
    title: 'Unrealistic Low-Effort Compensation Promises',
    weight: '25 pts (High)',
    desc: 'Detects exaggerated daily payouts (e.g. ₹5,000/day working 1–2 hours from mobile with no experience).',
  },
  {
    code: 'JG-DOM-007',
    title: 'Email-Domain Mismatch & Brand Impersonation',
    weight: '25 pts (High)',
    desc: 'Compares recruiter email domain with the supplied job URL and our registry of major Indian/global employers.',
  },
  {
    code: 'JG-LINK-006',
    title: 'Shortened URLs, Telegram Links & Domain Anomalies',
    weight: '20 pts (Medium)',
    desc: 'Flags bit.ly/tinyurl links, WhatsApp/Telegram-only invite funnels, non-HTTPS URLs, and deceptive hyphenated domains.',
  },
  {
    code: 'JG-URG-003',
    title: 'Artificial Urgency & High-Pressure Countdowns',
    weight: '18 pts (Medium)',
    desc: 'Detects pressure to pay or submit documents within minutes/hours ("only 2 seats left today").',
  },
  {
    code: 'JG-FREE-008',
    title: 'Free Personal Webmail Usage (@gmail, @yahoo, etc.)',
    weight: '12 pts (Low)',
    desc: 'Low-severity caution signal. Never treated as proof of fraud on its own, since small local businesses may use webmail.',
  },
  {
    code: 'JG-UNV-009',
    title: 'Missing Verifiable Employer Metadata',
    weight: '10 pts (Low)',
    desc: 'Marks offers lacking a company name, recruiter email, or official job URL as "unverified" rather than fraudulent.',
  },
];

export const EducationalSections: React.FC = () => {
  return (
    <div className="space-y-12 pt-6">
      {/* Section: How It Works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span>Architecture &amp; Pipeline</span>
        </div>
        <h2 id="how-heading" className="mt-1 text-2xl font-bold text-white">
          How JobGuard AI Evaluates a Vacancy
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          JobGuard AI combines a deterministic, zero-dependency rule engine with
          safe URL/domain inspection so core verification always works—even
          without external AI quotas.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4">
            <span className="font-mono text-xs font-bold text-emerald-400">
              STEP 01
            </span>
            <h3 className="mt-1 text-sm font-bold text-white">
              Sensitive ID Auto-Redaction
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Before any optional AI call or database storage, Aadhaar-like
              12-digit numbers, PAN numbers, bank accounts, and explicit PIN/OTP
              values are masked.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4">
            <span className="font-mono text-xs font-bold text-emerald-400">
              STEP 02
            </span>
            <h3 className="mt-1 text-sm font-bold text-white">
              10-Category Heuristic Engine
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Scans for upfront fees, guaranteed jobs, urgency, OTP harvesting,
              and task scams while ignoring benign anti-fraud disclaimers on
              legitimate posts.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4">
            <span className="font-mono text-xs font-bold text-emerald-400">
              STEP 03
            </span>
            <h3 className="mt-1 text-sm font-bold text-white">
              Safe URL &amp; Domain Alignment
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Parses HTTP/HTTPS URLs with strict SSRF protection, checks for
              shorteners, compares email vs. website root domains, and recognizes
              known ATS portals.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4">
            <span className="font-mono text-xs font-bold text-emerald-400">
              STEP 04
            </span>
            <h3 className="mt-1 text-sm font-bold text-white">
              Actionable Verification Guide
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Produces a capped 0–100 heuristic score, exact evidence snippets,
              optional schema-validated AI explanation, and independent checks.
            </p>
          </div>
        </div>
      </section>

      {/* Section: What Indicators It Checks */}
      <section
        id="indicators"
        aria-labelledby="indicators-heading"
        className="rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <SearchCheck className="h-4 w-4" aria-hidden="true" />
          <span>Deterministic Rule Matrix</span>
        </div>
        <h2
          id="indicators-heading"
          className="mt-1 text-2xl font-bold text-white"
        >
          10 Scam &amp; Risk Indicators Checked
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Each indicator category is triggered at most once per submission so
          repeated words cannot artificially inflate the score, and the total is
          capped at 100.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {INDICATOR_CATEGORIES.map((item) => (
            <div
              key={item.code}
              className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {item.code}
                </span>
                <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {item.weight}
                </span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Safety Tips & Official India Cybercrime Reporting */}
      <section
        id="india-reporting"
        aria-labelledby="reporting-heading"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        <div className="lg:col-span-6 rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>Applicant Safety Playbook</span>
          </div>
          <h2 id="reporting-heading" className="mt-1 text-xl font-bold text-white">
            Golden Rules for Job Seekers &amp; Freshers
          </h2>
          <ul className="mt-4 space-y-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>
                <strong>Zero Fee Rule:</strong> Genuine employers (IT services,
                PSUs, banks, startups) never ask candidates for registration,
                security deposit, medical, or laptop dispatch fees.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>
                <strong>UPI PIN = Money Out:</strong> Entering your UPI PIN or
                scanning a QR code always deducts money from your account—it is
                never needed to receive a stipend or salary.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>
                <strong>Verify Offer Letters on the Career Portal:</strong> Log
                in directly to the company&apos;s official career website (e.g.,
                TCS NextStep, Infosys Careers) to verify any offer letter.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>
                <strong>Protect Identity Documents:</strong> Redact Aadhaar/PAN
                numbers until you have verified the employer&apos;s CIN on MCA21
                and completed formal interviews.
              </span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-emerald-700/50 bg-[#0c1d17] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            <span>Official Indian Government Resources</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">
            Report Cyber Fraud &amp; Verify Employers in India
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            If you have lost money to a recruitment scam or received a fraudulent
            offer impersonating a company or government body, act immediately:
          </p>

          <div className="mt-4 space-y-3 text-xs sm:text-sm">
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5">
              <div className="flex items-center justify-between font-bold text-amber-200">
                <span>National Cyber Crime Helpline (India)</span>
                <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950">
                  Dial 1930
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Call <strong>1930</strong> immediately if financial fraud via
                UPI, netbanking, or card has occurred, or file a complaint at{' '}
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-300 underline"
                >
                  cybercrime.gov.in
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                .
              </p>
            </div>

            <div className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-3.5">
              <div className="font-bold text-white">
                Ministry of Corporate Affairs (MCA21 Master Data)
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Check whether a Private Limited or LLP company is officially
                registered in India via{' '}
                <a
                  href="https://www.mca.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-300 underline"
                >
                  mca.gov.in
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                .
              </p>
            </div>

            <div className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-3.5">
              <div className="font-bold text-white">
                National Career Service (Ministry of Labour &amp; Employment)
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Explore government-verified job listings and career advisories at{' '}
                <a
                  href="https://www.ncs.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-300 underline"
                >
                  ncs.gov.in
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
