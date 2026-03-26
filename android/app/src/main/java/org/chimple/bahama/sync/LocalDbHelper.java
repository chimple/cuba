package org.chimple.bahama.sync;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class LocalDbHelper extends SQLiteOpenHelper {

    private static final String TAG = "LocalDbHelper";
    private static final String DB_NAME = "app_local.db";
    private static final int DB_VERSION = 1;
    private static final String FORCE_FULL_SYNC_DATE = "2024-01-01T00:00:00.000Z";

    public LocalDbHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // Mirrors pull_sync_info and push_sync_info tables
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS pull_sync_info (" +
            "  table_name TEXT PRIMARY KEY," +
            "  last_pulled TEXT NOT NULL" +
            ");"
        );
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS push_sync_info (" +
            "  id TEXT PRIMARY KEY," +
            "  table_name TEXT NOT NULL," +
            "  change_type TEXT NOT NULL," +
            "  data TEXT NOT NULL," +
            "  created_at TEXT NOT NULL" +
            ");"
        );
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {}

    // -----------------------------------------------------------------------
    // pull_sync_info helpers
    // -----------------------------------------------------------------------

    public long getLastPullTimestamp(String tableName) {
        String ts = getLastPullTimestampStr(tableName);
        if (ts == null) return 0L;
        try {
            return java.time.Instant.parse(ts).toEpochMilli();
        } catch (Exception e) {
            return 0L;
        }
    }

    public String getLastPullTimestampStr(String tableName) {
        try (Cursor c = getReadableDatabase().rawQuery(
                "SELECT last_pulled FROM pull_sync_info WHERE table_name = ?",
                new String[]{tableName})) {
            if (c.moveToFirst()) return c.getString(0);
        }
        return null;
    }

    /**
     * Mirrors: UPDATE pull_sync_info SET last_pulled='2024-01-01...' WHERE table_name IN (...)
     */
    public void resetPullTimestampsForTables(String[] tableNames) {
        SQLiteDatabase db = getWritableDatabase();
        for (String table : tableNames) {
            ContentValues cv = new ContentValues();
            cv.put("table_name", table);
            cv.put("last_pulled", FORCE_FULL_SYNC_DATE);
            db.insertWithOnConflict("pull_sync_info", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        }
    }

    /**
     * Mirrors the post-sync UPDATE:
     * UPDATE pull_sync_info SET last_pulled = '<now-1min>' WHERE table_name IN (...)
     */
    public void updatePullTimestampsForTables(String[] tableNames, String timestamp) {
        SQLiteDatabase db = getWritableDatabase();
        for (String table : tableNames) {
            ContentValues cv = new ContentValues();
            cv.put("table_name", table);
            cv.put("last_pulled", timestamp);
            db.insertWithOnConflict("pull_sync_info", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        }
    }

    /**
     * Mirrors: INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)
     */
    public void updatePullTimestamp(String tableName, String isoTimestamp) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("table_name", tableName);
        cv.put("last_pulled", isoTimestamp);
        db.insertWithOnConflict("pull_sync_info", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    // -----------------------------------------------------------------------
    // push_sync_info helpers
    // -----------------------------------------------------------------------

    /**
     * Mirrors updatePushChanges():
     * INSERT OR REPLACE INTO push_sync_info (id, table_name, change_type, data) VALUES (?, ?, ?, ?)
     */
    public void enqueuePushChange(String tableName, String changeType, String rowJson) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("id", UUID.randomUUID().toString());
        cv.put("table_name", tableName);
        cv.put("change_type", changeType);
        cv.put("data", rowJson);
        cv.put("created_at", isoNow());
        db.insert("push_sync_info", null, cv);
    }

    /**
     * Mirrors: SELECT * FROM push_sync_info ORDER BY created_at
     */
    public List<Map<String, Object>> getPushQueue() {
        List<Map<String, Object>> queue = new ArrayList<>();
        try (Cursor c = getReadableDatabase().rawQuery(
                "SELECT id, table_name, change_type, data FROM push_sync_info ORDER BY created_at ASC",
                null)) {
            while (c.moveToNext()) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", c.getString(0));
                item.put("table_name", c.getString(1));
                item.put("change_type", c.getString(2));
                item.put("data", c.getString(3));
                queue.add(item);
            }
        }
        return queue;
    }

    /**
     * Mirrors: DELETE FROM push_sync_info WHERE id = ? AND table_name = ?
     */
    public void deletePushQueueItem(String itemId, String tableName) {
        getWritableDatabase().delete(
                "push_sync_info",
                "id = ? AND table_name = ?",
                new String[]{itemId, tableName}
        );
    }

    // -----------------------------------------------------------------------
    // Data table helpers
    // -----------------------------------------------------------------------

    /**
     * Mirrors the INSERT ... ON CONFLICT(id) DO UPDATE SET ... WHERE excluded.updated_at > table.updated_at
     * "Newer row wins" — server row only overwrites local if it's actually newer.
     */
    public void upsertRow(String tableName, Map<String, Object> row) {
        List<String> cols = new ArrayList<>(row.keySet());
        String colList = join(cols, ", ");
        String placeholders = join(Collections.nCopies(cols.size(), "?"), ", ");

        StringBuilder updateClause = new StringBuilder();
        for (String col : cols) {
            if (!col.equals("id")) {
                if (updateClause.length() > 0) updateClause.append(", ");
                updateClause.append(col).append(" = excluded.").append(col);
            }
        }

        String sql = "INSERT INTO " + tableName +
                " (" + colList + ") VALUES (" + placeholders + ")" +
                " ON CONFLICT(id) DO UPDATE SET " + updateClause +
                " WHERE excluded.updated_at > " + tableName + ".updated_at";

        Object[] args = cols.stream().map(row::get).toArray();
        try {
            getWritableDatabase().execSQL(sql, args);
        } catch (Exception e) {
            Log.e(TAG, "upsertRow failed for " + tableName + ": " + e.getMessage());
        }
    }

    /**
     * Mirrors: PRAGMA table_info(tableName) → returns column names
     */
    public List<String> getTableColumns(String tableName) {
        List<String> columns = new ArrayList<>();
        try (Cursor c = getReadableDatabase().rawQuery(
                "PRAGMA table_info(" + tableName + ")", null)) {
            int nameIdx = c.getColumnIndex("name");
            while (c.moveToNext()) {
                columns.add(c.getString(nameIdx));
            }
        }
        return columns;
    }

    /**
     * Mirrors: PRAGMA foreign_keys=OFF; DELETE FROM table; VACUUM; PRAGMA foreign_keys=ON;
     * Called when all retries fail on first sync.
     */
    public void clearTables(String[] tableNames) {
        SQLiteDatabase db = getWritableDatabase();
        db.execSQL("PRAGMA foreign_keys=OFF");
        for (String table : tableNames) {
            try {
                db.execSQL("DELETE FROM \"" + table + "\"");
            } catch (Exception e) {
                Log.w(TAG, "clearTables: could not clear " + table + ": " + e.getMessage());
            }
        }
        db.execSQL("VACUUM");
        db.execSQL("PRAGMA foreign_keys=ON");
    }

    /**
     * Parses JSON string into a Map. Used by PushSyncHelper to read queue data.
     */
    public Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            JSONObject obj = new JSONObject(json);
            Map<String, Object> map = new LinkedHashMap<>();
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                map.put(key, obj.get(key));
            }
            return map;
        } catch (JSONException e) {
            Log.e(TAG, "parseJsonToMap failed: " + e.getMessage());
            return null;
        }
    }

    private String isoNow() {
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        return sdf.format(new java.util.Date());
    }

    private String join(List<String> list, String sep) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(sep);
            sb.append(list.get(i));
        }
        return sb.toString();
    }
}