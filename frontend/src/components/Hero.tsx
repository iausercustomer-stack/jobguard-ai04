import React from 'react';
import { Zap, Globe, Fingerprint, Camera } from 'lucide-react';

interface HeroProps {
  onOpenScreenshotModal?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenScreenshotModal }) => {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative pt-7 pb-3 text-center"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border jg-border jg-surface px-3.5 py-1 text-xs font-semibold text-emerald-500 shadow-2xs mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Recruitment Safety Companion · SRIMT Parakram AI-04</span>
        </div>

        <h1
          id="hero-heading"
          className="text-2xl font-extrabold tracking-tight jg-text sm:text-4xl"
        >
          Before you trust the offer,{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            verify the opportunity.
          </span>
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl text-xs sm:text-sm jg-text-muted leading-relaxed">
          Paste a recruitment message, offer email, or job link—or extract text
          from a screenshot—to check for upfront fee traps, domain mismatches,
          and common scam indicators.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-full border jg-border jg-surface px-3 py-1 font-medium jg-text-muted">
            <Zap className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span>10 Scam Indicators Checked</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border jg-border jg-surface px-3 py-1 font-medium jg-text-muted">
            <Globe className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            <span>Safe Domain &amp; Brand Match</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border jg-border jg-surface px-3 py-1 font-medium jg-text-muted">
            <Fingerprint className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span>Aadhaar, PAN &amp; OTPs Auto-Masked</span>
          </div>
          {onOpenScreenshotModal && (
            <button
              type="button"
              onClick={onOpenScreenshotModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-500 transition hover:bg-emerald-500/20"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Scan Offer Screenshot (OCR)</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
