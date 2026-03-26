package org.chimple.bahama.sync;

import android.util.Log;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

public class PushSyncHelper {

    private static final String TAG = "PushSyncHelper";

    private final LocalDbHelper dbHelper;
    private final SupabaseApiClient apiClient;

    public PushSyncHelper(LocalDbHelper dbHelper, SupabaseApiClient apiClient) {
        this.dbHelper = dbHelper;
        this.apiClient = apiClient;
    }

    /**
     * Mirrors pushChanges() exactly.
     *
     * Error handling mirrors TS logic:
     *   isDuplicateConflict = code 23505 OR status 409
     *   isPermissionDenied  = status 401/403 OR code 42501 OR message contains RLS keywords
     *
     *   - isDuplicateConflict OR NOT isPermissionDenied → treat as OK, remove from queue
     *   - isPermissionDenied (real RLS error) → remove from queue but skip pull_sync_info update
     *   - anything else → return false (abort push)
     */
    public boolean pushChanges() {
        List<Map<String, Object>> queue = dbHelper.getPushQueue();

        if (queue == null || queue.isEmpty()) {
            Log.i(TAG, "pushChanges: queue empty");
            return true;
        }

        Log.i(TAG, "pushChanges: processing " + queue.size() + " items");

        for (Map<String, Object> item : queue) {
            String queueId    = (String) item.get("id");
            String tableName  = (String) item.get("table_name");
            String changeType = (String) item.get("change_type");
            String dataJson   = (String) item.get("data");

            Map<String, Object> rowData = dbHelper.parseJsonToMap(dataJson);
            if (rowData == null) {
                dbHelper.deletePushQueueItem(queueId, tableName);
                continue;
            }

            String rowId = rowData.containsKey("id") ? String.valueOf(rowData.get("id")) : null;

            SupabaseApiClient.MutateResult mutateResult =
                    apiClient.mutate(changeType, tableName, rowData, rowId);

            boolean isPermissionDenied = false;

            if (mutateResult == null || mutateResult.hasError()) {
                int status = mutateResult != null ? mutateResult.status : 0;
                String code = mutateResult != null
                        ? mutateResult.errorCode.toLowerCase(Locale.US) : "";
                String message = mutateResult != null
                        ? (mutateResult.errorMessage + " " + mutateResult.errorDetails)
                                .toLowerCase(Locale.US)
                        : "";

                // Mirrors: isDuplicateConflict = mutateCode === '23505' || mutateStatus === 409
                boolean isDuplicateConflict = code.equals("23505") || status == 409;

                // Mirrors the full isPermissionDenied check
                isPermissionDenied =
                        status == 401 ||
                        status == 403 ||
                        code.equals("42501") ||
                        message.contains("permission denied") ||
                        message.contains("row-level security") ||
                        message.contains("violates row-level security") ||
                        message.contains("unauthorized");

                if (isDuplicateConflict || !isPermissionDenied) {
                    // Duplicate or non-permission error — treat as OK
                    Log.i(TAG, "Duplicate key or soft error ignored for: " + tableName);
                } else {
                    // Real push error — abort entire push cycle
                    Log.e(TAG, "Real push error on " + tableName + ": " + message);
                    return false;
                }
            }

            // Remove from queue regardless of error type (except real errors which returned above)
            // Mirrors: DELETE FROM push_sync_info WHERE id = ? AND table_name = ?
            dbHelper.deletePushQueueItem(queueId, tableName);

            // Skip pull_sync_info update if permission was denied
            // Mirrors: if (mutate?.error && isPermissionDenied) { continue; }
            if (mutateResult != null && mutateResult.hasError() && isPermissionDenied) {
                continue;
            }

            // Update pull_sync_info for this table
            // Mirrors: INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)
            dbHelper.updatePullTimestamp(tableName, isoFormat(new Date()));
        }

        return true;
    }

    private String isoFormat(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(date);
    }
}