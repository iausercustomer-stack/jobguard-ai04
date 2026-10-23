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
      <section className="rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/60 text-emerald-400">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">
          Private Analysis Report History
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">
          Report history is strictly private and isolated per user using
          Supabase PostgreSQL Row Level Security (
          <code className="text-emerald-300">auth.uid() = user_id</code>). Sign
          in to view or save your private vacancy evaluations.
        </p>
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          <span>Sign In to View Private History</span>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-4">
        <div className="flex items-center gap-2.5">
          <History className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-white">
              My Private Saved Reports ({reports.length})
            </h2>
            <p className="text-xs text-slate-400">
              RLS-protected records for {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 bg-[#07120e] px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-500"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-200">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-emerald-950 bg-[#07120e] p-6 text-center text-sm text-slate-400">
          You have no saved reports yet. Check{' '}
          <strong className="text-slate-200">
            &ldquo;Save to Private Report History&rdquo;
          </strong>{' '}
          when running an analysis to store it here.
        </div>
      )}

      <div className="space-y-3">
        {reports.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-emerald-900/60 bg-[#07120e] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-white">
                  {item.company_name || 'Unspecified Employer'}
                </span>
                <span className="rounded-md border border-emerald-700/50 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  Score: {item.risk_score}/100 ({item.risk_level})
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {new Date(item.created_at).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300">{item.summary}</p>
            <p className="mt-2 line-clamp-2 rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-400">
              {item.input_text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
