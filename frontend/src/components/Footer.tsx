import React from 'react';
import { ShieldCheck, PhoneCall } from 'lucide-react';
import { MainViewTab } from './Navbar';

interface FooterProps {
  onSelectTab?: (tab: MainViewTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-4 w-4 text-emerald-600"
            aria-hidden="true"
          />
          <span>
            <strong className="text-slate-800">JobGuard AI</strong> · SRIMT
            Parakram Hackathon 2026 (AI-04)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('guide')}
              className="text-slate-600 hover:text-emerald-700 font-medium"
            >
              Safety Guide &amp; Rules
            </button>
          )}
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-amber-700 hover:underline"
          >
            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cyber Crime Helpline: 1930</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
