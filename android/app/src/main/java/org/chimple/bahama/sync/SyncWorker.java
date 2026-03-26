package org.chimple.bahama.sync;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class SyncWorker extends Worker {

    private static final String TAG = "SyncWorker";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "Sync job started");

        try {
            LocalDbHelper dbHelper = new LocalDbHelper(getApplicationContext());
            SupabaseApiClient apiClient = new SupabaseApiClient(getApplicationContext());
            SyncManager syncManager = new SyncManager(dbHelper, apiClient);

            boolean success = syncManager.syncDbNow(
                    SyncManager.ALL_TABLES,
                    null,
                    false,
                    true
            );

            if (success) {
                Log.d(TAG, "Sync completed successfully");
            } else {
                Log.w(TAG, "Sync returned false");
            }

        } catch (Exception e) {
            Log.e(TAG, "Sync failed with exception", e);
            // Schedule next day even if today's sync failed — don't skip tomorrow
        } finally {
            // Always reschedule for tomorrow's 5 PM regardless of success/failure
            SyncScheduler.scheduleNextDaySync(getApplicationContext());
        }

        // Return success always — failure is handled by rescheduling, not WorkManager retry
        // (retrying immediately makes no sense for a time-based daily job)
        return Result.success();
    }
}