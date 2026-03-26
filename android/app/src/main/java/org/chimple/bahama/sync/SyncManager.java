package org.chimple.bahama.sync;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicBoolean;

public class SyncManager {

    private static final String TAG = "SyncManager";
    private static final long MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000L; // 5 minutes

    // Mirrors _syncInProgress and _syncRequestedAgain
    private static final AtomicBoolean syncInProgress = new AtomicBoolean(false);
    private static volatile boolean syncRequestedAgain = false;

    private final LocalDbHelper dbHelper;
    private final SupabaseApiClient apiClient;

    public SyncManager(LocalDbHelper dbHelper, SupabaseApiClient apiClient) {
        this.dbHelper = dbHelper;
        this.apiClient = apiClient;
    }

    /**
     * Mirrors syncDbNow() exactly:
     * 1. Lock check
     * 2. Force-reset refreshTables timestamps
     * 3. Throttle by last user pull time (>5 min OR is_sync_immediate OR refreshTables)
     * 4. pullChanges → pushChanges
     * 5. Set all synced tables' last_pulled = (now - 1 minute)  ← important detail
     * 6. Finally: release lock, re-run if syncRequestedAgain
     */
    public boolean syncDbNow(
            String[] tableNames,
            String[] refreshTables,
            boolean isFirstSync,
            boolean isSyncImmediate
    ) {
        if (!syncInProgress.compareAndSet(false, true)) {
            Log.i(TAG, "Sync already running → scheduling another run");
            syncRequestedAgain = true;
            return true; // mirrors "return true" in TS
        }

        boolean result = false;

        try {
            // Step 1: Force-reset pull timestamps for refreshTables
            // Mirrors: UPDATE pull_sync_info SET last_pulled = '2024-01-01...' WHERE table_name IN (...)
            if (refreshTables != null && refreshTables.length > 0) {
                dbHelper.resetPullTimestampsForTables(refreshTables);
            }

            // Step 2: Check last user sync time for throttle
            // Mirrors: SELECT * FROM pull_sync_info WHERE table_name = 'user'
            long lastUserSyncMs = dbHelper.getLastPullTimestamp("user");
            long diffMs = System.currentTimeMillis() - lastUserSyncMs;
            double diffMinutes = diffMs / (1000.0 * 60);

            boolean shouldSync = diffMinutes > 5
                    || isSyncImmediate
                    || (refreshTables != null && refreshTables.length > 0);

            if (shouldSync) {
                // Step 3: Pull first
                PullSyncHelper pullHelper = new PullSyncHelper(dbHelper, apiClient);
                pullHelper.pullChanges(tableNames, isFirstSync);

                // Step 4: Push second (always pushes ALL tables, mirrors Object.values(TABLES))
                PushSyncHelper pushHelper = new PushSyncHelper(dbHelper, apiClient);
                result = pushHelper.pushChanges();

                // Step 5: Set last_pulled = now - 1 minute for all synced tables
                // Mirrors: reducedTimestamp.setMinutes(reducedTimestamp.getMinutes() - 1)
                // This creates a small overlap window so near-boundary updates aren't missed
                Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                cal.add(Calendar.MINUTE, -1);
                String reducedTimestamp = isoFormat(cal.getTime());

                dbHelper.updatePullTimestampsForTables(tableNames, reducedTimestamp);
            }

        } catch (Exception e) {
            Log.e(TAG, "syncDbNow threw exception", e);
            result = false;
        } finally {
            syncInProgress.set(false);

            // Mirrors: if (this._syncRequestedAgain) { setTimeout(() => this.syncDbNow(), 0) }
            if (syncRequestedAgain) {
                syncRequestedAgain = false;
                Log.i(TAG, "Re-running sync because changes happened during sync");
                final String[] finalTableNames = tableNames;
                new Thread(() -> syncDbNow(finalTableNames, null, false, true)).start();
            }
        }

        return result;
    }

    // Convenience overload — mirrors syncDB() wrapper defaults
    public boolean syncDbNow(String[] tableNames, String[] refreshTables, boolean isFirstSync) {
        return syncDbNow(tableNames, refreshTables, isFirstSync, true);
    }

    private String isoFormat(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(date);
    }
}