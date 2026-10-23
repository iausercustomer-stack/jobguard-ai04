import React from 'react';
import { ShieldAlert, CheckCircle2, FileSearch, ArrowDownRight } from 'lucide-react';

interface HeroProps {
  onLoadSample: (sampleId: string) => void;
  onJumpToForm: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onLoadSample, onJumpToForm }) => {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-emerald-950/80 py-10 sm:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1 text-xs font-medium text-emerald-300 mb-4">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Recruitment Safety &amp; Heuristic Scam Verification Platform</span>
            </div>

            <h1
              id="hero-heading"
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight"
            >
              Before you trust the offer,{' '}
              <span className="text-emerald-400">verify the opportunity.</span>
            </h1>

            <p className="mt-4 max-w-3xl text-base sm:text-lg text-slate-300 leading-relaxed">
              JobGuard AI helps students, fresh graduates, and job seekers evaluate
              suspicious WhatsApp/Telegram messages, offer emails, and job links. Get a
              transparent <strong>0–100 heuristic risk-indicator score</strong>,
              extracted text evidence, safe domain-alignment checks, and step-by-step
              independent verification guidance without exposing your sensitive data.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onJumpToForm}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-950/50 transition hover:bg-emerald-400"
              >
                <FileSearch className="h-4 w-4" aria-hidden="true" />
                <span>Evaluate a Job Message</span>
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('suspicious-fee-scam')}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-950/50 hover:border-amber-400"
              >
                <span>Load Suspicious Sample</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('legitimate-campus-role')}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-[#0c1d17] px-4 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-950/60 hover:border-emerald-500"
              >
                <span>Load Legitimate Sample</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-emerald-800/50 bg-[#0c1d17]/90 p-5 shadow-xl">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Core Safety Principles
              </h2>
              <ul className="mt-3.5 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Deterministic First:</strong> 10-category rule engine works
                    reliably with zero paid AI dependencies.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Zero SSRF / Safe URL Inspection:</strong> Parses and compares
                    domains without executing untrusted links.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Balanced &amp; Honest:</strong> Treats missing metadata or free
                    webmail cautiously rather than claiming certainty.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
