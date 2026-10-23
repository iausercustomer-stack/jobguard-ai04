export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskCategory =
  | 'Lower Risk Indicator'
  | 'Moderate Risk Indicator'
  | 'High Risk Indicator'
  | 'Very High Risk Indicator';

export type VerificationStatus =
  | 'verified_official_domain'
  | 'impersonation_warning'
  | 'domain_aligned'
  | 'third_party_ats'
  | 'domain_mismatch'
  | 'unverified'
  | 'invalid_url'
  | 'verification_unavailable';

export interface AnalyzeRequestPayload {
  message_text: string;
  company_name?: string | null;
  recruiter_email?: string | null;
  job_url?: string | null;
  use_ai: boolean;
  save_report: boolean;
}

export interface Finding {
  code: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  points: number;
  evidence: string;
  explanation: string;
  recommendation: string;
}

export interface DomainComparison {
  compared: boolean;
  email_domain?: string | null;
  url_hostname?: string | null;
  url_root_domain?: string | null;
  relationship:
    | 'not_applicable'
    | 'exact_match'
    | 'subdomain_match'
    | 'known_ats_platform'
    | 'free_email_with_corporate_url'
    | 'different_domains';
  explanation: string;
}

export interface OfficialRegistryCheck {
  checked: boolean;
  matched_employer?: string | null;
  official_domains: string[];
  official_careers_url?: string | null;
  status: VerificationStatus;
  note: string;
  checked_at: string;
}

export interface VerificationReport {
  url_provided: boolean;
  url_valid: boolean;
  normalized_url?: string | null;
  normalized_hostname?: string | null;
  root_domain?: string | null;
  is_https: boolean;
  is_shortened_url: boolean;
  url_warnings: string[];
  email_provided: boolean;
  email_valid: boolean;
  email_domain?: string | null;
  is_free_email_provider: boolean;
  domain_comparison: DomainComparison;
  registry_check: OfficialRegistryCheck;
  verification_status: VerificationStatus;
  verification_summary: string;
  manual_verification_steps: string[];
}

export interface AIExplanationPayload {
  plain_language_summary: string;
  key_questions_to_ask_recruiter: string[];
  independent_verification_tips: string[];
  caution_note: string;
}

export interface AIStatusReport {
  requested: boolean;
  used: boolean;
  provider_configured: boolean;
  model?: string | null;
  fallback_reason?: string | null;
  explanation?: AIExplanationPayload | null;
}

export interface ReportPersistenceStatus {
  requested: boolean;
  saved: boolean;
  report_id?: string | null;
  error?: string | null;
}

export interface AnalyzeResponse {
  risk_score: number;
  risk_category: RiskCategory;
  category_explanation: string;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  verification: VerificationReport;
  analysis_mode: 'deterministic_only' | 'deterministic_plus_ai';
  ai_status: AIStatusReport;
  persistence: ReportPersistenceStatus;
  redacted_preview: string;
  redaction_count: number;
  redaction_types: string[];
  analyzed_at: string;
  methodology_note: string;
  uncertainty_disclaimer: string;
}

export interface SampleMessage {
  id: string;
  label: string;
  kind: 'suspicious' | 'legitimate' | 'ambiguous';
  company_name: string;
  recruiter_email: string;
  job_url: string;
  message_text: string;
  expected_note: string;
}

export interface SavedReportRecord {
  id: string;
  user_id: string;
  company_name?: string | null;
  recruiter_email?: string | null;
  job_url?: string | null;
  input_text: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  analysis_mode: string;
  created_at: string;
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  deterministic_engine: 'ready';
  ai_layer_configured: boolean;
  supabase_configured: boolean;
  max_input_chars: number;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  accessToken: string;
}
