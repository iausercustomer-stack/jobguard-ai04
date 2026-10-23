import React from 'react';
import {
  SearchCheck,
  KeyRound,
  PhoneCall,
  ExternalLink,
  Layers,
  CheckCircle,
} from 'lucide-react';

const INDICATOR_CATEGORIES = [
  {
    code: 'JG-FEE-001',
    title: 'Upfront Registration, Security, or Laptop Fees',
    weight: '+45 pts',
  },
  {
    code: 'JG-SENS-005',
    title: 'OTP, UPI PIN, Password, or Screen-Share Requests',
    weight: '+45 pts',
  },
  {
    code: 'JG-TASK-010',
    title: 'Prepaid Task & Commission-Unlock Schemes',
    weight: '+35 pts',
  },
  {
    code: 'JG-GUAR-002',
    title: '100% Guaranteed Selection / No-Interview Claims',
    weight: '+25 pts',
  },
  {
    code: 'JG-COMP-004',
    title: 'Unrealistic Low-Effort Compensation Promises',
    weight: '+25 pts',
  },
  {
    code: 'JG-DOM-007',
    title: 'Email-Domain Mismatch & Brand Impersonation',
    weight: '+25 pts',
  },
  {
    code: 'JG-LINK-006',
    title: 'Shortened URLs, Telegram Links & Domain Anomalies',
    weight: '+20 pts',
  },
  {
    code: 'JG-URG-003',
    title: 'Artificial Urgency & High-Pressure Countdowns',
    weight: '+18 pts',
  },
  {
    code: 'JG-FREE-008',
    title: 'Free Personal Webmail Usage (Low-Severity Caution)',
    weight: '+12 pts',
  },
  {
    code: 'JG-UNV-009',
    title: 'Missing Verifiable Employer Metadata (Unverified)',
    weight: '+10 pts',
  },
];

export const EducationalSections: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Safety Tips & Official India Cybercrime Reporting */}
      <section
        id="india-reporting"
        aria-labelledby="reporting-heading"
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>Quick Safety Rules</span>
          </div>
          <h2
            id="reporting-heading"
            className="mt-1 text-lg font-bold text-slate-900"
          >
            4 Golden Rules for Job Seekers
          </h2>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                <strong className="text-slate-900">Never pay to get hired:</strong>{' '}
                Genuine companies never charge registration, training, or laptop
                security deposits.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                <strong className="text-slate-900">UPI PIN = Money Out:</strong>{' '}
                Entering a UPI PIN or OTP is never required to receive a stipend
                or salary.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                <strong className="text-slate-900">Check the official website:</strong>{' '}
                Type the company&apos;s career portal address directly into a new
                browser tab.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                <strong className="text-slate-900">Guard your Aadhaar &amp; PAN:</strong>{' '}
                Do not send identity scans over WhatsApp or Telegram before
                verifying the company.
              </span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            <span>Official Indian Helplines &amp; Portals</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Report Cyber Fraud &amp; Verify Companies
          </h2>
          <div className="mt-4 space-y-3 text-xs sm:text-sm">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>National Cyber Crime Helpline</span>
                <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                  Call 1930
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900/80">
                Dial <strong>1930</strong> immediately if financial fraud has
                occurred, or report online at{' '}
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
                >
                  cybercrime.gov.in
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <a
                href="https://www.mca.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 p-3 hover:border-emerald-500 transition"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>MCA21 Master Data</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Check Indian company registration on mca.gov.in
                </p>
              </a>

              <a
                href="https://www.ncs.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 p-3 hover:border-emerald-500 transition"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>National Career Service</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Government job portal at ncs.gov.in
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span>How It Works</span>
        </div>
        <h2 id="how-heading" className="mt-1 text-lg font-bold text-slate-900">
          4-Step Safe Verification Pipeline
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <span className="font-bold text-emerald-700">1. Auto-Redact</span>
            <p className="mt-1 text-slate-600">
              Masks Aadhaar, PAN, bank account numbers, and OTPs before analysis.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <span className="font-bold text-emerald-700">2. 10-Rule Scan</span>
            <p className="mt-1 text-slate-600">
              Checks for upfront fees, urgency, and fake guarantees while
              ignoring benign disclaimers.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <span className="font-bold text-emerald-700">3. Domain Check</span>
            <p className="mt-1 text-slate-600">
              Compares recruiter email domains with job links without visiting
              unsafe URLs.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <span className="font-bold text-emerald-700">4. Action Plan</span>
            <p className="mt-1 text-slate-600">
              Provides a 0–100 heuristic score and step-by-step verification
              guidance.
            </p>
          </div>
        </div>
      </section>

      {/* 10 Indicators List */}
      <section
        id="indicators"
        aria-labelledby="indicators-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <SearchCheck className="h-4 w-4" aria-hidden="true" />
          <span>Rule Matrix</span>
        </div>
        <h2
          id="indicators-heading"
          className="mt-1 text-lg font-bold text-slate-900"
        >
          10 Indicators Checked (Capped at 100 Points)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          {INDICATOR_CATEGORIES.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5"
            >
              <span className="font-medium text-slate-800">{item.title}</span>
              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                {item.weight}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
