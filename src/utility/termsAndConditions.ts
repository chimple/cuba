import { Capacitor } from '@capacitor/core';

import { CURRENT_MODE, LANG, LANGUAGE, MODES } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';

type TermsUrlMap = Record<string, unknown>;

type UserWithTermsState = {
  id?: string | null;
  tc_agreed_version?: number | string | null;
};

export type TermsAppMode = 'kids' | 'teacher' | 'ops';

const stripHtmlSuffix = (value: string) => value.replace(/\.html$/i, '');

const stripLanguageSuffix = (value: string) =>
  value.replace(/\.[a-z]{2}(?:[-_][a-z]{2})?$/i, '');

export const normalizeTcVersion = (value: unknown): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getTermsLanguageCode = (
  languageCode = localStorage.getItem(LANGUAGE) ?? LANG.ENGLISH,
): string => {
  const trimmedCode = languageCode.trim();
  if (!trimmedCode) {
    return LANG.ENGLISH;
  }

  return trimmedCode.split(/[-_]/)[0].toLowerCase() || LANG.ENGLISH;
};

export const resolveTermsBaseUrl = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const termsUrlMap = value as TermsUrlMap;
  const languageCode = getTermsLanguageCode();
  const candidates = [termsUrlMap[languageCode], termsUrlMap[LANG.ENGLISH]];

  const firstValidUrl = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.trim().length > 0,
  );

  return typeof firstValidUrl === 'string' ? firstValidUrl.trim() : '';
};

export const buildTermsUrl = (
  baseUrl: string,
  languageCode = getTermsLanguageCode(),
): string => {
  const normalizedBaseUrl = stripLanguageSuffix(
    stripHtmlSuffix(baseUrl.trim().replace(/\/+$/, '')),
  );

  if (!normalizedBaseUrl) {
    return '';
  }

  const resolvedLanguageCode = getTermsLanguageCode(languageCode);
  return `${normalizedBaseUrl}.${resolvedLanguageCode}.html`;
};

export const getEnglishTermsUrl = (baseUrl: string): string =>
  buildTermsUrl(baseUrl, LANG.ENGLISH);

export const getUserTcAgreedVersion = (user?: UserWithTermsState | null) =>
  normalizeTcVersion(user?.tc_agreed_version);

export const needsTermsAgreement = (
  user: UserWithTermsState | null | undefined,
  latestVersion: unknown,
): boolean => getUserTcAgreedVersion(user) < normalizeTcVersion(latestVersion);

export const getCurrentTermsAppMode = (): TermsAppMode => {
  const currentMode = localStorage.getItem(CURRENT_MODE);

  if (currentMode === MODES.TEACHER) {
    return 'teacher';
  }

  if (currentMode === MODES.OPS_CONSOLE) {
    return 'ops';
  }

  return 'kids';
};

export const getTermsAgreeLabelKey = (
  appMode = getCurrentTermsAppMode(),
): string => {
  if (appMode === 'teacher') {
    return 'Agree as Teacher';
  }

  if (appMode === 'ops') {
    return 'Agree as OPS User';
  }

  return 'Agree as Parent';
};

export const buildTcAnalyticsContext = (
  user?: UserWithTermsState | null,
): Record<string, string | number | null> => {
  const apiHandler = ServiceConfig.getI()?.apiHandler;
  const appMode = getCurrentTermsAppMode();

  const analyticsConfig =
    appMode === 'teacher'
      ? {
          app_name: 'teachers_app',
          user_role: 'teacher',
          user_type: 'teacher',
        }
      : appMode === 'ops'
        ? {
            app_name: 'ops_console',
            user_role: 'ops_user',
            user_type: 'ops_user',
          }
        : {
            app_name: 'kids_app',
            user_role: 'parent',
            user_type: 'parent',
          };

  return {
    user_id: user?.id ?? '',
    timestamp: new Date().toISOString(),
    app_name: analyticsConfig.app_name,
    school_id: apiHandler?.currentSchool?.id ?? null,
    class_id: apiHandler?.currentClass?.id ?? null,
    user_role: analyticsConfig.user_role,
    user_type: analyticsConfig.user_type,
    device_platform: Capacitor.getPlatform(),
  };
};
