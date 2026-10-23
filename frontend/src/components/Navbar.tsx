import React from 'react';
import { ShieldCheck, Lock, LogIn, LogOut, User, History } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  activeTab: 'analyze' | 'history';
  onSelectTab: (tab: 'analyze' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuthModal,
  onSignOut,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/50 bg-[#07120e]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <a
            href="#top"
            onClick={() => onSelectTab('analyze')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/80 text-emerald-400 shadow-sm transition group-hover:border-emerald-400">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-100">
                  JobGuard <span className="text-emerald-400">AI</span>
                </span>
                <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2 py-0.5 text-[11px] font-medium text-emerald-300 sm:inline-block">
                  AI-04 Verifier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SRIMT Parakram Hackathon 2026
              </p>
            </div>
          </a>
        </div>

        <nav
          aria-label="Primary navigation"
          className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm"
        >
          <button
            type="button"
            onClick={() => onSelectTab('analyze')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'analyze'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:bg-emerald-950/50 hover:text-white'
            }`}
          >
            Vacancy Analyzer
          </button>
          <a
            href="#how-it-works"
            onClick={() => onSelectTab('analyze')}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-300 transition hover:bg-emerald-950/50 hover:text-white"
          >
            How It Works
          </a>
          <a
            href="#indicators"
            onClick={() => onSelectTab('analyze')}
            className="hidden md:inline-block rounded-lg px-3 py-1.5 font-medium text-slate-300 transition hover:bg-emerald-950/50 hover:text-white"
          >
            10 Indicators
          </a>
          <a
            href="#india-reporting"
            onClick={() => onSelectTab('analyze')}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-300 transition hover:bg-emerald-950/50 hover:text-white"
          >
            Safety &amp; Helpline
          </a>
          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'history'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:bg-emerald-950/50 hover:text-white'
            }`}
          >
            <History className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Private History</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-900/80 bg-[#0c1d17] px-3 py-1 text-xs text-slate-300"
            title="Sensitive numeric identifiers (Aadhaar, PAN, account numbers, OTPs) are automatically redacted before AI explanation or storage."
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Auto-Redaction Active</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-medium text-emerald-200">
                <User className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-rose-500/50 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25 hover:border-emerald-400"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
