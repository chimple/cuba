import CryptoJS from 'crypto-js';
import { LANGUAGE } from '../common/constants';

export const SUPPORTED_AUDIO_LANGUAGE_CODES = [
  'en',
  'hi',
  'mr',
  'kn',
  'pt',
] as const;

export const COMMON_AUDIO_CACHE_DIR = 'commonAudioCache';
export const TTS_RESTART_DELAY_MS = 80;

export const getAudioCacheFileName = (audioUrl: string): string => {
  const fallbackExtension = 'mp3';

  try {
    const parsedUrl = new URL(audioUrl);
    const extension =
      parsedUrl.pathname.split('.').pop()?.toLowerCase() ?? fallbackExtension;
    const sanitizedExtension = extension.replace(/[^a-z0-9]/g, '');

    return `${CryptoJS.SHA256(audioUrl).toString()}.${
      sanitizedExtension || fallbackExtension
    }`;
  } catch {
    return `${CryptoJS.SHA256(audioUrl).toString()}.${fallbackExtension}`;
  }
};

export const getCommonAudioCachePath = (audioUrl: string): string =>
  `${COMMON_AUDIO_CACHE_DIR}/${getAudioCacheFileName(audioUrl)}`;

export const isRemoteAudioUrl = (audioUrl: string): boolean =>
  /^https?:\/\//i.test(audioUrl);

export const normalizeAudioLanguageCode = (
  languageCode?: string | null,
): string => {
  const baseLanguage = languageCode?.trim().toLowerCase().split('-')[0];

  return SUPPORTED_AUDIO_LANGUAGE_CODES.includes(
    baseLanguage as (typeof SUPPORTED_AUDIO_LANGUAGE_CODES)[number],
  )
    ? baseLanguage!
    : 'en';
};

export const resolveTtsLanguage = (languageCode?: string | null): string => {
  const normalizedLanguage =
    (
      languageCode ||
      localStorage.getItem(LANGUAGE) ||
      navigator.language ||
      'en'
    )
      .trim()
      .toLowerCase() || 'en';

  if (normalizedLanguage.includes('-')) {
    return normalizedLanguage;
  }

  const ttsLocaleMap: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    pt: 'pt-PT',
  };

  return ttsLocaleMap[normalizedLanguage] || `${normalizedLanguage}-IN`;
};

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const isInterruptedAudioPlaybackError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('interrupted by a call to pause') ||
    normalizedMessage.includes('the play() request was interrupted')
  );
};

export const blobToBase64 = async (data: string | Blob): Promise<string> => {
  if (typeof data === 'string') {
    return data;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? '';
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
};
