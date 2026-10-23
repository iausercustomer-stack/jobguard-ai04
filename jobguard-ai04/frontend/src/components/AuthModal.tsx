import React, { useState } from 'react';
import { X, Lock, Mail, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  authError: string | null;
  clearAuthError: () => void;
  isSupabaseConfigured: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  authError,
  clearAuthError,
  isSupabaseConfigured,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setStatusMessage(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const ok = await onSignIn(trimmedEmail, password);
        if (ok) {
          onClose();
        }
      } else {
        const res = await onSignUp(trimmedEmail, password);
        if (res.ok) {
          setStatusMessage(
            res.message || 'Account created! You can now sign in.'
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-emerald-800/70 bg-[#0c1d17] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
          <h2 id="auth-modal-title" className="text-lg font-bold text-white">
            {mode === 'signin'
              ? 'Sign In to JobGuard AI'
              : 'Create Private JobGuard Account'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-emerald-950 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Authenticated users can save vacancy analysis reports to a private
          PostgreSQL history protected by Supabase Row Level Security (
          <code className="text-emerald-300">auth.uid() = user_id</code>).
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
            <strong>Configuration Note:</strong>{' '}
            <code className="text-amber-100">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-amber-100">VITE_SUPABASE_ANON_KEY</code> are
            currently set to placeholders. Configure your Supabase project in{' '}
            <code className="text-amber-100">.env</code> to enable cloud
            authentication. The core vacancy analyzer works without signing in.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#07120e] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError(null);
              setStatusMessage(null);
              clearAuthError();
            }}
            className={`rounded-lg py-1.5 text-xs font-semibold transition ${
              mode === 'signin'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
              setStatusMessage(null);
              clearAuthError();
            }}
            className={`rounded-lg py-1.5 text-xs font-semibold transition ${
              mode === 'signup'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-emerald-900/80 bg-[#07120e] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Password (min 6 characters)
            </label>
            <div className="relative mt-1">
              <Lock
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-emerald-900/80 bg-[#07120e] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
              />
            </div>
          </div>

          {(localError || authError) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-500/50 bg-rose-950/50 p-3 text-xs text-rose-200"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                aria-hidden="true"
              />
              <span>{localError || authError}</span>
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/50 p-3 text-xs text-emerald-200"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>
              {mode === 'signin' ? 'Sign In' : 'Create Private Account'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
