import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Info,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnalyzeResponse, Finding, SeverityLevel } from '../types';

interface AnalysisResultViewProps {
  result: AnalyzeResponse;
}

function getScorePalette(score: number) {
  if (score >= 70) {
    return {
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
      scoreText: 'text-rose-600',
      barColor: 'bg-rose-500',
      headerBg: 'bg-rose-50/60 border-rose-100',
    };
  }
  if (score >= 45) {
    return {
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
      scoreText: 'text-amber-600',
      barColor: 'bg-amber-500',
      headerBg: 'bg-amber-50/60 border-amber-100',
    };
  }
  if (score >= 20) {
    return {
      badgeBg: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      scoreText: 'text-yellow-600',
      barColor: 'bg-yellow-500',
      headerBg: 'bg-yellow-50/50 border-yellow-100',
    };
  }
  return {
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    scoreText: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/50 border-emerald-100',
  };
}

function getSeverityBadge(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'high':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
}) => {
  const [subTab, setSubTab] = useState<'findings' | 'domain' | 'steps'>(
    'findings'
  );
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      if (result.findings.length > 0) {
        initial[result.findings[0].code] = true;
      }
      return initial;
    }
  );

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    if (result.findings.length > 0) {
      next[result.findings[0].code] = true;
    }
    setExpandedCodes(next);
    setSubTab('findings');
  }, [result]);

  const palette = getScorePalette(result.risk_score);

  const toggleFinding = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <section
      aria-labelledby="results-heading"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
    >
      {/* Clean Top Summary Header */}
      <div
        className={`flex flex-col justify-between gap-4 border-b p-5 sm:p-6 md:flex-row md:items-center ${palette.headerBg}`}
      >
        <div className="space-y-1.5 md:max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${palette.badgeBg}`}
            >
              {result.risk_category}
            </span>
            {result.redaction_count > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {result.redaction_count} sensitive ID(s) masked
              </span>
            )}
          </div>

          <h2 id="results-heading" className="text-lg font-bold text-slate-900">
            {result.findings.length === 0
              ? 'No obvious scam patterns found in the message text'
              : `${result.findings.length} warning sign${
                  result.findings.length === 1 ? '' : 's'
                } spotted in this offer`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {result.category_explanation}
          </p>
        </div>

        {/* Clean Score Meter */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-sm shrink-0">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Risk Score
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-3xl font-extrabold ${palette.scoreText}`}>
                {result.risk_score}
              </span>
              <span className="text-xs font-medium text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="w-24">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-500 ${palette.barColor}`}
                style={{
                  width: `${Math.min(100, Math.max(0, result.risk_score))}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Heuristic indicator
            </div>
          </div>
        </div>
      </div>

      {/* Persistence status if requested */}
      {result.persistence.requested && (
        <div
          role="status"
          className={`flex items-center gap-2 border-b px-5 py-2.5 text-xs ${
            result.persistence.saved
              ? 'border-emerald-100 bg-emerald-50/70 text-emerald-800'
              : 'border-amber-100 bg-amber-50/70 text-amber-900'
          }`}
        >
          {result.persistence.saved ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
          )}
          <span>
            {result.persistence.saved
              ? 'Saved to your private report history.'
              : result.persistence.error ||
                'Analysis completed, but report was not saved.'}
          </span>
        </div>
      )}

      {/* Optional AI Explanation Banner (only if requested) */}
      {result.ai_status.requested && (
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>
              {result.ai_status.used
                ? 'AI Summary'
                : 'Rule-Based Summary (AI Offline)'}
            </span>
          </div>
          <p className="mt-1">
            {result.ai_status.used && result.ai_status.explanation
              ? result.ai_status.explanation.plain_language_summary
              : result.ai_status.fallback_reason}
          </p>
        </div>
      )}

      {/* Segmented Sub-Navigation to prevent long vertical walls of text */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-2 gap-4 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setSubTab('findings')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'findings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Warning Signs ({result.findings.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('domain')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'domain'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sender &amp; Website Check
        </button>

        <button
          type="button"
          onClick={() => setSubTab('steps')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'steps'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          How to Verify ({result.recommendations.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6">
        {subTab === 'findings' && (
          <div>
            {result.findings.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-700">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <div>
                  <strong className="text-slate-900">
                    No red-flag phrases triggered:
                  </strong>{' '}
                  This message didn&apos;t demand registration fees, OTPs, or
                  guaranteed selection without an interview. Still, always
                  confirm the opening directly on the company&apos;s official
                  careers website.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {result.findings.map((finding: Finding) => {
                  const isOpen = Boolean(expandedCodes[finding.code]);
                  return (
                    <div
                      key={finding.code}
                      className="rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFinding(finding.code)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${getSeverityBadge(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {finding.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-slate-500">
                            +{finding.points} pts
                          </span>
                          {isOpen ? (
                            <ChevronUp
                              className="h-4 w-4 text-slate-400"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="h-4 w-4 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2 text-xs sm:text-sm">
                          <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-700">
                            <span className="font-semibold text-slate-500">
                              Matched text:{' '}
                            </span>
                            <span className="font-mono text-slate-900">
                              {finding.evidence}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {finding.explanation}
                          </p>
                          <p className="font-medium text-emerald-800">
                            What to do: {finding.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subTab === 'domain' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs sm:text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Summary: </span>
              {result.verification.verification_summary}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Globe className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Job Link Check</span>
                </div>
                {result.verification.url_provided ? (
                  <div className="mt-2 space-y-1 text-slate-600">
                    <div>
                      <strong>Valid format:</strong>{' '}
                      {result.verification.url_valid ? 'Yes' : 'No (Unsafe)'}
                    </div>
                    {result.verification.root_domain && (
                      <div>
                        <strong>Domain:</strong>{' '}
                        <span className="font-mono text-slate-900">
                          {result.verification.root_domain}
                        </span>
                      </div>
                    )}
                    <div>
                      <strong>Link shortener:</strong>{' '}
                      {result.verification.is_shortened_url ? 'Yes' : 'No'}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-slate-400">No job link entered.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Mail className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Email vs. Website</span>
                </div>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  {result.verification.domain_comparison.explanation}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <ShieldAlert
                    className="h-4 w-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>Official Employer Match</span>
                </div>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  {result.verification.registry_check.note}
                </p>
                {result.verification.registry_check.official_careers_url && (
                  <a
                    href={
                      result.verification.registry_check.official_careers_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-medium text-emerald-700 underline"
                  >
                    <span>Visit Official Careers Page</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {subTab === 'steps' && (
          <div className="space-y-4">
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              {result.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concise 1-Line Disclaimer Footer */}
        <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-3.5 text-[11px] text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{result.uncertainty_disclaimer}</span>
        </div>
      </div>
    </section>
  );
};
