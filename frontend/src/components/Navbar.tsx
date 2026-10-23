import React from 'react';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  History,
  BookOpen,
  Search,
} from 'lucide-react';
import { AuthUser } from '../types';

export type MainViewTab = 'analyze' | 'guide' | 'history';

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  activeTab: MainViewTab;
  onSelectTab: (tab: MainViewTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuthModal,
  onSignOut,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('analyze')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition group-hover:bg-emerald-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              JobGuard <span className="text-emerald-600">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Vacancy Verifier
            </span>
          </div>
        </button>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:text-sm"
        >
          <button
            type="button"
            onClick={() => onSelectTab('analyze')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'analyze'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Check Offer</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('guide')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Safety Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Saved</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="max-w-[130px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
