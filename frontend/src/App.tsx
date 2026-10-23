import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
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

  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
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
      // Non-fatal on initial load; actual errors are surfaced on form submission
    });
  }, []);

  const handleLoadSample = (sampleId: string) => {
    const found =
      BUILTIN_SAMPLES.find((s) => s.id === sampleId) || BUILTIN_SAMPLES[0];
    setSelectedSample({ ...found });
    setActiveTab('analyze');
    setApiError(null);
    const formEl = document.getElementById('analyzer-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleJumpToForm = () => {
    setActiveTab('analyze');
    const formEl = document.getElementById('analyzer-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    <div className="min-h-screen flex flex-col bg-[#07120e] text-slate-100">
      <Navbar
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={signOut}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="flex-1">
        <Hero
          onLoadSample={handleLoadSample}
          onJumpToForm={handleJumpToForm}
        />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          {activeTab === 'history' ? (
            <HistoryPanel
              user={user}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          ) : (
            <>
              <AnalysisForm
                onSubmit={handleSubmitAnalysis}
                isLoading={isLoading}
                isColdStartSlow={isColdStartSlow}
                errorMessage={apiError}
                user={user}
                selectedSample={selectedSample}
                onClearSample={() => setSelectedSample(null)}
                onOpenAuthModal={() => setAuthModalOpen(true)}
              />

              {result && <AnalysisResultView result={result} />}

              <EducationalSections />
            </>
          )}
        </div>
      </main>

      <Footer />

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
