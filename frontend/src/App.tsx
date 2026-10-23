import React, { useEffect, useState } from 'react';
import { Navbar, MainViewTab } from './components/Navbar';
import { Hero } from './components/Hero';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisResultView } from './components/AnalysisResultView';
import { EducationalSections } from './components/EducationalSections';
import { AuthModal } from './components/AuthModal';
import { HistoryPanel } from './components/HistoryPanel';
import { Footer } from './components/Footer';
import { HelpAssistant } from './components/HelpAssistant';
import { GuidedTour } from './components/GuidedTour';
import {
  ScreenshotOcrModal,
  PrefillFormPayload,
} from './components/ScreenshotOcrModal';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';
import { analyzeVacancyApi, checkBackendHealthApi } from './lib/api';
import { BUILTIN_SAMPLES } from './lib/samples';
import {
  AnalyzeRequestPayload,
  AnalyzeResponse,
  SampleMessage,
} from './types';

export function App() {
  const {
    user,
    authError,
    setAuthError,
    signIn,
    signUp,
    signOut,
    isSupabaseConfigured,
  } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<MainViewTab>('analyze');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedSample, setSelectedSample] = useState<SampleMessage | null>(
    BUILTIN_SAMPLES[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isColdStartSlow, setIsColdStartSlow] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  // Need Help, Guided Tour & Screenshot OCR state
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const [screenshotModalOpen, setScreenshotModalOpen] =
    useState<boolean>(false);
  const [externalPrefill, setExternalPrefill] =
    useState<PrefillFormPayload | null>(null);
  const [forceExpandSender, setForceExpandSender] = useState<boolean>(false);
  const [hasExistingFormInput, setHasExistingFormInput] =
    useState<boolean>(true);

  useEffect(() => {
    checkBackendHealthApi().catch(() => {
      // Non-fatal on initial load
    });
  }, []);

  const handleSubmitAnalysis = async (payload: AnalyzeRequestPayload) => {
    setIsLoading(true);
    setIsColdStartSlow(false);
    setApiError(null);
    try {
      const response = await analyzeVacancyApi(
        payload,
        user?.accessToken || null,
        (slow) => setIsColdStartSlow(slow)
      );
      setResult(response);
    } catch (err: unknown) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while communicating with the backend API.'
      );
    } finally {
      setIsLoading(false);
      setIsColdStartSlow(false);
    }
  };

  const handleApplyScreenshotPrefill = (payload: PrefillFormPayload) => {
    setSelectedSample(null);
    setExternalPrefill(payload);
    setActiveTab('analyze');
    setApiError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col jg-bg transition-colors duration-200">
      {/* Decorative Ambient Background Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className={`absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark
              ? 'bg-emerald-500/15 opacity-90'
              : 'bg-emerald-300/35 opacity-80'
          }`}
        />
        <div
          className={`absolute top-12 -right-28 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-teal-500/12 opacity-80' : 'bg-cyan-200/40 opacity-80'
          }`}
        />
        <svg
          className={`absolute inset-0 h-full w-full ${
            isDark ? 'opacity-[0.12]' : 'opacity-[0.28]'
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="jobguard-dot-grid"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="2"
                cy="2"
                r="1.2"
                fill={isDark ? '#34d399' : '#059669'}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jobguard-dot-grid)" />
        </svg>
      </div>

      <Navbar
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={signOut}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="relative z-10 flex-1 pb-16">
        {activeTab === 'analyze' && (
          <Hero onOpenScreenshotModal={() => setScreenshotModalOpen(true)} />
        )}

        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 space-y-6">
          {activeTab === 'history' ? (
            <HistoryPanel
              user={user}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          ) : activeTab === 'guide' ? (
            <EducationalSections />
          ) : (
            <>
              <AnalysisForm
                onSubmit={handleSubmitAnalysis}
                isLoading={isLoading}
                isColdStartSlow={isColdStartSlow}
                errorMessage={apiError}
                user={user}
                selectedSample={selectedSample}
                onSelectSample={(s) => setSelectedSample(s)}
                onClearSample={() => {
                  setSelectedSample(null);
                  setResult(null);
                }}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                onOpenScreenshotModal={() => setScreenshotModalOpen(true)}
                externalPrefill={externalPrefill}
                onClearExternalPrefill={() => setExternalPrefill(null)}
                forceExpandSender={forceExpandSender}
                onHasContentChange={setHasExistingFormInput}
              />

              {result && <AnalysisResultView result={result} />}
            </>
          )}
        </div>
      </main>

      <Footer onSelectTab={setActiveTab} />

      <HelpAssistant
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        result={result}
        apiError={apiError}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onStartGuidedTour={() => setTourOpen(true)}
        onOpenScreenshotModal={() => setScreenshotModalOpen(true)}
        onExpandSenderFields={() => setForceExpandSender(true)}
      />

      <GuidedTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onSelectTab={setActiveTab}
        onExpandSenderFields={() => setForceExpandSender(true)}
      />

      <ScreenshotOcrModal
        isOpen={screenshotModalOpen}
        onClose={() => setScreenshotModalOpen(false)}
        hasExistingFormInput={hasExistingFormInput}
        onApplyPrefill={handleApplyScreenshotPrefill}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
        authError={authError}
        clearAuthError={() => setAuthError(null)}
        isSupabaseConfigured={isSupabaseConfigured}
      />
    </div>
  );
}

export default App;
