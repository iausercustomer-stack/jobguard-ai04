import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="pt-8 pb-4 text-center"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Free Recruitment Safety Check for Students &amp; Job Seekers</span>
        </div>

        <h1
          id="hero-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Before you trust the offer,{' '}
          <span className="text-emerald-600">verify the opportunity.</span>
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed">
          Paste a recruitment message, offer email, or job link below to check
          for upfront fee demands, domain mismatches, and common scam signs.
        </p>
      </div>
    </section>
  );
};
