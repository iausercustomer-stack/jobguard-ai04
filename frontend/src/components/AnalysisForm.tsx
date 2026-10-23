import React, { useState, useEffect } from 'react';
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
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { AnalyzeRequestPayload, AuthUser, SampleMessage } from '../types';
import { BUILTIN_SAMPLES } from '../lib/samples';
import { PrefillFormPayload } from './ScreenshotOcrModal';

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
  onOpenScreenshotModal: () => void;
  externalPrefill: PrefillFormPayload | null;
  onClearExternalPrefill: () => void;
  forceExpandSender?: boolean;
  onHasContentChange?: (hasContent: boolean) => void;
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
  onOpenScreenshotModal,
  externalPrefill,
  onClearExternalPrefill,
  forceExpandSender = false,
  onHasContentChange,
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
  const [prefilledBadges, setPrefilledBadges] = useState<string[]>([]);

  useEffect(() => {
    if (forceExpandSender) {
      setShowOptionalFields(true);
    }
  }, [forceExpandSender]);

  useEffect(() => {
    if (onHasContentChange) {
      onHasContentChange(Boolean(messageText.trim().length > 0));
    }
  }, [messageText, onHasContentChange]);

  useEffect(() => {
    if (selectedSample) {
      setMessageText(selectedSample.message_text);
      setCompanyName(selectedSample.company_name);
      setRecruiterEmail(selectedSample.recruiter_email);
      setJobUrl(selectedSample.job_url);
      setValidationError(null);
      setPrefilledBadges([]);
    }
  }, [selectedSample]);

  useEffect(() => {
    if (externalPrefill) {
      setMessageText(externalPrefill.message_text);
      setCompanyName(externalPrefill.company_name);
      setRecruiterEmail(externalPrefill.recruiter_email);
      setJobUrl(externalPrefill.job_url);
      setShowOptionalFields(true);
      setValidationError(null);
      setPrefilledBadges(externalPrefill.filled_fields);
      const el = document.getElementById('analyzer-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [externalPrefill]);

  const applySample = (sample: SampleMessage) => {
    setMessageText(sample.message_text);
    setCompanyName(sample.company_name);
    setRecruiterEmail(sample.recruiter_email);
    setJobUrl(sample.job_url);
    setValidationError(null);
    setPrefilledBadges([]);
    onClearExternalPrefill();
    onSelectSample(sample);
  };

  const handleReset = () => {
    setMessageText('');
    setCompanyName('');
    setRecruiterEmail('');
    setJobUrl('');
    setValidationError(null);
    setPrefilledBadges([]);
    onClearExternalPrefill();
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
      className="overflow-hidden rounded-2xl border jg-surface shadow-lg"
    >
      {/* Top Gradient Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      <div className="p-5 sm:p-6">
        {/* Top Bar: Title + Screenshot OCR Button + Sample Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b jg-border">
          <div className="flex items-center gap-2.5">
            <h2 id="form-heading" className="text-base font-bold jg-text">
              Job Offer Details
            </h2>
            <button
              type="button"
              onClick={onOpenScreenshotModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 transition hover:bg-emerald-500/20"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload Screenshot</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs jg-text-muted mr-1">Try an example:</span>
            {BUILTIN_SAMPLES.map((sample) => {
              const isSelected = selectedSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  id={sample.id}
                  type="button"
                  onClick={() => applySample(sample)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    sample.kind === 'suspicious'
                      ? isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                      : sample.kind === 'legitimate'
                      ? isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
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

        {/* Screenshot Prefill Confirmation Banner */}
        {prefilledBadges.length > 0 && (
          <div
            role="status"
            className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs jg-text"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
              <span>
                <strong>Filled from screenshot:</strong>{' '}
                {prefilledBadges.join(', ')}. Review or edit before clicking{' '}
                <strong>Verify Offer</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrefilledBadges([])}
              className="text-xs font-semibold text-emerald-500 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="message-text-input"
                className="text-xs font-semibold jg-text"
              >
                Recruitment Message or Job Description{' '}
                <span className="text-emerald-500">*</span>
              </label>
              <span className="text-[11px] jg-text-muted">
                {messageText.length.toLocaleString()} /{' '}
                {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              id="message-text-input"
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste the WhatsApp, Telegram, or email job offer message here..."
              required
              maxLength={MAX_CHARS}
              className="w-full rounded-xl p-3.5 text-sm jg-input"
            />
          </div>

          {/* Collapsible Sender & Link Metadata */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold jg-text-muted hover:jg-text"
            >
              {showOptionalFields ? (
                <ChevronUp
                  className="h-3.5 w-3.5 text-emerald-500"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-3.5 w-3.5 text-emerald-500"
                  aria-hidden="true"
                />
              )}
              <span>
                Sender &amp; link details (Company, Recruiter Email, Vacancy URL)
              </span>
            </button>

            {showOptionalFields && (
              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="company-name-input"
                    className="block text-xs font-semibold jg-text"
                  >
                    Company / Employer Name
                  </label>
                  <input
                    id="company-name-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    maxLength={200}
                    placeholder="e.g., Infosys or TCS"
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm jg-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="recruiter-email-input"
                    className="block text-xs font-semibold jg-text"
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
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm jg-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="job-url-input"
                    className="block text-xs font-semibold jg-text"
                  >
                    Vacancy URL / Website
                  </label>
                  <input
                    id="job-url-input"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    maxLength={2048}
                    placeholder="https://careers.company.com"
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm jg-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cold-start feedback banner when cloud backend takes >4.5s */}
          {isLoading && isColdStartSlow && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border p-3 text-xs jg-warning-box"
            >
              <Clock
                className="mt-0.5 h-4 w-4 shrink-0 animate-pulse"
                aria-hidden="true"
              />
              <div>
                <strong>Waking up cloud server:</strong> The free-tier backend
                is starting up (~25–40 seconds on the first check). Subsequent
                checks complete in under a second.
              </div>
            </div>
          )}

          {(validationError || errorMessage) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border p-3 text-xs sm:text-sm jg-danger-box"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <div>{validationError || errorMessage}</div>
            </div>
          )}

          {/* Compact Bottom Options & Action Bar */}
          <div className="flex flex-col justify-between gap-3 border-t jg-border pt-3.5 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-4 text-xs jg-text-muted">
              <label className="inline-flex cursor-pointer items-center gap-1.5 jg-text">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                />
                <Sparkles
                  className="h-3.5 w-3.5 text-emerald-500"
                  aria-hidden="true"
                />
                <span>AI summary</span>
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5 jg-text">
                <input
                  id="save-report-toggle"
                  type="checkbox"
                  checked={saveReport}
                  onChange={(e) => setSaveReport(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                />
                <BookmarkCheck
                  className="h-3.5 w-3.5 text-emerald-500"
                  aria-hidden="true"
                />
                <span>Save report</span>
              </label>

              {!user && saveReport && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="text-emerald-500 font-semibold underline"
                >
                  Sign in to save
                </button>
              )}

              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] jg-text-muted">
                <Lock className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                <span>Aadhaar, PAN &amp; OTPs auto-masked</span>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border jg-border jg-surface-elevated px-3.5 py-2 text-xs font-semibold jg-text transition hover:opacity-90 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Form</span>
              </button>

              <button
                id="analyze-submit-btn"
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-950/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
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
      </div>
    </section>
  );
};
