import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
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

function getScoreBadgeStyles(score: number): {
  ring: string;
  bg: string;
  text: string;
  bar: string;
} {
  if (score >= 70) {
    return {
      ring: 'border-rose-500/60',
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      bar: 'bg-rose-500',
    };
  }
  if (score >= 45) {
    return {
      ring: 'border-amber-500/60',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      bar: 'bg-amber-500',
    };
  }
  if (score >= 20) {
    return {
      ring: 'border-yellow-500/60',
      bg: 'bg-yellow-950/30',
      text: 'text-yellow-200',
      bar: 'bg-yellow-400',
    };
  }
  return {
    ring: 'border-emerald-500/60',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
  };
}

function getSeverityStyles(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return 'border-rose-500/50 bg-rose-950/60 text-rose-200';
    case 'high':
      return 'border-amber-500/50 bg-amber-950/60 text-amber-200';
    case 'medium':
      return 'border-yellow-500/50 bg-yellow-950/50 text-yellow-200';
    case 'low':
    default:
      return 'border-sky-500/50 bg-sky-950/50 text-sky-200';
  }
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
}) => {
  const scoreStyle = getScoreBadgeStyles(result.risk_score);
  const formattedTime = new Date(result.analyzed_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return (
    <section
      aria-labelledby="results-heading"
      className="space-y-6 rounded-2xl border border-emerald-800/60 bg-[#0c1d17] p-5 sm:p-7 shadow-2xl"
    >
      {/* Top Status & Score Banner */}
      <div className="flex flex-col justify-between gap-6 border-b border-emerald-900/60 pb-6 lg:flex-row lg:items-center">
        <div className="space-y-2 lg:max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-900 bg-[#07120e] px-2.5 py-1 text-emerald-300">
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                Mode:{' '}
                {result.analysis_mode === 'deterministic_plus_ai'
                  ? 'Deterministic + AI Explanation'
                  : 'Deterministic Rule Engine'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-900 bg-[#07120e] px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>{formattedTime}</span>
            </span>
            {result.redaction_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-700/50 bg-amber-950/40 px-2.5 py-1 text-amber-200">
                <span>
                  Auto-Redacted {result.redaction_count} Sensitive ID(s)
                </span>
              </span>
            )}
          </div>

          <h2 id="results-heading" className="text-2xl font-extrabold text-white">
            {result.risk_category}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {result.category_explanation}
          </p>
        </div>

        {/* Heuristic Score Box */}
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border-2 px-6 py-4 min-w-[210px] ${scoreStyle.ring} ${scoreStyle.bg}`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Heuristic Risk Score
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-4xl font-black ${scoreStyle.text}`}>
              {result.risk_score}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full transition-all duration-500 ${scoreStyle.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, result.risk_score))}%` }}
            />
          </div>
          <span className="mt-1.5 text-[11px] text-slate-400 text-center">
            Heuristic indicator, not probability
          </span>
        </div>
      </div>

      {/* Persistence feedback if save_report was requested */}
      {result.persistence.requested && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm ${
            result.persistence.saved
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              : 'border-amber-500/50 bg-amber-950/40 text-amber-200'
          }`}
        >
          {result.persistence.saved ? (
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
              aria-hidden="true"
            />
          )}
          <div>
            {result.persistence.saved ? (
              <span>
                <strong>Report Saved:</strong> This analysis was saved to your
                private report history (ID: {result.persistence.report_id || 'saved'}).
              </span>
            ) : (
              <span>
                <strong>Analysis Succeeded, Report Not Saved:</strong>{' '}
                {result.persistence.error ||
                  'Could not persist report to database.'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Analysis Summary
        </h3>
        <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* Optional AI Explanation Layer Output or Transparent Fallback Note */}
      {result.ai_status.requested && (
        <div className="rounded-xl border border-emerald-700/50 bg-[#112820]/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>AI-Assisted Plain-Language Explanation</span>
            </div>
            <span className="rounded-full border border-emerald-700/60 bg-emerald-950 px-2.5 py-0.5 text-[11px] text-emerald-300">
              {result.ai_status.used
                ? `Model: ${result.ai_status.model}`
                : 'Deterministic Fallback Active'}
            </span>
          </div>

          {result.ai_status.used && result.ai_status.explanation ? (
            <div className="mt-3 space-y-3 text-sm text-slate-200">
              <p>{result.ai_status.explanation.plain_language_summary}</p>
              {result.ai_status.explanation.key_questions_to_ask_recruiter.length >
                0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Questions to Ask the Recruiter:
                  </h4>
                  <ul className="mt-1 list-disc pl-5 space-y-1 text-xs text-slate-300">
                    {result.ai_status.explanation.key_questions_to_ask_recruiter.map(
                      (q, i) => (
                        <li key={i}>{q}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
              <p className="text-xs italic text-slate-400">
                {result.ai_status.explanation.caution_note}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-300">
              {result.ai_status.fallback_reason ||
                'AI explanation layer was not used; displaying complete deterministic rule-based findings below.'}
            </p>
          )}
        </div>
      )}

      {/* Extracted Warning Findings */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Specific Warning Indicators &amp; Extracted Evidence ({result.findings.length})
          </h3>
          <span className="text-xs text-slate-400">
            Duplicate matches per category are merged &amp; counted once
          </span>
        </div>

        {result.findings.length === 0 ? (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-800/60 bg-[#07120e] p-4 text-sm text-slate-300">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <strong className="text-emerald-300">
                No Heuristic Scam Rules Triggered:
              </strong>{' '}
              The submitted text did not match upfront fee demands, credential/OTP harvesting,
              or high-pressure scam phrases. Remember that scammers sometimes copy real job
              descriptions—always verify the vacancy on the employer&apos;s official website.
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {result.findings.map((finding: Finding) => (
              <div
                key={finding.code}
                className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-4 transition hover:border-emerald-700/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      [{finding.code}]
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {finding.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${getSeverityStyles(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-slate-200">
                      +{finding.points} pts
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 font-mono text-xs text-amber-200">
                  <span className="text-slate-400 select-none">Evidence: </span>
                  {finding.evidence}
                </div>

                <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {finding.explanation}
                </p>

                <div className="mt-2 flex items-start gap-1.5 text-xs font-medium text-emerald-300">
                  <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Action: {finding.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safe URL, Email & Official Employer Verification Panel */}
      <div className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-white">
              Safe URL, Domain &amp; Employer Verification
            </h3>
          </div>
          <span className="rounded-full border border-emerald-700/50 bg-emerald-950/70 px-3 py-0.5 text-xs font-semibold text-emerald-300">
            Status: {result.verification.verification_status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300">
          {result.verification.verification_summary}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
          <div className="rounded-lg border border-emerald-950 bg-[#0c1d17] p-3">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>URL Inspection (Zero-Fetch Safe Parse)</span>
            </div>
            {result.verification.url_provided ? (
              <div className="mt-1.5 space-y-1 text-slate-300">
                <div>
                  <strong>Valid HTTP/HTTPS:</strong>{' '}
                  {result.verification.url_valid ? 'Yes' : 'No (Rejected)'}
                </div>
                {result.verification.normalized_hostname && (
                  <div>
                    <strong>Hostname:</strong>{' '}
                    <span className="font-mono text-emerald-200">
                      {result.verification.normalized_hostname}
                    </span>
                  </div>
                )}
                {result.verification.root_domain && (
                  <div>
                    <strong>Root Domain:</strong>{' '}
                    <span className="font-mono text-emerald-200">
                      {result.verification.root_domain}
                    </span>
                  </div>
                )}
                <div>
                  <strong>Shortened Link:</strong>{' '}
                  {result.verification.is_shortened_url ? 'Yes (Warning)' : 'No'}
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-slate-400">No job URL was supplied.</p>
            )}
          </div>

          <div className="rounded-lg border border-emerald-950 bg-[#0c1d17] p-3">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Recruiter Email vs. Website Domain</span>
            </div>
            <p className="mt-1.5 text-slate-300 leading-relaxed">
              {result.verification.domain_comparison.explanation}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-950 bg-[#0c1d17] p-3">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Official Employer Registry Check</span>
            </div>
            <p className="mt-1.5 text-slate-300 leading-relaxed">
              {result.verification.registry_check.note}
            </p>
            {result.verification.registry_check.official_careers_url && (
              <a
                href={result.verification.registry_check.official_careers_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-emerald-400 underline hover:text-emerald-300"
              >
                <span>Official Careers Portal</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="rounded-xl border border-emerald-900/70 bg-[#07120e] p-4 sm:p-5">
        <h3 className="text-base font-bold text-white">
          Recommended Independent Verification Steps
        </h3>
        <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-300">
          {result.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                {index + 1}
              </span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Methodology & Uncertainty Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Info className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Methodology &amp; Uncertainty Disclaimer</span>
        </div>
        <p>{result.methodology_note}</p>
        <p className="text-slate-300">{result.uncertainty_disclaimer}</p>
      </div>
    </section>
  );
};
