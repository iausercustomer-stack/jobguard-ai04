import React from 'react';
import { Zap, Globe, Fingerprint } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative pt-8 pb-4 text-center"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 dark:border-emerald-500/30 bg-white/90 dark:bg-emerald-950/70 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Recruitment Safety Companion · SRIMT Parakram AI-04</span>
        </div>

        <h1
          id="hero-heading"
          className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
        >
          Before you trust the offer,{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            verify the opportunity.
          </span>
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Paste a job message, recruiter email, or link below to check for
          upfront fee traps, domain mismatches, and common scam signs in
          seconds.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white dark:border-slate-800 bg-white/75 dark:bg-slate-900/70 px-3 py-1 font-medium text-slate-600 dark:text-slate-300 shadow-2xs backdrop-blur-xs">
            <Zap className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span>10 Scam Indicators Checked</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white dark:border-slate-800 bg-white/75 dark:bg-slate-900/70 px-3 py-1 font-medium text-slate-600 dark:text-slate-300 shadow-2xs backdrop-blur-xs">
            <Globe className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            <span>Safe Domain &amp; Brand Match</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white dark:border-slate-800 bg-white/75 dark:bg-slate-900/70 px-3 py-1 font-medium text-slate-600 dark:text-slate-300 shadow-2xs backdrop-blur-xs">
            <Fingerprint className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span>Aadhaar, PAN &amp; OTPs Auto-Masked</span>
          </div>
        </div>
      </div>
    </section>
  );
};
