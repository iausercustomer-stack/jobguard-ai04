import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-emerald-950/90 bg-[#050d0a] py-8 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <span className="font-bold text-slate-200">JobGuard AI</span> —
              Local Job Scam and Vacancy Verifier
            </div>
          </div>
          <div className="text-slate-400">
            Built for{' '}
            <strong className="text-emerald-300">
              SRIMT Parakram Hackathon 2026 | Problem Statement AI-04
            </strong>
          </div>
        </div>

        <p className="mt-4 border-t border-emerald-950/70 pt-4 text-[11px] text-slate-500 leading-relaxed">
          Disclaimer: JobGuard AI provides heuristic risk indicators (0–100) to
          assist students and job seekers in identifying common recruitment scam
          patterns. Scores are not statistically validated probabilities, legal
          advice, or definitive proof of fraud or legitimacy. Always verify job
          offers directly on the employer&apos;s official career portal.
        </p>
      </div>
    </footer>
  );
};
