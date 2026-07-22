import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { ApiHandler } from '../../../services/api/ApiHandler';
import {
  formatSmsReadyIndianPhone,
  parseIndianPhoneInput,
} from '../../utils/phoneNormalization';
import {
  fetchParentWhatsappMsg91Report,
  ParentWhatsappAnalysisResult,
  ParentWhatsappSendFailure,
  ParentWhatsappSmsSendResult,
  processParentWhatsappUdiseCodes,
  sendParentWhatsappMsg91Invites,
  sendParentWhatsappTemplateMessage,
  uploadParentWhatsappMedia,
} from './ParentWhatsappInvitationPageService';
import {
  Feedback,
  getTodayDateValue,
  getWhatsappMediaType,
  ManualPhoneValidation,
  ManualSendSummary,
  toApiError,
} from './ParentWhatsappInvitationPageHelpers';

const MIN_WHATSAPP_PHONE_LIMIT = 1;
const DEFAULT_WHATSAPP_PHONE_LIMIT = 1000;

const normalizeWhatsappPhoneLimit = (rawLimit: number): number => {
  if (!Number.isFinite(rawLimit)) {
    return DEFAULT_WHATSAPP_PHONE_LIMIT;
  }

  return Math.max(MIN_WHATSAPP_PHONE_LIMIT, Math.floor(rawLimit));
};

export type {
  Feedback,
  ManualPhoneValidation,
  ManualSendSummary,
} from './ParentWhatsappInvitationPageHelpers';
export {
  formatCellValue,
  formatFileSize,
  formatHeaderLabel,
  formatProcessedUdiseRows,
  getTodayDateValue,
  getWhatsappMediaType,
  toApiError,
} from './ParentWhatsappInvitationPageHelpers';

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
  whatsappPhoneLimit: string;
  isWhatsappPhoneLimitInvalid: boolean;
  handleWhatsappPhoneLimitChange: (rawValue: string) => void;
  handleWhatsappPhoneLimitFocus: () => void;
  handleWhatsappPhoneLimitBlur: () => void;
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
    const [whatsappPhoneLimit, setWhatsappPhoneLimit] = useState(
      String(DEFAULT_WHATSAPP_PHONE_LIMIT),
    );
    const [isWhatsappPhoneLimitTouched, setIsWhatsappPhoneLimitTouched] =
      useState(false);
    const [isWhatsappPhoneLimitFocused, setIsWhatsappPhoneLimitFocused] =
      useState(false);
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
    const parsedWhatsappPhoneLimit = Number.parseInt(whatsappPhoneLimit, 10);
    const isWhatsappPhoneLimitValueInvalid =
      !whatsappPhoneLimit.trim() ||
      !Number.isFinite(parsedWhatsappPhoneLimit) ||
      parsedWhatsappPhoneLimit < MIN_WHATSAPP_PHONE_LIMIT;
    const isWhatsappPhoneLimitInvalid =
      isWhatsappPhoneLimitTouched &&
      !isWhatsappPhoneLimitFocused &&
      isWhatsappPhoneLimitValueInvalid;

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
      if (!api) {
        setReportFeedback({
          severity: 'error',
          text: t('API service is not ready yet in this session.'),
        });
        return;
      }

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
          api,
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

    const handleWhatsappPhoneLimitChange = (rawValue: string): void => {
      setWhatsappPhoneLimit(rawValue);
    };

    const handleWhatsappPhoneLimitFocus = (): void => {
      setIsWhatsappPhoneLimitFocused(true);
    };

    const handleWhatsappPhoneLimitBlur = (): void => {
      setIsWhatsappPhoneLimitFocused(false);
      setIsWhatsappPhoneLimitTouched(true);
    };

    const handleSendWhatsapp = async (): Promise<void> => {
      if (isSendingWhatsapp) return;
      if (!api) {
        setManualFeedback({
          severity: 'error',
          text: t('API service is not ready yet in this session.'),
        });
        return;
      }

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

      const phoneLimit = normalizeWhatsappPhoneLimit(parsedWhatsappPhoneLimit);

      if (parsedPhones.normalizedPhones.length > phoneLimit) {
        setManualFeedback({
          severity: 'warning',
          text: t(
            'A maximum of {{limit}} unique phone numbers can be sent at once.',
            {
              limit: phoneLimit,
            },
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
          mediaId = await uploadParentWhatsappMedia(api, uploadedMedia);
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
            await sendParentWhatsappTemplateMessage(api, {
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
      whatsappPhoneLimit,
      isWhatsappPhoneLimitInvalid,
      handleWhatsappPhoneLimitChange,
      handleWhatsappPhoneLimitFocus,
      handleWhatsappPhoneLimitBlur,
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
