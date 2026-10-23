import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, AlertTriangle, CheckCircle2, Loader2, Sparkles, Shield, FileImage, ArrowRight } from 'lucide-react';
import {
  ExtractedScreenshotFields,
  extractStructuredJobFields,
  generateDemoScamScreenshotFile,
  runLocalScreenshotOcr,
  validateScreenshotFile,
} from '../lib/ocrExtractor';

export interface PrefillFormPayload {
  message_text: string;
  company_name: string;
  recruiter_email: string;
  job_url: string;
  filled_fields: string[];
}

interface ScreenshotOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasExistingFormInput: boolean;
  onApplyPrefill: (payload: PrefillFormPayload) => void;
}

export const ScreenshotOcrModal: React.FC<ScreenshotOcrModalProps> = ({
  isOpen,
  onClose,
  hasExistingFormInput,
  onApplyPrefill,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [extracted, setExtracted] = useState<ExtractedScreenshotFields | null>(null);
  const [editMessage, setEditMessage] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editUrl, setEditUrl] = useState<string>('');
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName('');
    setValidationError(null);
    setIsProcessing(false);
    setProgressPct(0);
    setExtracted(null);
    setEditMessage('');
    setEditCompany('');
    setEditEmail('');
    setEditUrl('');
    setConfirmOverwrite(false);
  };

  const processSelectedFile = async (file: File, fallbackDemoText?: string) => {
    setValidationError(null);
    setExtracted(null);
    setConfirmOverwrite(false);
    const err = validateScreenshotFile(file);
    if (err) {
      setValidationError(err);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setIsProcessing(true);
    setProgressPct(15);

    try {
      const fields = await runLocalScreenshotOcr(file, (pct) => setProgressPct(pct));
      setExtracted(fields);
      setEditMessage(fields.message_text);
      setEditCompany(fields.company_name);
      setEditEmail(fields.recruiter_email);
      setEditUrl(fields.job_url);
    } catch (ocrErr: unknown) {
      if (fallbackDemoText) {
        const fb = extractStructuredJobFields(fallbackDemoText);
        setExtracted(fb);
        setEditMessage(fb.message_text);
        setEditCompany(fb.company_name);
        setEditEmail(fb.recruiter_email);
        setEditUrl(fb.job_url);
      } else {
        setValidationError(ocrErr instanceof Error ? ocrErr.message : 'OCR extraction failed.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const executeFillForm = () => {
    const filledFields: string[] = [];
    if (editMessage.trim()) filledFields.push('Recruitment Message');
    if (editCompany.trim()) filledFields.push('Company Name');
    if (editEmail.trim()) filledFields.push('Recruiter Email');
    if (editUrl.trim()) filledFields.push('Job URL');
    onApplyPrefill({
      message_text: editMessage.trim(),
      company_name: editCompany.trim(),
      recruiter_email: editEmail.trim(),
      job_url: editUrl.trim(),
      filled_fields: filledFields,
    });
    resetState();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border jg-surface shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        <div className="p-5 sm:p-6 max-h-[88vh] overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3 border-b jg-border pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="ocr-modal-title" className="text-base font-bold jg-text">
                  Upload a screenshot of a job offer
                </h2>
                <p className="text-xs jg-text-muted">
                  Local browser OCR · Separate from the backend scam verification engine
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetState();
                onClose();
              }}
              aria-label="Close screenshot dialog"
              className="rounded-lg p-1.5 jg-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border jg-border jg-surface-elevated p-3 text-xs jg-text-muted">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <strong className="jg-text">Privacy-First Local OCR:</strong> Processed in your browser and never uploaded to Supabase or external storage.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-dashed jg-border jg-surface-elevated p-4">
            <div className="flex items-center gap-3">
              <FileImage className="h-8 w-8 shrink-0 text-emerald-500" />
              <div>
                <div className="text-xs sm:text-sm font-semibold jg-text">
                  {fileName || 'Select a WhatsApp, Telegram, or Email screenshot'}
                </div>
                <div className="text-[11px] jg-text-muted">PNG, JPG/JPEG, WebP · Max 10 MB</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processSelectedFile(f);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Choose Image</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { file, fallbackText } = await generateDemoScamScreenshotFile();
                  await processSelectedFile(file, fallbackText);
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl border jg-border jg-surface px-3 py-2 text-xs font-semibold jg-text"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <span>Try Sample Screenshot</span>
              </button>
            </div>
          </div>

          {previewUrl && (
            <div className="space-y-2 rounded-xl border jg-border jg-surface-elevated p-3">
              <div className="max-h-40 overflow-hidden rounded-lg border jg-border bg-black/20 flex items-center justify-center">
                <img src={previewUrl} alt="Uploaded screenshot preview" className="max-h-36 w-auto object-contain" />
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-emerald-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Extracting text locally ({progressPct}%)...</span>
                </div>
              )}
            </div>
          )}

          {validationError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border p-3 text-xs jg-danger-box">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {extracted && !isProcessing && (
            <div className="space-y-3.5 rounded-xl border jg-border jg-surface-elevated p-4">
              <div className="flex items-center justify-between border-b jg-border pb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold jg-text">We found these details in your screenshot.</h3>
                </div>
                <span className="text-[11px] jg-text-muted">Review &amp; edit before filling</span>
              </div>

              <div>
                <label className="block text-xs font-semibold jg-text mb-1">Recruitment Message</label>
                <textarea
                  rows={3}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full rounded-xl p-2.5 text-xs jg-input"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold jg-text mb-1">
                    Company Name ({extracted.company_confidence === 'detected' ? 'Detected' : 'Confirm'})
                  </label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full rounded-xl px-2.5 py-1.5 text-xs jg-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold jg-text mb-1">Recruiter Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl px-2.5 py-1.5 text-xs jg-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold jg-text mb-1">Job URL</label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full rounded-xl px-2.5 py-1.5 text-xs jg-input"
                  />
                </div>
              </div>

              {confirmOverwrite && (
                <div className="flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs jg-warning-box">
                  <span>Replace existing form fields with these screenshot details?</span>
                  <button
                    type="button"
                    onClick={executeFillForm}
                    className="rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white"
                  >
                    Confirm &amp; Fill
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t jg-border pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    resetState();
                    onClose();
                  }}
                  className="rounded-xl border jg-border jg-surface px-3.5 py-1.5 text-xs font-semibold jg-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hasExistingFormInput && !confirmOverwrite) {
                      setConfirmOverwrite(true);
                      return;
                    }
                    executeFillForm();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <span>Fill Form</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
