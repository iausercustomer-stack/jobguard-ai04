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
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b jg-border jg-surface backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2.5 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('analyze')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/25 transition group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight jg-text">
              JobGuard <span className="text-emerald-500">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
              Offer Verifier
            </span>
          </div>
        </button>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 rounded-xl border jg-border jg-surface-elevated p-1 text-xs sm:text-sm"
        >
          <button
            type="button"
            onClick={() => onSelectTab('analyze')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-semibold transition ${
              activeTab === 'analyze'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'jg-text-muted hover:jg-text'
            }`}
          >
            <Search
              className={`h-3.5 w-3.5 ${
                activeTab === 'analyze' ? 'text-white' : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Check Offer</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('guide')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-semibold transition ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'jg-text-muted hover:jg-text'
            }`}
          >
            <BookOpen
              className={`h-3.5 w-3.5 ${
                activeTab === 'guide' ? 'text-white' : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Safety Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-semibold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'jg-text-muted hover:jg-text'
            }`}
          >
            <History
              className={`h-3.5 w-3.5 ${
                activeTab === 'history' ? 'text-white' : 'text-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>Saved</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex items-center gap-1.5 rounded-xl border jg-border jg-surface-elevated px-2.5 py-1.5 text-xs font-semibold jg-text transition hover:border-emerald-500/50"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-xl border jg-border jg-surface-elevated px-2.5 py-1.5 text-xs font-medium jg-text">
                <User className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span className="max-w-[125px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border jg-border jg-surface-elevated px-2.5 py-1.5 text-xs font-medium jg-text transition hover:border-rose-500/50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition hover:bg-emerald-500/25"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
