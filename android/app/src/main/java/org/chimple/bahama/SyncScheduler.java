package org.chimple.bahama;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

public final class SyncScheduler {

    private static final String TAG = "SyncScheduler";
    public static final String UNIQUE_WORK_NAME = "testing_native_sync";

    // ✅ 5 minutes interval
    private static final long TEST_SYNC_INTERVAL_MINUTES = 5;

    private SyncScheduler() {}

    // 🔹 First trigger
    public static void scheduleDailySync(@NonNull Context context) {

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest request =
                new OneTimeWorkRequest.Builder(DailySyncWorker.class)
                        .setInitialDelay(TEST_SYNC_INTERVAL_MINUTES, TimeUnit.MINUTES)
                        .setBackoffCriteria(
                                BackoffPolicy.LINEAR,
                                TEST_SYNC_INTERVAL_MINUTES,
                                TimeUnit.MINUTES
                        )
                        .setConstraints(constraints)
                        .addTag(UNIQUE_WORK_NAME)
                        .build();

        WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE_WORK_NAME,
                ExistingWorkPolicy.KEEP,
                request
        );

        Log.i(TAG, "Scheduled sync in " + TEST_SYNC_INTERVAL_MINUTES + " minutes");
    }

    // 🔹 Schedule next run (loop)
    public static void scheduleNextSync(@NonNull Context context) {

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest request =
                new OneTimeWorkRequest.Builder(DailySyncWorker.class)
                        .setInitialDelay(TEST_SYNC_INTERVAL_MINUTES, TimeUnit.MINUTES)
                        .setBackoffCriteria(
                                BackoffPolicy.LINEAR,
                                TEST_SYNC_INTERVAL_MINUTES,
                                TimeUnit.MINUTES
                        )
                        .setConstraints(constraints)
                        .addTag(UNIQUE_WORK_NAME)
                        .build();

        WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE_WORK_NAME,
                ExistingWorkPolicy.APPEND_OR_REPLACE,
                request
        );

        Log.i(TAG, "Queued next sync in " + TEST_SYNC_INTERVAL_MINUTES + " minutes");
    }
}