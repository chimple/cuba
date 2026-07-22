import { t } from 'i18next';
import type {
  ParentWhatsappApiError,
  ParentWhatsappSendFailure,
} from './ParentWhatsappInvitationPageService';

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
    error: String(
      t(
        'Only PNG/JPEG up to 5 MB or MP4/3GP up to 16 MB are allowed for WhatsApp media.',
      ),
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
