import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
  Search,
  Loader2,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
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
  onSelectSample: (sample: SampleMessage) => void;
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
  onSelectSample,
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
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(true);
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
    onSelectSample(sample);
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
        'Please enter at least 10 characters of the job message or description.'
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
        'Please enter a valid recruiter email address (e.g., hr@company.com) or leave it blank.'
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
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm"
    >
      {/* Top Bar: Title + Sample Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <h2 id="form-heading" className="text-base font-semibold text-slate-900">
          Job Offer Details
        </h2>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Try an example:</span>
          {BUILTIN_SAMPLES.map((sample) => {
            const isSelected = selectedSample?.id === sample.id;
            return (
              <button
                key={sample.id}
                id={sample.id}
                type="button"
                onClick={() => applySample(sample)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sample.kind === 'suspicious'
                    ? isSelected
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : sample.kind === 'legitimate'
                    ? isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : isSelected
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {sample.kind === 'suspicious'
                  ? 'Suspicious Scam'
                  : sample.kind === 'legitimate'
                  ? 'Legitimate Role'
                  : 'Small Startup'}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="message-text-input"
              className="text-xs font-medium text-slate-700"
            >
              Paste the WhatsApp, Telegram, or email message{' '}
              <span className="text-emerald-600">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {messageText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            id="message-text-input"
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Paste the job offer message or description here..."
            required
            maxLength={MAX_CHARS}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        {/* Collapsible / Compact Sender & Link Metadata */}
        <div>
          <button
            type="button"
            onClick={() => setShowOptionalFields((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {showOptionalFields ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              Sender &amp; link details (Company, Recruiter Email, Job URL)
            </span>
          </button>

          {showOptionalFields && (
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="company-name-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Company Name
                </label>
                <input
                  id="company-name-input"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={200}
                  placeholder="e.g., Infosys or TCS"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="recruiter-email-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Recruiter Email
                </label>
                <input
                  id="recruiter-email-input"
                  type="email"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  maxLength={254}
                  placeholder="e.g., hr@company.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="job-url-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Job Link / Website
                </label>
                <input
                  id="job-url-input"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  maxLength={2048}
                  placeholder="https://careers.company.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cold-start feedback banner when cloud backend takes >4.5s */}
        {isLoading && isColdStartSlow && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
          >
            <Clock
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 animate-pulse"
              aria-hidden="true"
            />
            <div>
              <strong>Waking up cloud server:</strong> The free-tier backend is
              starting up (~25–40 seconds on the first check). Subsequent checks
              are instant.
            </div>
          </div>
        )}

        {(validationError || errorMessage) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-800"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              aria-hidden="true"
            />
            <div>{validationError || errorMessage}</div>
          </div>
        )}

        {/* Compact Bottom Options & Action Bar */}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>AI summary</span>
            </label>

            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                id="save-report-toggle"
                type="checkbox"
                checked={saveReport}
                onChange={(e) => setSaveReport(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <BookmarkCheck
                className="h-3.5 w-3.5 text-emerald-600"
                aria-hidden="true"
              />
              <span>Save report</span>
            </label>

            {!user && saveReport && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-emerald-600 underline hover:text-emerald-700"
              >
                Sign in to save
              </button>
            )}

            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              <span>Aadhaar, PAN &amp; OTPs auto-masked</span>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Form</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>Verify Offer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
