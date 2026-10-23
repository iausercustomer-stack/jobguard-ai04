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

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('jobguard_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('jobguard_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  const [activeTab, setActiveTab] = useState<MainViewTab>('analyze');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedSample, setSelectedSample] = useState<SampleMessage | null>(
    BUILTIN_SAMPLES[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isColdStartSlow, setIsColdStartSlow] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

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
    <div
      className={`relative min-h-screen flex flex-col transition-colors duration-300 ${
        isDark
          ? 'bg-[#08110e] text-slate-100'
          : 'bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/60 text-slate-900'
      }`}
    >
      {/* Decorative Ambient Background Layer (Mesh Orbs + Subtle Dot Grid) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className={`absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark
              ? 'bg-emerald-500/15 opacity-90'
              : 'bg-emerald-300/40 opacity-80'
          }`}
        />
        <div
          className={`absolute top-12 -right-28 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-teal-500/12 opacity-80' : 'bg-cyan-200/45 opacity-85'
          }`}
        />
        <div
          className={`absolute -bottom-40 left-1/3 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark
              ? 'bg-emerald-600/10 opacity-75'
              : 'bg-amber-100/50 opacity-75'
          }`}
        />
        <svg
          className={`absolute inset-0 h-full w-full ${
            isDark ? 'opacity-[0.14]' : 'opacity-[0.35]'
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
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      <main className="relative z-10 flex-1">
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
