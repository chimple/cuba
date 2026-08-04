import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/capacitor';
import { classifySyncError, reportSyncError } from './syncTelemetry';

jest.mock('@sentry/capacitor', () => ({
  captureException: jest.fn(),
}));

describe('syncTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('classifies SQLite foreign key failures', () => {
    expect(classifySyncError(new Error('FOREIGN KEY constraint failed'))).toBe(
      'sqlite_foreign_key',
    );
  });

  test('reports sync errors to Sentry and logs to Crashlytics on native', async () => {
    jest
      .mocked(Capacitor.getPlatform)
      .mockReturnValueOnce(
        'android' as ReturnType<typeof Capacitor.getPlatform>,
      );

    await reportSyncError('pull_sqlite_transaction', new Error('timed out'), {
      duration_ms: 1200,
      row_count: 50,
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(FirebaseCrashlytics.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          '[Sync] pull_sqlite_transaction failed',
        ),
      }),
    );
  });
});
