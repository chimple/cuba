import * as Sentry from '@sentry/capacitor';
import * as SentryReact from '@sentry/react';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import { persistor, store } from '../redux/store';
import { TableTypes } from '../common/constants';
import logger from '../utility/logger';

export const initializeErrorReporting = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  Sentry.init(
    {
      dsn,
      sendDefaultPii: true,
      integrations: [Sentry.browserTracingIntegration()],
    },
    SentryReact.init,
  );

  persistor.subscribe(() => {
    const { bootstrapped } = persistor.getState();
    if (!bootstrapped) return;

    const user = store.getState().auth?.user;
    if (user?.id) {
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
