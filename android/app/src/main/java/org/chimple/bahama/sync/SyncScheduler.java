package org.chimple.bahama.sync;

import android.content.Context;
import android.util.Log;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import java.util.Calendar;
import java.util.concurrent.TimeUnit;

public class SyncScheduler {

    private static final String TAG = "SyncScheduler";
    private static final String SYNC_WORK_TAG = "daily_5pm_sync";
    private static final int SYNC_HOUR = 17; // 17 = 5 PM (change to any hour you want)
    private static final int SYNC_MINUTE = 0;

    /**
     * Schedules a one-time sync at the next 5 PM.
     * After each run, SyncWorker calls this again to schedule the next day's 5 PM.
     * This is the correct pattern for exact time-of-day scheduling in WorkManager.
     *
     * Call this once from Application.onCreate().
     */
    public static void scheduleDailySync(Context context) {
        long delayMs = getDelayUntilNext5PM();
        long delayMinutes = TimeUnit.MILLISECONDS.toMinutes(delayMs);
        Log.i(TAG, "Next sync scheduled in " + delayMinutes + " minutes (at 5 PM)");

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build();

        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
                .setConstraints(constraints)
                .addTag(SYNC_WORK_TAG)
                .build();

        // KEEP: if a 5PM job is already queued, don't replace it
        WorkManager.getInstance(context).enqueueUniqueWork(
                SYNC_WORK_TAG,
                ExistingWorkPolicy.KEEP,
                syncRequest
        );
    }

    /**
     * Call this at the END of SyncWorker.doWork() to schedule tomorrow's 5 PM run.
     * Uses REPLACE so the next-day job always gets registered fresh.
     */
    public static void scheduleNextDaySync(Context context) {
        long delayMs = getDelayUntilNext5PM();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build();

        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
                .setConstraints(constraints)
                .addTag(SYNC_WORK_TAG)
                .build();

        // REPLACE: current job just finished, schedule the next one fresh
        WorkManager.getInstance(context).enqueueUniqueWork(
                SYNC_WORK_TAG,
                ExistingWorkPolicy.REPLACE,
                syncRequest
        );

        Log.i(TAG, "Next day sync scheduled. Delay: "
                + TimeUnit.MILLISECONDS.toMinutes(delayMs) + " minutes");
    }

    /**
     * Calculates milliseconds until the next 5:00 PM.
     *
     * Logic:
     * - If current time is BEFORE 5 PM today  → delay = today 5PM - now
     * - If current time is AT or AFTER 5 PM   → delay = tomorrow 5PM - now
     */
    private static long getDelayUntilNext5PM() {
        Calendar now = Calendar.getInstance();

        Calendar target = Calendar.getInstance();
        target.set(Calendar.HOUR_OF_DAY, SYNC_HOUR);
        target.set(Calendar.MINUTE, SYNC_MINUTE);
        target.set(Calendar.SECOND, 0);
        target.set(Calendar.MILLISECOND, 0);

        // If 5 PM today has already passed, move to tomorrow
        if (now.after(target) || now.equals(target)) {
            target.add(Calendar.DAY_OF_MONTH, 1);
        }

        return target.getTimeInMillis() - now.getTimeInMillis();
    }

    /**
     * Trigger an immediate one-off sync (e.g. after a local write).
     * This does NOT affect the scheduled 5 PM job.
     */
    public static void triggerImmediateSync(Context context) {
        OneTimeWorkRequest immediateSync = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .addTag("immediate_sync")
                .build();
        WorkManager.getInstance(context).enqueue(immediateSync);
    }

    public static void cancelSync(Context context) {
        WorkManager.getInstance(context).cancelAllWorkByTag(SYNC_WORK_TAG);
    }
}