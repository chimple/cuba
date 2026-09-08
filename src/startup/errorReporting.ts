import * as Sentry from '@sentry/capacitor';
import * as SentryReact from '@sentry/react';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import { persistor, store } from '../redux/store';
import { TableTypes } from '../common/constants';
import logger from '../utility/logger';

export const initializeErrorReporting = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  // Invalid configuration must not reach the native SDK: it can crash Android.
  let hasValidDsn = false;
  try {
    const parsed = new URL(dsn ?? '');
    hasValidDsn =
      ['https:', 'http:'].includes(parsed.protocol) &&
      Boolean(parsed.hostname && parsed.username) &&
      /^\d+$/.test(parsed.pathname.split('/').pop() ?? '');
  } catch {
    // Missing or malformed optional telemetry configuration.
  }

  if (hasValidDsn) {
    Sentry.init(
      {
        dsn,
        sendDefaultPii: true,
        integrations: [Sentry.browserTracingIntegration()],
      },
      SentryReact.init,
    );
  } else {
    logger.warn('Skipping Sentry initialization: missing or invalid DSN.');
  }

  persistor.subscribe(() => {
    const { bootstrapped } = persistor.getState();
    if (!bootstrapped) return;

    const user = store.getState().auth?.user;
    if (hasValidDsn && user?.id) {
      Sentry.setUser({ id: user.id });
    }
  });

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    recordException(event.reason.toString(), event.type.toString());
  };
  window.onerror = (message, source, lineno, colno, error) => {
    recordException(message.toString(), error?.toString() ?? 'Unknown error');
  };
};

export const reactRootErrorHandlers = {
  onUncaughtError: SentryReact.reactErrorHandler((error, errorInfo) => {
    logger.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  onCaughtError: SentryReact.reactErrorHandler(),
  onRecoverableError: SentryReact.reactErrorHandler(),
};

const recordException = (message: string, error: string) => {
  if (Capacitor.getPlatform() !== 'web') {
    FirebaseCrashlytics.recordException({ message, domain: error });
  }
};

export const getCurrentPersistedUser = (): TableTypes<'user'> | undefined =>
  store.getState().auth?.user ?? undefined;
