-- =============================================================================
-- JobGuard AI — Local Job Scam and Vacancy Verifier (AI-04)
-- Supabase PostgreSQL Schema & Row Level Security (RLS) Migration
-- =============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create the `analyses` table for private user report history
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL CHECK (char_length(input_text) >= 10 AND char_length(input_text) <= 12000),
    company_name TEXT CHECK (company_name IS NULL OR char_length(company_name) <= 200),
    recruiter_email TEXT CHECK (recruiter_email IS NULL OR char_length(recruiter_email) <= 254),
    job_url TEXT CHECK (job_url IS NULL OR char_length(job_url) <= 2048),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (
        risk_level IN (
            'Lower Risk Indicator',
            'Moderate Risk Indicator',
            'High Risk Indicator',
            'Very High Risk Indicator'
        )
    ),
    summary TEXT NOT NULL,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis_mode TEXT NOT NULL DEFAULT 'deterministic_only' CHECK (
        analysis_mode IN ('deterministic_only', 'deterministic_plus_ai')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add performance indexes for user history lookups
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_created_at
    ON public.analyses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_risk_level
    ON public.analyses (risk_level);

-- 3. Enable Row Level Security (RLS) strictly on `public.analyses`
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses FORCE ROW LEVEL SECURITY;

-- 4. Revoke anonymous access to private reports
REVOKE ALL ON public.analyses FROM anon;
GRANT SELECT, INSERT, DELETE ON public.analyses TO authenticated;

-- 5. RLS Policy: Authenticated users may read ONLY their own analysis reports
DROP POLICY IF EXISTS "Users can view only their own analyses" ON public.analyses;
CREATE POLICY "Users can view only their own analyses"
    ON public.analyses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. RLS Policy: Authenticated users may insert ONLY records belonging to their own auth.uid()
DROP POLICY IF EXISTS "Users can insert only their own analyses" ON public.analyses;
CREATE POLICY "Users can insert only their own analyses"
    ON public.analyses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policy: Authenticated users may delete ONLY their own analysis reports
DROP POLICY IF EXISTS "Users can delete only their own analyses" ON public.analyses;
CREATE POLICY "Users can delete only their own analyses"
    ON public.analyses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Note: No UPDATE policy is granted so historical analysis records remain immutable per user.
