import React, { useEffect, useState } from 'react';
import {
  History,
  Lock,
  RefreshCw,
  AlertTriangle,
  Clock,
  Building2,
} from 'lucide-react';
import { AuthUser, SavedReportRecord } from '../types';
import { fetchMyReportsApi } from '../lib/api';

interface HistoryPanelProps {
  user: AuthUser | null;
  onOpenAuthModal: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  user,
  onOpenAuthModal,
}) => {
  const [reports, setReports] = useState<SavedReportRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyReportsApi(user.accessToken);
      setReports(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load private report history.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadReports();
    } else {
      setReports([]);
      setError(null);
    }
  }, [user]);

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-900">
          Saved Report History
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-slate-600">
          Sign in to view or save your private job offer checks. Reports are
          visible only to your account.
        </p>
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <span>Sign In</span>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Saved Reports ({reports.length})
            </h2>
            <p className="text-xs text-slate-500">Private history for {user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs sm:text-sm text-slate-500">
          No saved reports yet. Check <strong>&ldquo;Save report&rdquo;</strong>{' '}
          before verifying an offer to keep a copy here.
        </div>
      )}

      <div className="space-y-2.5">
        {reports.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-slate-900">
                  {item.company_name || 'Unspecified Employer'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {item.risk_score}/100 · {item.risk_level}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {new Date(item.created_at).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
