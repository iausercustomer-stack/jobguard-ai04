import React, { useEffect, useState } from 'react';
import { Compass, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { MainViewTab } from './Navbar';

export const TOUR_STEPS = [
  {
    id: 'step-form',
    targetId: 'analyzer-form',
    title: '1. Check Offer Workspace',
    description: 'This is the main verification form where you can evaluate any suspicious job message, offer email, or recruitment link.',
  },
  {
    id: 'step-message',
    targetId: 'message-text-input',
    title: '2. Paste the Recruitment Message',
    description: 'Paste the full WhatsApp, Telegram, or email text here. Our engine scans for 10 scam patterns and masks Aadhaar, PAN, and OTP numbers.',
  },
  {
    id: 'step-company',
    targetId: 'company-name-input',
    title: '3. Enter Company / Employer Name',
    description: 'Provide the stated company name so JobGuard AI can check for brand impersonation.',
    requireSenderDrawer: true,
  },
  {
    id: 'step-email',
    targetId: 'recruiter-email-input',
    title: '4. Add the Recruiter Email',
    description: 'Enter the sender email address to check for free webmail usage or domain mismatches.',
    requireSenderDrawer: true,
  },
  {
    id: 'step-url',
    targetId: 'job-url-input',
    title: '5. Add the Vacancy Website / Link',
    description: 'Paste any application link from the message for safe static domain inspection.',
    requireSenderDrawer: true,
  },
  {
    id: 'step-submit',
    targetId: 'analyze-submit-btn',
    title: '6. Click Verify Offer',
    description: 'Click "Verify Offer" to run the deterministic scam analysis engine on the backend.',
  },
  {
    id: 'step-results',
    targetId: 'results-heading',
    title: '7. Review Your Risk Score & Evidence',
    description: 'Your 0–100 heuristic risk score, extracted evidence snippets, and verification checklist appear right below.',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: MainViewTab) => void;
  onExpandSenderFields: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onExpandSenderFields,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      document.querySelectorAll('.jg-tour-highlight').forEach((el) => el.classList.remove('jg-tour-highlight'));
      return;
    }
    onSelectTab('analyze');
    const step = TOUR_STEPS[stepIndex];
    if (step.requireSenderDrawer) onExpandSenderFields();

    const timer = window.setTimeout(() => {
      document.querySelectorAll('.jg-tour-highlight').forEach((el) => el.classList.remove('jg-tour-highlight'));
      const target = document.getElementById(step.targetId) || document.getElementById('analyzer-form');
      if (target) {
        target.classList.add('jg-tour-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      document.querySelectorAll('.jg-tour-highlight').forEach((el) => el.classList.remove('jg-tour-highlight'));
    };
  }, [isOpen, stepIndex]);

  if (!isOpen) return null;
  const currentStep = TOUR_STEPS[stepIndex];

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Interactive Guided Tour"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border jg-surface p-4 shadow-2xl sm:left-auto sm:right-6"
    >
      <div className="flex items-center justify-between gap-2 border-b jg-border pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Guided Tour · Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <h3 className="text-sm font-bold jg-text">{currentStep.title}</h3>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close tutorial" className="rounded-lg p-1 jg-text-muted">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2.5 text-xs sm:text-sm jg-text-muted leading-relaxed">{currentStep.description}</p>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t jg-border pt-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            className="inline-flex items-center gap-1 rounded-lg border jg-border jg-surface-elevated px-2.5 py-1.5 font-medium jg-text-muted"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restart</span>
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1.5 font-medium jg-text-muted">
            Skip
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 rounded-lg border jg-border jg-surface-elevated px-3 py-1.5 font-semibold jg-text disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>
          {stepIndex < TOUR_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-semibold text-white hover:bg-emerald-500"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-semibold text-white hover:bg-emerald-500"
            >
              <span>Finish Tour</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
