import React, { useEffect, useState } from 'react';
import { HelpCircle, X, Compass, Camera, ShieldAlert, BookmarkCheck, FileQuestion, Sparkles, ArrowRight } from 'lucide-react';
import { AnalyzeResponse, AuthUser } from '../types';
import { MainViewTab } from './Navbar';

interface HelpAssistantProps {
  activeTab: MainViewTab;
  onSelectTab: (tab: MainViewTab) => void;
  result: AnalyzeResponse | null;
  apiError: string | null;
  user: AuthUser | null;
  onOpenAuthModal: () => void;
  onStartGuidedTour: () => void;
  onOpenScreenshotModal: () => void;
  onExpandSenderFields: () => void;
}

export const HelpAssistant: React.FC<HelpAssistantProps> = ({
  activeTab,
  onSelectTab,
  result,
  apiError,
  user,
  onOpenAuthModal,
  onStartGuidedTour,
  onOpenScreenshotModal,
  onExpandSenderFields,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('welcome');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          id="need-help-floating-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Need Help? Open JobGuard AI Assistant"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition hover:from-emerald-500 hover:to-teal-500"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Need Help?</span>
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-header-title"
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-5 z-50 w-auto sm:w-[400px] max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border jg-surface shadow-2xl"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          <div className="flex items-center justify-between gap-2 border-b jg-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 id="assistant-header-title" className="text-sm font-bold jg-text">
                  JobGuard AI Assistant
                </h2>
                <span className="text-[11px] font-medium text-emerald-500">
                  {apiError
                    ? 'Connection Help'
                    : activeTab === 'analyze'
                    ? 'Viewing: Check Offer'
                    : activeTab === 'guide'
                    ? 'Viewing: Safety Guide'
                    : 'Viewing: Saved Reports'}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant" className="rounded-lg p-1 jg-text-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
            <div className="rounded-xl border jg-border jg-surface-elevated p-3 jg-text leading-relaxed">
              Hi! I can help you understand job scams, navigate JobGuard AI, or extract details from a job-offer screenshot.
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onStartGuidedTour();
                }}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span>How do I check a job offer?</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenScreenshotModal();
                }}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-500" />
                  <span>Upload a screenshot.</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTopic('explain-score')}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-emerald-500" />
                  <span>Explain my risk score.</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('analyze');
                  onExpandSenderFields();
                  setSelectedTopic('help-fill');
                }}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>Help me fill the form.</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTopic('save-report')}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-emerald-500" />
                  <span>How do I save a report?</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTopic('suspicious-action')}
                className="flex items-center justify-between rounded-xl border jg-border jg-surface-elevated px-3 py-2 text-left text-xs font-semibold jg-text hover:border-emerald-500"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>What should I do if a job looks suspicious?</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 jg-text-muted" />
              </button>
            </div>

            {selectedTopic === 'explain-score' && (
              <div className="rounded-xl border jg-border jg-surface-elevated p-3 text-xs space-y-1">
                <strong className="jg-text">Understanding Your 0–100 Risk Score</strong>
                <p className="jg-text-muted">
                  {result
                    ? `Current score: ${result.risk_score}/100 (${result.risk_category}).`
                    : 'Scores run from 0–19 (Lower), 20–44 (Moderate), 45–69 (High), to 70–100 (Very High).'}
                </p>
              </div>
            )}

            {selectedTopic === 'help-fill' && (
              <div className="rounded-xl border jg-border jg-surface-elevated p-3 text-xs space-y-1">
                <strong className="jg-text">Filling the Form</strong>
                <p className="jg-text-muted">
                  Paste the job message text, then enter Company Name, Recruiter Email, and Vacancy URL.
                </p>
              </div>
            )}

            {selectedTopic === 'save-report' && (
              <div className="rounded-xl border jg-border jg-surface-elevated p-3 text-xs space-y-2">
                <strong className="jg-text">Saving Reports Privately</strong>
                <p className="jg-text-muted">
                  Sign in and check &ldquo;Save report&rdquo; before clicking Verify Offer.
                </p>
                {!user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAuthModal();
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white"
                  >
                    Sign In Now
                  </button>
                )}
              </div>
            )}

            {selectedTopic === 'suspicious-action' && (
              <div className="rounded-xl border jg-border jg-surface-elevated p-3 text-xs space-y-1">
                <strong className="jg-text">If an Offer Looks Suspicious</strong>
                <p className="jg-text-muted">
                  Refuse all fee demands, never share OTPs/UPI PINs, verify on mca.gov.in, and call 1930 (cybercrime.gov.in) if fraud occurred.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
