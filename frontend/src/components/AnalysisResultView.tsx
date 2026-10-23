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
      badge: 'border-rose-500/40 bg-rose-500/15 text-rose-400',
      scoreText: 'text-rose-500',
      stroke: '#f43f5e',
    };
  }
  if (score >= 45) {
    return {
      badge: 'border-amber-500/40 bg-amber-500/15 text-amber-400',
      scoreText: 'text-amber-500',
      stroke: '#f59e0b',
    };
  }
  if (score >= 20) {
    return {
      badge: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-500',
      scoreText: 'text-yellow-500',
      stroke: '#eab308',
    };
  }
  return {
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-500',
    scoreText: 'text-emerald-500',
    stroke: '#10b981',
  };
}

function getSeverityBadge(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return 'border-rose-500/40 bg-rose-500/15 text-rose-400';
    case 'high':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-400';
    case 'medium':
      return 'border-yellow-500/40 bg-yellow-500/15 text-yellow-500';
    case 'low':
    default:
      return 'jg-border jg-surface-elevated jg-text-muted';
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
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, result.risk_score));
  const dashOffset = circumference - (clamped / 100) * circumference;

  const toggleFinding = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <section
      aria-labelledby="results-heading"
      className="overflow-hidden rounded-2xl border jg-surface shadow-lg"
    >
      {/* Top Summary Header */}
      <div className="flex flex-col justify-between gap-4 border-b jg-border jg-surface-elevated p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1.5 md:max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${palette.badge}`}
            >
              {result.risk_category}
            </span>
            {result.redaction_count > 0 && (
              <span className="rounded-full border jg-border jg-surface px-2.5 py-0.5 text-[11px] font-medium jg-text-muted">
                {result.redaction_count} sensitive ID(s) masked
              </span>
            )}
          </div>

          <h2 id="results-heading" className="text-lg font-bold jg-text">
            {result.findings.length === 0
              ? 'No obvious scam patterns found in the message text'
              : `${result.findings.length} warning sign${
                  result.findings.length === 1 ? '' : 's'
                } spotted in this offer`}
          </h2>

          <p className="text-xs sm:text-sm jg-text-muted leading-relaxed">
            {result.category_explanation}
          </p>
        </div>

        {/* Circular SVG Score Ring Gauge */}
        <div className="flex items-center gap-3.5 rounded-2xl border jg-border jg-surface px-4 py-3 shrink-0">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg
              className="h-16 w-16 -rotate-90 transform"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                className="opacity-15 jg-text-muted"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={palette.stroke}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span
              className={`absolute text-base font-extrabold ${palette.scoreText}`}
            >
              {result.risk_score}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold jg-text">Risk Score</div>
            <div className="text-[11px] jg-text-muted">Out of 100</div>
            <div className="text-[10px] jg-text-muted">Heuristic indicator</div>
          </div>
        </div>
      </div>

      {/* Persistence status if requested */}
      {result.persistence.requested && (
        <div
          role="status"
          className={`flex items-center gap-2 border-b px-5 py-2.5 text-xs ${
            result.persistence.saved
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
              : 'jg-warning-box border-b'
          }`}
        >
          {result.persistence.saved ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-500"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {result.persistence.saved
              ? 'Saved to your private report history.'
              : result.persistence.error ||
                'Analysis completed, but report was not saved.'}
          </span>
        </div>
      )}

      {/* Optional AI Explanation Banner */}
      {result.ai_status.requested && (
        <div className="border-b jg-border jg-surface-elevated px-5 py-3 text-xs jg-text-muted">
          <div className="flex items-center gap-1.5 font-semibold jg-text">
            <Sparkles
              className="h-3.5 w-3.5 text-emerald-500"
              aria-hidden="true"
            />
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

      {/* Segmented Sub-Navigation */}
      <div className="flex border-b jg-border jg-surface-elevated px-5 pt-2 gap-5 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setSubTab('findings')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'findings'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent jg-text-muted hover:jg-text'
          }`}
        >
          Warning Signs ({result.findings.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('domain')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'domain'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent jg-text-muted hover:jg-text'
          }`}
        >
          Sender &amp; Website Check
        </button>

        <button
          type="button"
          onClick={() => setSubTab('steps')}
          className={`border-b-2 pb-2.5 font-semibold transition ${
            subTab === 'steps'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent jg-text-muted hover:jg-text'
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
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm jg-text">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                <div>
                  <strong>No red-flag phrases triggered:</strong> This message
                  didn&apos;t demand registration fees, OTPs, or guaranteed
                  selection without an interview. Still, always confirm the
                  opening directly on the company&apos;s official careers
                  website.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {result.findings.map((finding: Finding) => {
                  const isOpen = Boolean(expandedCodes[finding.code]);
                  return (
                    <div
                      key={finding.code}
                      className="rounded-xl border jg-border jg-surface-elevated transition"
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
                          <span className="text-sm font-semibold jg-text">
                            {finding.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium jg-text-muted">
                            +{finding.points} pts
                          </span>
                          {isOpen ? (
                            <ChevronUp
                              className="h-4 w-4 jg-text-muted"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="h-4 w-4 jg-text-muted"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t jg-border jg-surface px-4 py-3 space-y-2 text-xs sm:text-sm">
                          <div className="rounded-lg border jg-border jg-surface-elevated px-3 py-2 text-xs">
                            <span className="font-semibold jg-text-muted">
                              Matched text:{' '}
                            </span>
                            <span className="font-mono jg-text">
                              {finding.evidence}
                            </span>
                          </div>
                          <p className="jg-text-muted leading-relaxed">
                            {finding.explanation}
                          </p>
                          <p className="font-medium text-emerald-500">
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
            <div className="rounded-xl border jg-border jg-surface-elevated p-4 text-xs sm:text-sm jg-text-muted">
              <span className="font-semibold jg-text">Summary: </span>
              {result.verification.verification_summary}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border jg-border jg-surface-elevated p-3.5">
                <div className="flex items-center gap-1.5 font-semibold jg-text">
                  <Globe
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span>Job Link Check</span>
                </div>
                {result.verification.url_provided ? (
                  <div className="mt-2 space-y-1 jg-text-muted">
                    <div>
                      <strong>Valid format:</strong>{' '}
                      {result.verification.url_valid ? 'Yes' : 'No (Unsafe)'}
                    </div>
                    {result.verification.root_domain && (
                      <div>
                        <strong>Domain:</strong>{' '}
                        <span className="font-mono jg-text">
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
                  <p className="mt-2 jg-text-muted">No job link entered.</p>
                )}
              </div>

              <div className="rounded-xl border jg-border jg-surface-elevated p-3.5">
                <div className="flex items-center gap-1.5 font-semibold jg-text">
                  <Mail
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span>Email vs. Website</span>
                </div>
                <p className="mt-2 jg-text-muted leading-relaxed">
                  {result.verification.domain_comparison.explanation}
                </p>
              </div>

              <div className="rounded-xl border jg-border jg-surface-elevated p-3.5">
                <div className="flex items-center gap-1.5 font-semibold jg-text">
                  <ShieldAlert
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span>Official Employer Match</span>
                </div>
                <p className="mt-2 jg-text-muted leading-relaxed">
                  {result.verification.registry_check.note}
                </p>
                {result.verification.registry_check.official_careers_url && (
                  <a
                    href={
                      result.verification.registry_check.official_careers_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-medium text-emerald-500 underline"
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
            <ul className="space-y-2.5 text-xs sm:text-sm jg-text-muted">
              {result.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 rounded-xl border jg-border jg-surface-elevated p-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="jg-text">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 border-t jg-border pt-3.5 text-[11px] jg-text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{result.uncertainty_disclaimer}</span>
        </div>
      </div>
    </section>
  );
};
