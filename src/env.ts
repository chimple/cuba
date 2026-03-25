const normalizeEnv = (value?: string) => {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'prod' || normalized === 'production' ? 'prod' : 'dev';
};

export const API_KEY = import.meta.env.VITE_API_KEY ?? '';
export const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN ?? '';
export const PROJECT_ID = import.meta.env.VITE_PROJECT_ID ?? '';
export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET ?? '';
export const MESSAGING_SENDER_ID =
  import.meta.env.VITE_MESSAGING_SENDER_ID ?? '';
export const APP_ID = import.meta.env.VITE_APP_ID ?? '';
export const MEASUREMENT_ID = import.meta.env.VITE_MEASUREMENT_ID ?? '';
export const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY ?? '';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? '';
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ?? '';
export const GROWTHBOOK_ID = import.meta.env.VITE_GROWTHBOOK_ID ?? '';
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? '';
export const GITHUB_BASE = import.meta.env.VITE_GITHUB_BASE ?? '';
export const ALGOLIA_INDEX_NAME =
  import.meta.env.VITE_ALGOLIA_INDEX_NAME ?? '';
export const HOT_UPDATE_SERVER =
  import.meta.env.VITE_HOT_UPDATE_SERVER ?? '';
export const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL ?? '';
export const APP_ENV = normalizeEnv(
  import.meta.env.VITE_ENV ?? import.meta.env.VITE_ENVIRONMENT,
);

export const getHotUpdateChannel = (majorVersion: string) =>
  `${APP_ENV}-${majorVersion}`;
