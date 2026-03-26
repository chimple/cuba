package org.chimple.bahama.sync;

import android.util.Log;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

public class PullSyncHelper {

    private static final String TAG = "PullSyncHelper";
    private static final int MAX_ATTEMPTS = 5;
    private static final String DEFAULT_OLD_TIMESTAMP = "2024-01-01T00:00:00.000Z";
    private static final String USER_TABLE = "user";

    private final LocalDbHelper dbHelper;
    private final SupabaseApiClient apiClient;

    public PullSyncHelper(LocalDbHelper dbHelper, SupabaseApiClient apiClient) {
        this.dbHelper = dbHelper;
        this.apiClient = apiClient;
    }

    /**
     * Mirrors pullChanges() exactly.
     */
    public void pullChanges(String[] tableNames, boolean isFirstSync) {
        Log.i(TAG, "pullChanges started. isFirstSync=" + isFirstSync);

        // Step 1: Ensure user table is first in the list
        // Mirrors: [TABLES.User, ...tableNames.filter(t => t !== TABLES.User)]
        List<String> orderedTables = new ArrayList<>();
        boolean hasUser = Arrays.asList(tableNames).contains(USER_TABLE);
        if (hasUser) orderedTables.add(USER_TABLE);
        for (String t : tableNames) {
            if (!t.equals(USER_TABLE)) orderedTables.add(t);
        }

        // Step 2: Read last-pulled timestamps from pull_sync_info
        // Mirrors: SELECT * FROM pull_sync_info WHERE table_name IN (...)
        Map<String, String> lastPullMap = new HashMap<>();
        for (String table : orderedTables) {
            String ts = dbHelper.getLastPullTimestampStr(table);
            lastPullMap.put(table, ts != null ? ts : DEFAULT_OLD_TIMESTAMP);
        }

        // Step 3: Fetch from server with retry
        String[] orderedArray = orderedTables.toArray(new String[0]);
        Map<String, List<Map<String, Object>>> serverData = fetchWithRetry(
                orderedArray, lastPullMap, isFirstSync
        );

        if (serverData == null) {
            Log.e(TAG, "pullChanges: all retries failed, aborting");
            return;
        }

        String lastPulled = isoFormat(new Date());

        // Step 4: Filter columns and upsert rows
        // Mirrors: tablesForWorker, tableColumnsByName, tablesWritten logic
        Set<String> tablesWritten = new HashSet<>();

        for (String tableName : orderedTables) {
            List<Map<String, Object>> tableData = serverData.get(tableName);
            if (tableData == null || tableData.isEmpty()) continue;

            // Mirrors: getTableColumns(tableName) — skip if schema unknown
            List<String> existingColumns = dbHelper.getTableColumns(tableName);
            if (existingColumns == null || existingColumns.isEmpty()) continue;

            for (Map<String, Object> row : tableData) {
                // Only insert fields that exist in local schema
                // Mirrors: fieldNames = Object.keys(row).filter(f => existingColumns.includes(f))
                Map<String, Object> filteredRow = new LinkedHashMap<>();
                for (String col : existingColumns) {
                    if (row.containsKey(col)) {
                        filteredRow.put(col, row.get(col));
                    }
                }
                if (filteredRow.isEmpty()) continue;

                // INSERT INTO ... ON CONFLICT(id) DO UPDATE SET ...
                // WHERE excluded.updated_at > tableName.updated_at  ← newer wins
                dbHelper.upsertRow(tableName, filteredRow);
            }

            tablesWritten.add(tableName);
            Log.i(TAG, "Pulled " + tableData.size() + " rows for: " + tableName);
        }

        // Step 5: Update pull_sync_info for all written tables
        // Mirrors: INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)
        for (String tableName : tablesWritten) {
            dbHelper.updatePullTimestamp(tableName, lastPulled);
        }

        Log.i(TAG, "pullChanges complete. Tables written: " + tablesWritten.size());
    }

    /**
     * Mirrors the retry loop in pullChanges().
     * - isFirstSync: retries up to MAX_ATTEMPTS with exponential backoff (500ms * 2^attempt)
     * - not isFirstSync: single attempt, throws on failure
     *
     * On all retries exhausted: clears local tables + VACUUM (mirrors TS behavior).
     */
    private Map<String, List<Map<String, Object>>> fetchWithRetry(
            String[] tableNames,
            Map<String, String> lastPullMap,
            boolean isFirstSync
    ) {
        int maxAttempts = isFirstSync ? MAX_ATTEMPTS : 1;
        int attempt = 1;

        while (true) {
            try {
                return apiClient.getTablesData(tableNames, lastPullMap, isFirstSync);
            } catch (Exception e) {
                Log.e(TAG, "Attempt " + attempt + ": getTablesData failed: " + e.getMessage());

                if (attempt < maxAttempts) {
                    long delay = (long) (500 * Math.pow(2, attempt)); // 500ms * 2^attempt
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return null;
                    }
                    attempt++;
                    continue;
                }

                // All retries failed — clear local tables + VACUUM
                // Mirrors: DELETE FROM table + VACUUM in TS
                Log.w(TAG, "All retries failed. Clearing local tables...");
                dbHelper.clearTables(tableNames);

                // In Android there's no interactive toast retry in WorkManager context.
                // We return null and let SyncWorker return Result.retry() to reschedule.
                return null;
            }
        }
    }

    private String isoFormat(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(date);
    }
}