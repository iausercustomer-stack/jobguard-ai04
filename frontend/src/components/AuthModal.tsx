import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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
      aria-labelledby="modal-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border jg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b jg-border pb-3">
          <h2 id="modal-auth-title" className="text-base font-bold jg-text">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 jg-text-muted hover:opacity-80"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2.5 text-xs jg-text-muted">
          Save your job offer checks privately to your account.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-3 rounded-xl border p-3 text-xs jg-warning-box">
            <strong>Note:</strong> Supabase cloud credentials are not configured
            in <code className="font-mono">.env</code> yet. You can still use
            the offer verifier without signing in.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border jg-border jg-surface-elevated p-1">
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
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'jg-text-muted'
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
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'jg-text-muted'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <div>
            <label
              htmlFor="modal-email"
              className="block text-xs font-semibold jg-text"
            >
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 jg-text-muted"
                aria-hidden="true"
              />
              <input
                id="modal-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl py-2 pl-9 pr-3 text-sm jg-input"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-password"
              className="block text-xs font-semibold jg-text"
            >
              Password (min 6 characters)
            </label>
            <div className="relative mt-1">
              <Lock
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 jg-text-muted"
                aria-hidden="true"
              />
              <input
                id="modal-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl py-2 pl-9 pr-3 text-sm jg-input"
              />
            </div>
          </div>

          {(localError || authError) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border p-3 text-xs jg-danger-box"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{localError || authError}</span>
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-500"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
