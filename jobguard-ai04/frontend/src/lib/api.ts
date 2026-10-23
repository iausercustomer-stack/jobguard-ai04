import {
  AnalyzeRequestPayload,
  AnalyzeResponse,
  HealthResponse,
  SavedReportRecord,
} from '../types';

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

// In production builds, strictly use VITE_API_BASE_URL so no localhost/127.0.0.1 URLs are called.
// In local development (import.meta.env.DEV), default to http://127.0.0.1:8000 if unset.
export const API_BASE_URL =
  configuredBaseUrl || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

// 60-second timeout accommodates Render free-tier cold-start delays (~30-50s after inactivity)
export const ANALYZE_TIMEOUT_MS = 60000;
export const COLD_START_NOTICE_MS = 4500;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function ensureApiBaseConfigured(): string {
  if (!API_BASE_URL) {
    throw new ApiError(
      'Backend API URL is not configured. Set VITE_API_BASE_URL to your deployed Render HTTPS URL in Vercel environment variables and redeploy.',
      0
    );
  }
  return API_BASE_URL;
}

export async function checkBackendHealthApi(): Promise<HealthResponse> {
  const baseUrl = ensureApiBaseConfigured();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(`Health check returned HTTP ${response.status}.`, response.status);
    }
    return (await response.json()) as HealthResponse;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function analyzeVacancyApi(
  payload: AnalyzeRequestPayload,
  accessToken?: string | null,
  onColdStartNotice?: (isSlow: boolean) => void
): Promise<AnalyzeResponse> {
  const baseUrl = ensureApiBaseConfigured();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
  const slowNoticeId = window.setTimeout(() => {
    if (onColdStartNotice) {
      onColdStartNotice(true);
    }
  }, COLD_START_NOTICE_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Forward authentication token only when saving a report is requested
  if (payload.save_report && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Backend returned HTTP ${response.status}.`;
      try {
        const errJson = await response.json();
        if (errJson && typeof errJson.detail === 'string') {
          detail = errJson.detail;
        }
      } catch {
        // Ignore JSON parse error on non-JSON error body
      }
      throw new ApiError(detail, response.status);
    }

    const data: AnalyzeResponse = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(
        'The backend took longer than 60 seconds to respond (likely waking up from free-tier hosting sleep). Please click "Analyze Vacancy Risk" once more now that the instance is warming up.',
        408
      );
    }
    throw new ApiError(
      `Unable to reach the JobGuard AI backend (${baseUrl}). Verify the backend service is running and that CORS_ORIGINS includes this frontend origin.`,
      0
    );
  } finally {
    window.clearTimeout(timeoutId);
    window.clearTimeout(slowNoticeId);
    if (onColdStartNotice) {
      onColdStartNotice(false);
    }
  }
}

export async function fetchMyReportsApi(
  accessToken: string
): Promise<SavedReportRecord[]> {
  const baseUrl = ensureApiBaseConfigured();
  const response = await fetch(`${baseUrl}/api/reports?limit=20`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let detail = `Unable to fetch saved reports (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.detail === 'string') {
        detail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as SavedReportRecord[];
}
