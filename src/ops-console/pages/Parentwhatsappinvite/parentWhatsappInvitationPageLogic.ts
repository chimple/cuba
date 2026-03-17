import { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { ApiHandler } from '../../../services/api/ApiHandler';
import {
  formatSmsReadyIndianPhone,
  parseIndianPhoneInput,
} from '../../utils/phoneNormalization';
import {
  fetchParentWhatsappMsg91Report,
  ParentWhatsappAnalysisResult,
  ParentWhatsappApiError,
  ParentWhatsappSendFailure,
  ParentWhatsappSmsSendResult,
  processParentWhatsappUdiseCodes,
  sendParentWhatsappMsg91Invites,
  sendParentWhatsappTemplateMessage,
  uploadParentWhatsappMedia,
} from './parentWhatsappInvitationService';

// Standard alert payload used across this page.
export type Feedback = {
  severity: 'success' | 'error' | 'info' | 'warning';
  text: string;
};

// Parsed manual phone input split into valid, duplicate, and invalid buckets.
export type ManualPhoneValidation = {
  normalizedPhones: string[];
  duplicates: string[];
  invalid: string[];
};

// Final WhatsApp send run summary shown in UI.
export type ManualSendSummary = {
  attempted: number;
  successCount: number;
  failed: ParentWhatsappSendFailure[];
};

// Returns today's date in YYYY-MM-DD for HTML date inputs.
export const getTodayDateValue = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Normalizes unknown thrown values into the common API error shape.
export const toApiError = (
  error: unknown,
  fallbackMessage: string,
): ParentWhatsappApiError => {
  if (error && typeof error === 'object') {
    const candidate = error as ParentWhatsappApiError & Error;
    return {
      message: candidate.message || fallbackMessage,
      statusCode: candidate.statusCode,
      responseText: candidate.responseText,
      exceptionMessage: candidate.exceptionMessage || candidate.message,
    };
  }

  return {
    message: fallbackMessage,
    exceptionMessage: String(error ?? ''),
  };
};

// Validates uploaded media and maps it to WhatsApp header media type.
export const getWhatsappMediaType = (
  file: File | null,
): { mediaType: 'image' | 'video' | null; error?: string } => {
  if (!file) {
    return { mediaType: null };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (
    ['png', 'jpeg', 'jpg'].includes(extension) &&
    file.size <= 5 * 1024 * 1024
  ) {
    return { mediaType: 'image' };
  }

  if (['mp4', '3gp'].includes(extension) && file.size <= 16 * 1024 * 1024) {
    return { mediaType: 'video' };
  }

  return {
    mediaType: null,
    error: t(
      'Only PNG/JPEG up to 5 MB or MP4/3GP up to 16 MB are allowed for WhatsApp media.',
    ),
  };
};

// Formats mixed table values into display-safe strings.
export const formatCellValue = (value: unknown): string => {
  if (value == null || value === '') return t('-');
  if (Array.isArray(value))
    return value.map((item) => formatCellValue(item)).join(', ');
  if (typeof value === 'boolean') return value ? t('Yes') : t('No');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Converts raw field keys to readable title-cased table headers.
export const formatHeaderLabel = (label: string): string => {
  const withSpaces = label
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!withSpaces) {
    return label;
  }

  return withSpaces
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Converts byte size into B/KB/MB text for file display.
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Renders processed UDISE list as fixed-width rows (5 per line).
export const formatProcessedUdiseRows = (udiseCodes: string[]): string => {
  if (!udiseCodes.length) {
    return t('-');
  }

  const rowSize = 5;
  const rows: string[] = [];

  for (let index = 0; index < udiseCodes.length; index += rowSize) {
    rows.push(udiseCodes.slice(index, index + rowSize).join('   '));
  }

  return rows.join('\n');
};

// Contract of all state values and handlers consumed by the page component.
export type ParentWhatsappInvitationPageLogic = {
  uploadInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isWhatsappMode: boolean;
  setIsWhatsappMode: React.Dispatch<React.SetStateAction<boolean>>;
  showMsg91Report: boolean;
  setShowMsg91Report: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingFile: boolean;
  setIsDraggingFile: React.Dispatch<React.SetStateAction<boolean>>;
  udiseInput: string;
  setUdiseInput: React.Dispatch<React.SetStateAction<string>>;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  analysisResult: ParentWhatsappAnalysisResult | null;
  analysisFeedback: Feedback | null;
  isAnalyzing: boolean;
  isSendingSms: boolean;
  smsFeedback: Feedback | null;
  smsResult: ParentWhatsappSmsSendResult | null;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  reportRows: Record<string, unknown>[];
  reportFeedback: Feedback | null;
  isLoadingReport: boolean;
  phoneInput: string;
  setPhoneInput: React.Dispatch<React.SetStateAction<string>>;
  templateName: string;
  setTemplateName: React.Dispatch<React.SetStateAction<string>>;
  templateLang: string;
  setTemplateLang: React.Dispatch<React.SetStateAction<string>>;
  messageType: 'utility' | 'marketing';
  setMessageType: React.Dispatch<React.SetStateAction<'utility' | 'marketing'>>;
  uploadedMedia: File | null;
  setUploadedMedia: React.Dispatch<React.SetStateAction<File | null>>;
  manualValidation: ManualPhoneValidation;
  manualFeedback: Feedback | null;
  isSendingWhatsapp: boolean;
  whatsappProgress: number;
  manualSendSummary: ManualSendSummary | null;
  handleAnalyze: () => Promise<void>;
  handleSendSmsInvites: () => Promise<void>;
  handleFetchReport: () => Promise<void>;
  handleFileSelect: (fileList: FileList | null) => void;
  handleSendWhatsapp: () => Promise<void>;
};

// Main page hook that drives analysis, report, invite send, and WhatsApp flows.
export const useParentWhatsappInvitationPageLogic =
  (): ParentWhatsappInvitationPageLogic => {
    const api: ApiHandler | null = ServiceConfig.getI()?.apiHandler ?? null;
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    const [isWhatsappMode, setIsWhatsappMode] = useState(false);
    const [showMsg91Report, setShowMsg91Report] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const [udiseInput, setUdiseInput] = useState('');
    const [limit, setLimit] = useState(300);
    const [analysisResult, setAnalysisResult] =
      useState<ParentWhatsappAnalysisResult | null>(null);
    const [analysisFeedback, setAnalysisFeedback] = useState<Feedback | null>(
      null,
    );
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [isSendingSms, setIsSendingSms] = useState(false);
    const [smsFeedback, setSmsFeedback] = useState<Feedback | null>(null);
    const [smsResult, setSmsResult] =
      useState<ParentWhatsappSmsSendResult | null>(null);

    const [startDate, setStartDate] = useState(getTodayDateValue());
    const [endDate, setEndDate] = useState(getTodayDateValue());
    const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
    const [reportFeedback, setReportFeedback] = useState<Feedback | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    const [phoneInput, setPhoneInput] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [templateLang, setTemplateLang] = useState('');
    const [messageType, setMessageType] = useState<'utility' | 'marketing'>(
      'utility',
    );
    const [uploadedMedia, setUploadedMedia] = useState<File | null>(null);
    const [manualValidation, setManualValidation] =
      useState<ManualPhoneValidation>({
        normalizedPhones: [],
        duplicates: [],
        invalid: [],
      });
    const [manualFeedback, setManualFeedback] = useState<Feedback | null>(null);
    const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
    const [whatsappProgress, setWhatsappProgress] = useState(0);
    const [manualSendSummary, setManualSendSummary] =
      useState<ManualSendSummary | null>(null);

    useEffect(() => {
      setManualValidation(parseIndianPhoneInput(phoneInput));
    }, [phoneInput]);

    const handleAnalyze = async (): Promise<void> => {
      const parsedUdiseCodes = udiseInput
        .replace(/,/g, '\n')
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean);
      const udiseCodes = Array.from(new Set(parsedUdiseCodes));

      if (!api) {
        setAnalysisFeedback({
          severity: 'error',
          text: t('API service is not ready yet in this session.'),
        });
        return;
      }

      if (udiseCodes.length === 0) {
        setAnalysisFeedback({
          severity: 'warning',
          text: t('Enter at least one UDISE code before running analysis.'),
        });
        return;
      }

      try {
        setIsAnalyzing(true);
        setSmsResult(null);
        setSmsFeedback(null);
        const result = await processParentWhatsappUdiseCodes({
          api,
          udiseCodes,
          limit: Math.max(1, Number(limit) || 1),
        });
        setAnalysisResult(result);
        setAnalysisFeedback({
          severity: 'success',
          text: t('Analysis complete. {{count}} invite rows are ready.', {
            count: result.inviteList.length,
          }),
        });
      } catch (error) {
        const apiError = toApiError(error, t('Failed to process UDISE codes.'));
        setAnalysisFeedback({
          severity: 'error',
          text: apiError.message,
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    const handleSendSmsInvites = async (): Promise<void> => {
      if (!api) {
        setSmsFeedback({
          severity: 'error',
          text: t('API service is not ready yet in this session.'),
        });
        return;
      }

      if (!analysisResult?.inviteList?.length) {
        setSmsFeedback({
          severity: 'warning',
          text: t('Run analysis first or load a saved invite list.'),
        });
        return;
      }

      try {
        setIsSendingSms(true);
        const result = await sendParentWhatsappMsg91Invites(
          api,
          analysisResult.inviteList,
        );
        setSmsResult(result);
        setSmsFeedback({
          severity: result.failedBatches.length > 0 ? 'warning' : 'success',
          text:
            result.failedBatches.length > 0
              ? t(
                  'Sent {{successCount}} invites. {{failedCount}} batch failures were captured.',
                  {
                    successCount: result.successCount,
                    failedCount: result.failedBatches.length,
                  },
                )
              : t('Sent {{successCount}} invites successfully.', {
                  successCount: result.successCount,
                }),
        });
      } catch (error) {
        const apiError = toApiError(error, t('Failed to send MSG91 invites.'));
        setSmsFeedback({
          severity: 'error',
          text: apiError.message,
        });
      } finally {
        setIsSendingSms(false);
      }
    };

    const handleFetchReport = async (): Promise<void> => {
      if (!startDate || !endDate) {
        setReportFeedback({
          severity: 'warning',
          text: t('Select both start date and end date first.'),
        });
        return;
      }

      try {
        setIsLoadingReport(true);
        const rows = await fetchParentWhatsappMsg91Report({
          startDate,
          endDate,
        });
        setReportRows(rows);
        setReportFeedback({
          severity: 'success',
          text: t('Report loaded with {{count}} row(s).', {
            count: rows.length,
          }),
        });
      } catch (error) {
        const apiError = toApiError(error, t('Failed to fetch MSG91 report.'));
        setReportFeedback({
          severity: 'error',
          text: apiError.message,
        });
      } finally {
        setIsLoadingReport(false);
      }
    };

    const handleFileSelect = (fileList: FileList | null): void => {
      setUploadedMedia(fileList?.[0] ?? null);
    };

    const handleSendWhatsapp = async (): Promise<void> => {
      if (isSendingWhatsapp) return;

      const parsedPhones = parseIndianPhoneInput(phoneInput);
      setManualValidation(parsedPhones);

      if (!templateName.trim() || !templateLang.trim()) {
        setManualFeedback({
          severity: 'warning',
          text: t('Provide template name and language code before sending.'),
        });
        return;
      }

      if (parsedPhones.normalizedPhones.length === 0) {
        setManualFeedback({
          severity: 'warning',
          text: t('Add at least one valid Indian mobile number.'),
        });
        return;
      }

      if (parsedPhones.normalizedPhones.length > 1000) {
        setManualFeedback({
          severity: 'warning',
          text: t(
            'A maximum of 1000 unique phone numbers can be sent in one run.',
          ),
        });
        return;
      }

      const mediaValidation = getWhatsappMediaType(uploadedMedia);
      if (mediaValidation.error) {
        setManualFeedback({
          severity: 'error',
          text: mediaValidation.error,
        });
        return;
      }

      let mediaId: string | null = null;

      try {
        setIsSendingWhatsapp(true);
        setWhatsappProgress(0);
        setManualSendSummary(null);

        if (uploadedMedia) {
          mediaId = await uploadParentWhatsappMedia(uploadedMedia);
        }

        const failures: ParentWhatsappSendFailure[] = [];
        let successCount = 0;

        for (const [index, phone] of parsedPhones.normalizedPhones.entries()) {
          const outboundPhone = formatSmsReadyIndianPhone(phone);

          if (!outboundPhone) {
            failures.push({
              mobile: phone,
              error: {
                message: t('Invalid phone number after normalization.'),
              },
            });
            continue;
          }

          try {
            await sendParentWhatsappTemplateMessage({
              to: outboundPhone,
              templateName: templateName.trim(),
              templateLang: templateLang.trim(),
              messageType,
              mediaId,
              mediaType: mediaValidation.mediaType,
            });
            successCount += 1;
          } catch (error) {
            failures.push({
              mobile: outboundPhone,
              error: toApiError(
                error,
                t('Failed to send WhatsApp template message to {{phone}}.', {
                  phone: outboundPhone,
                }),
              ),
            });
          } finally {
            setWhatsappProgress(
              Math.round(
                ((index + 1) / parsedPhones.normalizedPhones.length) * 100,
              ),
            );
          }
        }

        setManualSendSummary({
          attempted: parsedPhones.normalizedPhones.length,
          successCount,
          failed: failures,
        });

        setManualFeedback({
          severity:
            failures.length > 0 || parsedPhones.invalid.length > 0
              ? 'warning'
              : 'success',
          text:
            failures.length > 0
              ? t(
                  'WhatsApp run finished with {{successCount}} success(es) and {{failureCount}} failure(s).',
                  {
                    successCount,
                    failureCount: failures.length,
                  },
                )
              : t(
                  'WhatsApp run finished with {{successCount}} successful send(s).',
                  {
                    successCount,
                  },
                ),
        });
      } catch (error) {
        const apiError = toApiError(
          error,
          t('WhatsApp media upload failed before sending started.'),
        );
        setManualFeedback({
          severity: 'error',
          text: apiError.message,
        });
      } finally {
        setIsSendingWhatsapp(false);
      }
    };

    return {
      uploadInputRef,
      isWhatsappMode,
      setIsWhatsappMode,
      showMsg91Report,
      setShowMsg91Report,
      isDraggingFile,
      setIsDraggingFile,
      udiseInput,
      setUdiseInput,
      limit,
      setLimit,
      analysisResult,
      analysisFeedback,
      isAnalyzing,
      isSendingSms,
      smsFeedback,
      smsResult,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      reportRows,
      reportFeedback,
      isLoadingReport,
      phoneInput,
      setPhoneInput,
      templateName,
      setTemplateName,
      templateLang,
      setTemplateLang,
      messageType,
      setMessageType,
      uploadedMedia,
      setUploadedMedia,
      manualValidation,
      manualFeedback,
      isSendingWhatsapp,
      whatsappProgress,
      manualSendSummary,
      handleAnalyze,
      handleSendSmsInvites,
      handleFetchReport,
      handleFileSelect,
      handleSendWhatsapp,
    };
  };
