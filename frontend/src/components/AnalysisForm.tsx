import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
  Search,
  ImageOff,
  Loader2,
  Shield,
  Clock,
} from 'lucide-react';
import { AnalyzeRequestPayload, AuthUser, SampleMessage } from '../types';
import { BUILTIN_SAMPLES } from '../lib/samples';

interface AnalysisFormProps {
  onSubmit: (payload: AnalyzeRequestPayload) => Promise<void>;
  isLoading: boolean;
  isColdStartSlow?: boolean;
  errorMessage: string | null;
  user: AuthUser | null;
  selectedSample: SampleMessage | null;
  onClearSample: () => void;
  onOpenAuthModal: () => void;
}

const MAX_CHARS = 12000;

export const AnalysisForm: React.FC<AnalysisFormProps> = ({
  onSubmit,
  isLoading,
  isColdStartSlow = false,
  errorMessage,
  user,
  selectedSample,
  onClearSample,
  onOpenAuthModal,
}) => {
  const [messageText, setMessageText] = useState<string>(
    BUILTIN_SAMPLES[0].message_text
  );
  const [companyName, setCompanyName] = useState<string>(
    BUILTIN_SAMPLES[0].company_name
  );
  const [recruiterEmail, setRecruiterEmail] = useState<string>(
    BUILTIN_SAMPLES[0].recruiter_email
  );
  const [jobUrl, setJobUrl] = useState<string>(BUILTIN_SAMPLES[0].job_url);
  const [useAi, setUseAi] = useState<boolean>(false);
  const [saveReport, setSaveReport] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedSample) {
      setMessageText(selectedSample.message_text);
      setCompanyName(selectedSample.company_name);
      setRecruiterEmail(selectedSample.recruiter_email);
      setJobUrl(selectedSample.job_url);
      setValidationError(null);
    }
  }, [selectedSample]);

  const applySample = (sample: SampleMessage) => {
    setMessageText(sample.message_text);
    setCompanyName(sample.company_name);
    setRecruiterEmail(sample.recruiter_email);
    setJobUrl(sample.job_url);
    setValidationError(null);
  };

  const handleReset = () => {
    setMessageText('');
    setCompanyName('');
    setRecruiterEmail('');
    setJobUrl('');
    setValidationError(null);
    onClearSample();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = messageText.trim();
    if (trimmed.length < 10) {
      setValidationError(
        'Please enter at least 10 characters of the recruitment message or job description to analyze.'
      );
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setValidationError(
        `Message exceeds the maximum length of ${MAX_CHARS.toLocaleString()} characters.`
      );
      return;
    }
    if (
      recruiterEmail.trim() &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recruiterEmail.trim())
    ) {
      setValidationError(
        'Please enter a valid recruiter email address (e.g., hr@company.com) or leave the email field blank.'
      );
      return;
    }

    await onSubmit({
      message_text: trimmed,
      company_name: companyName.trim() || null,
      recruiter_email: recruiterEmail.trim() || null,
      job_url: jobUrl.trim() || null,
      use_ai: useAi,
      save_report: saveReport,
    });
  };

  return (
    <section
      id="analyzer-form"
      aria-labelledby="form-heading"
      className="rounded-2xl border border-emerald-900/60 bg-[#0c1d17] p-5 sm:p-7 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-4">
        <div>
          <h2 id="form-heading" className="text-xl font-bold text-white">
            Vacancy &amp; Recruitment Message Analyzer
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
            Paste a suspicious offer message, job description, sender email, and job link below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BUILTIN_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => applySample(sample)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                sample.kind === 'suspicious'
                  ? 'border-amber-500/40 bg-amber-950/30 text-amber-200 hover:bg-amber-950/60'
                  : sample.kind === 'legitimate'
                  ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-950/70'
                  : 'border-sky-600/40 bg-sky-950/30 text-sky-200 hover:bg-sky-950/60'
              }`}
            >
              {sample.kind === 'suspicious'
                ? 'Sample Suspicious'
                : sample.kind === 'legitimate'
                ? 'Sample Legitimate'
                : 'Sample Ambiguous'}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy & Sensitive Data Notice */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-800/50 bg-[#112820]/70 p-3 text-xs text-slate-300">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <div>
          <strong className="text-emerald-300">Privacy &amp; Safety Notice:</strong>{' '}
          Never submit real banking passwords, live OTPs, or UPI PINs. JobGuard AI
          automatically redacts 12-digit Aadhaar-like numbers, PAN numbers, and bank
          account sequences before optional AI explanation or report storage.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="message-text-input"
              className="block text-sm font-semibold text-slate-200"
            >
              Recruitment Message or Job Description{' '}
              <span className="text-emerald-400">*</span>
            </label>
            <span
              className={`text-xs ${
                messageText.length > MAX_CHARS
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {messageText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id="message-text-input"
            rows={6}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Paste the WhatsApp/Telegram recruitment message, offer letter excerpt, or job posting text here..."
            required
            maxLength={MAX_CHARS}
            className="mt-1.5 w-full rounded-xl border border-emerald-900/80 bg-[#07120e] p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="company-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Company / Employer Name
            </label>
            <input
              id="company-name-input"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={200}
              placeholder="e.g., Tata Consultancy Services"
              className="mt-1.5 w-full rounded-xl border border-emerald-900/80 bg-[#07120e] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
            />
          </div>

          <div>
            <label
              htmlFor="recruiter-email-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Recruiter Email Address
            </label>
            <input
              id="recruiter-email-input"
              type="email"
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              maxLength={254}
              placeholder="e.g., hr@company.com"
              className="mt-1.5 w-full rounded-xl border border-emerald-900/80 bg-[#07120e] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
            />
          </div>

          <div>
            <label
              htmlFor="job-url-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Job Posting / Application URL
            </label>
            <input
              id="job-url-input"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              maxLength={2048}
              placeholder="https://careers.company.com/job/123"
              className="mt-1.5 w-full rounded-xl border border-emerald-900/80 bg-[#07120e] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Screenshot OCR Notice — Explicitly marked as a Future Roadmap feature per requirement 4.C */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-slate-700/80 bg-[#07120e]/60 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ImageOff className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>
              <strong>Screenshot OCR Upload:</strong> Planned for Phase-2 Roadmap (Tesseract/Vision OCR pipeline). Currently unavailable—please paste message text above.
            </span>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
            Future Feature
          </span>
        </div>

        {/* Optional toggles: AI explanation & Save report */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-900/60 bg-[#07120e]/80 p-3 text-xs sm:text-sm text-slate-200 transition hover:border-emerald-700">
            <input
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Include Optional AI-Assisted Explanation</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Uses backend-only AI adapter to summarize deterministic evidence. Automatically falls back if unconfigured.
              </p>
            </div>
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-emerald-900/60 bg-[#07120e]/80 p-3 text-xs sm:text-sm text-slate-200">
            <input
              id="save-report-checkbox"
              type="checkbox"
              checked={saveReport}
              onChange={(e) => setSaveReport(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <label
                htmlFor="save-report-checkbox"
                className="flex cursor-pointer items-center gap-1.5 font-semibold text-emerald-300"
              >
                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save to Private Report History</span>
              </label>
              <p className="mt-0.5 text-xs text-slate-400">
                {user ? (
                  <>Signed in as {user.email}. Report will be saved under your RLS-protected user ID.</>
                ) : (
                  <>
                    Requires authentication.{' '}
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="text-emerald-400 underline hover:text-emerald-300"
                    >
                      Sign in
                    </button>{' '}
                    to persist reports to your private history.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Cold-start feedback banner when cloud backend takes >4.5s */}
        {isLoading && isColdStartSlow && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3.5 text-xs sm:text-sm text-amber-200"
          >
            <Clock
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 animate-pulse"
              aria-hidden="true"
            />
            <div>
              <strong>Cloud Backend Waking Up:</strong> The Render free-tier Python service is waking from inactivity (cold starts typically take 25–45 seconds on the first request). Subsequent analyses complete in under 200ms.
            </div>
          </div>
        )}

        {(validationError || errorMessage) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/50 bg-rose-950/40 p-3.5 text-xs sm:text-sm text-rose-200"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
              aria-hidden="true"
            />
            <div>{validationError || errorMessage}</div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Clear Form</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/60 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analyzing Vacancy Indicators...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Analyze Vacancy Risk</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
