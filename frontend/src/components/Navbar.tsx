import React from 'react';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  History,
  BookOpen,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { AuthUser } from '../types';

export type MainViewTab = 'analyze' | 'guide' | 'history';

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  activeTab: MainViewTab;
  onSelectTab: (tab: MainViewTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuthModal,
  onSignOut,
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 dark:border-slate-800/80 bg-white/80 dark:bg-[#08110e]/85 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('analyze')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/25 transition group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              JobGuard <span className="text-emerald-500">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Offer Verifier
            </span>
          </div>
        </button>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-1 text-xs sm:text-sm"
        >
          <button
            type="button"
            onClick={() => onSelectTab('analyze')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'analyze'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search
              className={`h-3.5 w-3.5 ${
                activeTab === 'analyze' && isDark
                  ? 'text-white'
                  : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Check Offer</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('guide')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen
              className={`h-3.5 w-3.5 ${
                activeTab === 'guide' && isDark
                  ? 'text-white'
                  : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Safety Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History
              className={`h-3.5 w-3.5 ${
                activeTab === 'history' && isDark
                  ? 'text-white'
                  : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Saved</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-amber-300 shadow-2xs transition hover:bg-slate-50 dark:hover:border-amber-400/50"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <User className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span className="max-w-[130px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition hover:bg-emerald-100/80"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
