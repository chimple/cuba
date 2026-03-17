package org.chimple.bahama;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.Calendar;
import java.util.concurrent.TimeUnit;

public final class SyncScheduler {
    private static final String TAG = "SyncScheduler";
    public static final String UNIQUE_WORK_NAME = "daily_native_sync";
    private static final int DEFAULT_SYNC_HOUR = 17;
    private static final int DEFAULT_SYNC_MINUTE = 0;

    private SyncScheduler() {
    }

    public static void scheduleDailySync(@NonNull Context context) {
        long initialDelayMs = calculateInitialDelay(DEFAULT_SYNC_HOUR, DEFAULT_SYNC_MINUTE);

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                DailySyncWorker.class,
                24,
                TimeUnit.HOURS
        )
                .setInitialDelay(initialDelayMs, TimeUnit.MILLISECONDS)
                .setConstraints(constraints)
                .addTag(UNIQUE_WORK_NAME)
                .build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                request
        );

        Log.i(TAG, "Scheduled daily sync. Initial delay(ms)=" + initialDelayMs);
    }

    static long calculateInitialDelay(int targetHour24, int targetMinute) {
        Calendar now = Calendar.getInstance();
        Calendar nextRun = Calendar.getInstance();
        nextRun.set(Calendar.HOUR_OF_DAY, targetHour24);
        nextRun.set(Calendar.MINUTE, targetMinute);
        nextRun.set(Calendar.SECOND, 0);
        nextRun.set(Calendar.MILLISECOND, 0);~

        if (!nextRun.after(now)) {
            nextRun.add(Calendar.DAY_OF_YEAR, 1);
        }

        return nextRun.getTimeInMillis() - now.getTimeInMillis();
    }
}
