import * as Sentry from '@sentry/capacitor';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import logger from './logger';

type SyncTelemetryValue = string | number | boolean | null | undefined;

export type SyncTelemetryContext = Record<string, SyncTelemetryValue>;

const nowMs = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const normalizeContext = (
  context: SyncTelemetryContext,
): Record<string, string | number | boolean | null> =>
  Object.fromEntries(
    Object.entries(context).filter(
      (entry): entry is [string, string | number | boolean | null] =>
        entry[1] !== undefined,
    ),
  );

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown sync error';
  }
};

export const classifySyncError = (error: unknown): string => {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('foreign key') ||
    message.includes('constraint failed') ||
    message.includes('code 787')
  ) {
    return 'sqlite_foreign_key';
  }

  if (
    message.includes('unique constraint') ||
    message.includes('constraint violation') ||
    message.includes('code 1555') ||
    message.includes('code 2067')
  ) {
    return 'sqlite_constraint';
  }

  if (
    message.includes('out of memory') ||
    message.includes('memory') ||
    message.includes('allocation failed')
  ) {
    return 'memory_pressure';
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborterror')
  ) {
    return 'network_timeout';
  }

  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection')
  ) {
    return 'network_error';
  }

  return 'unknown';
};

export const reportSyncError = async (
  phase: string,
  error: unknown,
  context: SyncTelemetryContext = {},
): Promise<void> => {
  const errorKind = classifySyncError(error);
  const normalizedContext = normalizeContext(context);
  const errorMessage = getErrorMessage(error);
  const payload = {
    phase,
    error_kind: errorKind,
    ...normalizedContext,
  };
  const serializedPayload = JSON.stringify(payload);
  const reportMessage = `[Sync] ${phase} failed: ${errorMessage}`;

  logger.error(
    reportMessage,
    payload,
    error instanceof Error ? error : undefined,
  );

  try {
    Sentry.captureException(
      new Error(`${reportMessage} | ${serializedPayload}`),
    );
  } catch (sentryError) {
    logger.warn('Sync telemetry failed to report to Sentry', sentryError);
  }

  if (Capacitor.getPlatform() !== 'web') {
    try {
      await FirebaseCrashlytics.log({
        message: reportMessage,
      });
    } catch (crashlyticsError) {
      logger.warn(
        'Sync telemetry failed to report to Crashlytics',
        crashlyticsError,
      );
    }
  }
};

export const createSyncPhaseTimer = (
  phase: string,
  context: SyncTelemetryContext = {},
) => {
  const startedAt = nowMs();

  return {
    finish: (
      outcome: 'success' | 'error' = 'success',
      extraContext: SyncTelemetryContext = {},
    ): number => {
      const durationMs = Math.round(nowMs() - startedAt);
      logger.info(`[Sync] ${phase} ${outcome}`, {
        ...normalizeContext(context),
        ...normalizeContext(extraContext),
        duration_ms: durationMs,
      });
      return durationMs;
    },
  };
};
