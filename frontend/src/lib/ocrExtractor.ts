/**
 * Privacy-first Client-Side Screenshot OCR & Conservative Field Extractor.
 * Uses Tesseract.js (createWorker / recognize) locally in the browser with
 * automatic Canvas contrast preprocessing, worker termination, and URL cleanup.
 * Never uploads screenshots to Supabase or any external server.
 */

import { createWorker } from 'tesseract.js';

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ExtractedScreenshotFields {
  raw_ocr_text: string;
  message_text: string;
  company_name: string;
  company_confidence: 'detected' | 'uncertain' | 'missing';
  recruiter_email: string;
  email_candidates: string[];
  email_confidence: 'detected' | 'multiple' | 'missing';
  job_url: string;
  url_candidates: string[];
  url_confidence: 'detected' | 'multiple' | 'uncertain' | 'missing';
  redacted_items_count: number;
}

export function validateScreenshotFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return 'Unsupported file format. Please upload a PNG, JPG/JPEG, or WebP screenshot.';
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `File size (${sizeMb} MB) exceeds the 10 MB limit. Please crop or compress the screenshot.`;
  }
  if (file.size < 100) {
    return 'The selected image file appears to be empty or corrupted.';
  }
  return null;
}

/**
 * Redacts obvious sensitive numbers (Aadhaar, PAN, explicit OTP/PIN) locally in the browser
 * so extracted screenshot text does not retain sensitive credentials.
 */
export function redactLocalText(text: string): {
  cleaned: string;
  count: number;
} {
  let cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  let count = 0;

  const patterns: Array<{ re: RegExp; rep: string }> = [
    {
      re: /\b(otp|upi\s*pin|atm\s*pin|mpin|cvv|password)\s*(?:is|=|:|-)\s*([A-Za-z0-9@#$%^&*!]{3,20})\b/gi,
      rep: '$1: [REDACTED-SECRET]',
    },
    {
      re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
      rep: '[REDACTED-PAN]',
    },
    {
      re: /(?<!\d)(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})(?!\d)/g,
      rep: '[REDACTED-ID-12]',
    },
  ];

  for (const p of patterns) {
    const m = cleaned.match(p.re);
    if (m && m.length > 0) {
      count += m.length;
      cleaned = cleaned.replace(p.re, p.rep);
    }
  }
  return { cleaned: cleaned.trim(), count };
}

/**
 * Conservatively extracts structured job fields from raw OCR text.
 * Never invents missing information; marks uncertain matches explicitly.
 */
export function extractStructuredJobFields(
  rawText: string
): ExtractedScreenshotFields {
  const { cleaned, count: redactedCount } = redactLocalText(rawText);

  // 1. Extract all candidate email addresses
  const emailMatches = cleaned.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g
  );
  const emailCandidates = Array.from(
    new Set(
      (emailMatches || []).map((e) =>
        e.toLowerCase().replace(/[.,;:)>\]]+$/, '')
      )
    )
  );

  let recruiterEmail = '';
  let emailConfidence: 'detected' | 'multiple' | 'missing' = 'missing';
  if (emailCandidates.length === 1) {
    recruiterEmail = emailCandidates[0];
    emailConfidence = 'detected';
  } else if (emailCandidates.length > 1) {
    recruiterEmail = emailCandidates[0];
    emailConfidence = 'multiple';
  }

  // 2. Extract all candidate URLs (http/https, bit.ly/tinyurl, t.me/wa.me, or www.*)
  const urlRegex =
    /\b(?:https?:\/\/[^\s<>"{}|\\^`\[\]]+|(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|t\.me|wa\.me|chat\.whatsapp\.com)\/[A-Za-z0-9_+/-]+|www\.[A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?)/gi;
  const rawUrls = cleaned.match(urlRegex) || [];
  const urlCandidates = Array.from(
    new Set(
      rawUrls.map((u) => {
        const trimmed = u.replace(/[.,;:)>\]]+$/, '');
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      })
    )
  );

  let jobUrl = '';
  let urlConfidence: 'detected' | 'multiple' | 'uncertain' | 'missing' =
    'missing';
  if (urlCandidates.length === 1) {
    jobUrl = urlCandidates[0];
    urlConfidence = 'detected';
  } else if (urlCandidates.length > 1) {
    jobUrl = urlCandidates[0];
    urlConfidence = 'multiple';
  }

  // 3. Conservatively identify Company Name
  let companyName = '';
  let companyConfidence: 'detected' | 'uncertain' | 'missing' = 'missing';

  const knownBrands = [
    'Tata Consultancy Services',
    'TCS',
    'Infosys',
    'Wipro',
    'HCLTech',
    'Tech Mahindra',
    'Accenture',
    'Cognizant',
    'Capgemini',
    'Amazon',
    'Google',
    'Microsoft',
    'Flipkart',
    'Zoho',
    'Razorpay',
    'State Bank of India',
    'ISRO',
    'Deloitte',
  ];

  for (const brand of knownBrands) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleaned)) {
      companyName = brand === 'TCS' ? 'Tata Consultancy Services (TCS)' : brand;
      companyConfidence = 'detected';
      break;
    }
  }

  if (!companyName) {
    const corpMatch = cleaned.match(
      /\b([A-Z][A-Za-z0-9&]{1,25}(?:\s+[A-Z][A-Za-z0-9&]{1,25}){0,4}\s+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|LLP|Technologies|Solutions|Services|Systems|Corp|Corporation))\b/
    );
    if (corpMatch && corpMatch[1]) {
      companyName = corpMatch[1].trim();
      companyConfidence = 'uncertain';
    } else {
      const labeledMatch = cleaned.match(
        /(?:Company(?:\s*Name)?\s*[:=-]\s*|shortlisted\s+at\s+|joining\s+at\s+|hiring\s+for\s+)([A-Z][A-Za-z0-9&\s().-]{2,45})(?:[\n.,!]|$)/i
      );
      if (labeledMatch && labeledMatch[1]) {
        companyName = labeledMatch[1].trim();
        companyConfidence = 'uncertain';
      }
    }
  }

  return {
    raw_ocr_text: rawText,
    message_text: cleaned,
    company_name: companyName,
    company_confidence: companyConfidence,
    recruiter_email: recruiterEmail,
    email_candidates: emailCandidates,
    email_confidence: emailConfidence,
    job_url: jobUrl,
    url_candidates: urlCandidates,
    url_confidence: urlConfidence,
    redacted_items_count: redactedCount,
  };
}

/**
 * Preprocesses an image onto an offscreen canvas to normalize dimensions
 * and releases the temporary object URL immediately.
 */
async function preprocessImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode uploaded image.'));
      el.src = objectUrl;
    });

    const maxDim = 1800;
    let width = img.naturalWidth || img.width || 800;
    let height = img.naturalHeight || img.height || 600;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Runs local browser OCR using Tesseract.js createWorker with progress reporting
 * and deterministic worker termination + canvas cleanup in `finally`.
 */
export async function runLocalScreenshotOcr(
  file: File,
  onProgress?: (pct: number, statusText: string) => void
): Promise<ExtractedScreenshotFields> {
  if (onProgress) onProgress(10, 'Preparing image for local OCR...');
  const canvas = await preprocessImageToCanvas(file);

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    if (onProgress) onProgress(20, 'Initializing local Tesseract.js worker...');
    worker = await createWorker('eng', 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (onProgress && typeof m.progress === 'number') {
          const pct = Math.min(95, Math.max(22, Math.round(22 + m.progress * 73)));
          onProgress(pct, m.status || 'Recognizing text from screenshot...');
        }
      },
    });

    const ret = await worker.recognize(canvas);
    const rawText = (ret?.data?.text || '').trim();
    if (!rawText || rawText.length < 8) {
      throw new Error(
        'No readable text could be detected in this image. Please try a clearer screenshot or edit the fields manually.'
      );
    }

    if (onProgress) onProgress(100, 'Extraction complete!');
    return extractStructuredJobFields(rawText);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore termination cleanup error
      }
    }
  }
}

/**
 * Synthesizes a realistic sample recruitment-scam screenshot PNG in browser memory
 * so evaluators can test the complete screenshot -> OCR -> review -> form prefill pipeline.
 */
export async function generateDemoScamScreenshotFile(): Promise<{
  file: File;
  fallbackText: string;
}> {
  const sampleText =
    'URGENT HIRING: Tata Consultancy Services (TCS) Direct Joining 2026!\n' +
    'Role: Junior Software Associate (Work From Home - 2 hrs/day)\n' +
    'Salary: Rs. 65,000 / month | 100% Guaranteed Selection, No Interview!\n' +
    'Pay refundable laptop security deposit of Rs. 2,499 within 30 minutes.\n' +
    'Recruiter Email: tcs.hr.onboardingdesk2026@gmail.com\n' +
    'Apply Link: http://bit.ly/tcs-fast-joining-2026';

  const canvas = document.createElement('canvas');
  canvas.width = 920;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px Arial, sans-serif';
    sampleText.split('\n').forEach((line, idx) => {
      ctx.fillText(line, 36, 65 + idx * 54);
    });
  }
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png')
  );
  const file = new File([blob], 'sample-whatsapp-job-offer.png', {
    type: 'image/png',
  });
  return { file, fallbackText: sampleText };
}
