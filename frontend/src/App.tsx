import React, { useEffect, useState } from 'react';
import { Navbar, MainViewTab } from './components/Navbar';
import { Hero } from './components/Hero';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisResultView } from './components/AnalysisResultView';
import { EducationalSections } from './components/EducationalSections';
import { AuthModal } from './components/AuthModal';
import { HistoryPanel } from './components/HistoryPanel';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
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

  const [activeTab, setActiveTab] = useState<MainViewTab>('analyze');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedSample, setSelectedSample] = useState<SampleMessage | null>(
    BUILTIN_SAMPLES[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isColdStartSlow, setIsColdStartSlow] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  // Trigger a single non-blocking health warm-up when a user/judge opens the app
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={signOut}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="flex-1">
        {activeTab === 'analyze' && <Hero />}

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
              />

              {result && <AnalysisResultView result={result} />}
            </>
          )}
        </div>
      </main>

      <Footer onSelectTab={setActiveTab} />

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
