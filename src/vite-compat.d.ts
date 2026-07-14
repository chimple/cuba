declare module '@splidejs/react-splide' {
  import * as React from 'react';

  type SplideProps = React.PropsWithChildren<Record<string, unknown>>;

  export const Splide: React.ComponentType<SplideProps>;
  export const SplideSlide: React.ComponentType<SplideProps>;
  export const SplideTrack: React.ComponentType<SplideProps>;
  export { Options } from '@splidejs/splide';
}

interface ImportMetaEnv {
  readonly VITE_ALGOLIA_API_KEY?: string;
  readonly VITE_ALGOLIA_APP_ID?: string;
  readonly VITE_ALGOLIA_INDEX_NAME?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_AUTH_DOMAIN?: string;
  readonly VITE_CAPACITOR_HOT_UPDATE_APP_ID?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_ENV?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_GITHUB_BASE?: string;
  readonly VITE_GROWTHBOOK_ID?: string;
  readonly VITE_HOT_UPDATE_SERVER?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_MEASUREMENT_ID?: string;
  readonly VITE_MESSAGING_SENDER_ID?: string;
  readonly VITE_PROJECT_ID?: string;
  readonly VITE_RAPIDAPI_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_STORAGE_BUCKET?: string;
  readonly VITE_SUPABASE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
