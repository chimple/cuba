package org.chimple.bahama;

import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class DailySyncWorker extends Worker {
    private static final String TAG = "DailySyncWorker";
    private static final String APP_PREFS = "AppPreferences";
    private static final String SYNC_PREFS = "BackgroundSyncPrefs";
    private static final String SYNC_STATUS_KEY = "last_sync_status";
    private static final String SYNC_AT_KEY = "last_sync_at";
    private static final String SYNC_ERROR_KEY = "last_sync_error";
    private static final String DEFAULT_LAST_MODIFIED = "2024-01-01T00:00:00.000Z";
    private static final String DB_FILE_NAME = "db_issue10SQLite.db";
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private static final String CHANGE_TYPE_INSERT = "insert";
    private static final String CHANGE_TYPE_UPDATE = "update";
    private static final String CHANGE_TYPE_DELETE = "delete";

    private static final List<String> DEFAULT_SYNC_TABLES = Arrays.asList(
            "curriculum",
            "subject",
            "grade",
            "language",
            "course",
            "school",
            "chapter",
            "lesson",
            "live_quiz_room",
            "badge",
            "sticker",
            "reward",
            "class",
            "user",
            "class_invite_code",
            "class_user",
            "favorite_lesson",
            "class_course",
            "chapter_lesson",
            "parent_user",
            "program_user",
            "school_course",
            "school_user",
            "user_badge",
            "user_bonus",
            "user_course",
            "user_sticker",
            "assignment",
            "assignment_user",
            "result",
            "assignment_cart",
            "req_new_school",
            "chapter_links",
            "program",
            "special_users",
            "ops_requests",
            "geo_locations",
            "rive_reward",
            "framework",
            "domain",
            "competency",
            "outcome",
            "skill",
            "skill_relation",
            "skill_lesson",
            "fc_question",
            "fc_school_visit",
            "fc_user_forms",
            "locale",
            "language_locale",
            "subject_lesson",
            "sticker_book",
            "user_sticker_book"
    );

    public DailySyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "Daily background sync started");

        if (BuildConfig.SUPABASE_URL == null || BuildConfig.SUPABASE_URL.trim().isEmpty()
                || BuildConfig.SUPABASE_KEY == null || BuildConfig.SUPABASE_KEY.trim().isEmpty()) {
            String error = "Missing SUPABASE_URL or SUPABASE_KEY in BuildConfig";
            Log.e(TAG, error);
            persistRunStatus("failure", error);
            return Result.failure();
        }

        SQLiteDatabase db = null;
        try {
            db = openLocalDatabase();
            ensureSyncTables(db);
            OkHttpClient client = new OkHttpClient();

            pushPendingChanges(db, client);
            Map<String, String> lastPulled = readLastPulledMap(db, DEFAULT_SYNC_TABLES);
            JSONObject payload = buildSyncPayload(DEFAULT_SYNC_TABLES, lastPulled);
            JSONObject response = fetchSyncPayload(client, payload);
            applySyncResponse(db, response, DEFAULT_SYNC_TABLES);

            persistRunStatus("success", null);
            Log.i(TAG, "Daily background sync finished successfully");
            return Result.success();
        } catch (IOException | JSONException e) {
            Log.e(TAG, "Daily sync failed with retriable error", e);
            persistRunStatus("retry", e.getMessage());
            return Result.retry();
        } catch (Exception e) {
            Log.e(TAG, "Daily sync failed", e);
            persistRunStatus("failure", e.getMessage());
            return Result.failure();
        } finally {
            if (db != null && db.isOpen()) {
                db.close();
            }
        }
    }

    private SQLiteDatabase openLocalDatabase() {
        File dbFile = getApplicationContext().getDatabasePath(DB_FILE_NAME);
        if (!dbFile.exists()) {
            throw new IllegalStateException("SQLite database not found: " + dbFile.getAbsolutePath());
        }
        return SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
    }

    private void ensureSyncTables(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS pull_sync_info (" +
                "table_name TEXT NOT NULL PRIMARY KEY," +
                "last_pulled TIMESTAMP NOT NULL" +
                ")");
        db.execSQL("CREATE TABLE IF NOT EXISTS push_sync_info (" +
                "id TEXT NOT NULL PRIMARY KEY," +
                "table_name TEXT NOT NULL," +
                "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                "change_type TEXT NOT NULL," +
                "data TEXT NOT NULL" +
                ")");
    }

    private void pushPendingChanges(SQLiteDatabase db, OkHttpClient client) throws IOException, JSONException {
        List<PendingMutation> mutations = readPendingMutations(db);
        if (mutations.isEmpty()) {
            Log.i(TAG, "No pending push_sync_info rows found");
            return;
        }

        Log.i(TAG, "Pushing " + mutations.size() + " pending local mutation(s)");
        for (PendingMutation mutation : mutations) {
            boolean success = pushSingleMutation(client, mutation);
            if (success) {
                removePendingMutation(db, mutation);
                updateLastPulled(db, mutation.tableName, nowIsoString());
                Log.i(TAG, "Pushed mutation successfully for " + mutation.tableName + " / " + mutation.id);
            } else {
                Log.w(TAG, "Leaving mutation in push_sync_info for retry: " + mutation.tableName + " / " + mutation.id);
            }
        }
    }

    private List<PendingMutation> readPendingMutations(SQLiteDatabase db) throws JSONException {
        List<PendingMutation> mutations = new java.util.ArrayList<>();
        Cursor cursor = db.rawQuery(
                "SELECT id, table_name, change_type, data, created_at FROM push_sync_info ORDER BY created_at",
                null
        );
        try {
            while (cursor.moveToNext()) {
                mutations.add(new PendingMutation(
                        cursor.getString(0),
                        cursor.getString(1),
                        cursor.getString(2),
                        new JSONObject(cursor.getString(3)),
                        cursor.getString(4)
                ));
            }
        } finally {
            cursor.close();
        }
        return mutations;
    }

    private boolean pushSingleMutation(OkHttpClient client, PendingMutation mutation) throws IOException {
        String changeType = mutation.changeType == null ? "" : mutation.changeType.trim().toLowerCase(java.util.Locale.US);
        Request request;

        switch (changeType) {
            case CHANGE_TYPE_INSERT:
                request = buildInsertRequest(mutation);
                break;
            case CHANGE_TYPE_UPDATE:
                request = buildUpdateRequest(mutation);
                break;
            case CHANGE_TYPE_DELETE:
                request = buildDeleteRequest(mutation);
                break;
            default:
                Log.e(TAG, "Unsupported change_type in push_sync_info: " + mutation.changeType);
                return false;
        }

        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful() || response.code() == 409) {
                return true;
            }

            String body = "";
            ResponseBody responseBody = response.body();
            if (responseBody != null) {
                body = responseBody.string();
            }
            Log.e(TAG, "Push mutation failed: HTTP " + response.code() + " " + response.message() + " body=" + body);
            return false;
        }
    }

    private Request buildInsertRequest(PendingMutation mutation) {
        RequestBody body = RequestBody.create(mutation.data.toString(), JSON);
        return baseRequestBuilder(getRestTableUrl(mutation.tableName))
                .post(body)
                .addHeader("Prefer", "return=minimal")
                .build();
    }

    private Request buildUpdateRequest(PendingMutation mutation) throws IOException {
        String rowId = mutation.data.optString("id", mutation.id);
        if (rowId == null || rowId.trim().isEmpty()) {
            throw new IOException("Missing id for update mutation on table " + mutation.tableName);
        }

        RequestBody body = RequestBody.create(mutation.data.toString(), JSON);
        return baseRequestBuilder(buildRowUrl(mutation.tableName, rowId))
                .patch(body)
                .addHeader("Prefer", "return=minimal")
                .build();
    }

    private Request buildDeleteRequest(PendingMutation mutation) throws IOException {
        String rowId = mutation.data.optString("id", mutation.id);
        if (rowId == null || rowId.trim().isEmpty()) {
            throw new IOException("Missing id for delete mutation on table " + mutation.tableName);
        }

        return baseRequestBuilder(buildRowUrl(mutation.tableName, rowId))
                .delete()
                .build();
    }

    private Request.Builder baseRequestBuilder(String url) {
        return new Request.Builder()
                .url(url)
                .addHeader("apikey", BuildConfig.SUPABASE_KEY)
                .addHeader("Authorization", getAuthorizationHeader())
                .addHeader("Content-Type", "application/json");
    }

    private String getAuthorizationHeader() {
        SharedPreferences appPrefs = getApplicationContext().getSharedPreferences(APP_PREFS, Context.MODE_PRIVATE);
        String accessToken = appPrefs.getString("supabase_access_token", null);
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            return "Bearer " + accessToken;
        }
        return "Bearer " + BuildConfig.SUPABASE_KEY;
    }

    private String getRestTableUrl(String tableName) {
        return getNormalizedSupabaseUrl() + "/rest/v1/" + tableName;
    }

    private String buildRowUrl(String tableName, String rowId) throws IOException {
        return getRestTableUrl(tableName) + "?id=eq." + URLEncoder.encode(rowId, java.nio.charset.StandardCharsets.UTF_8.name());
    }

    private String getNormalizedSupabaseUrl() {
        String url = BuildConfig.SUPABASE_URL;
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    private void removePendingMutation(SQLiteDatabase db, PendingMutation mutation) {
        db.beginTransaction();
        try {
            db.delete(
                    "push_sync_info",
                    "id = ? AND table_name = ?",
                    new String[]{mutation.id, mutation.tableName}
            );
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    private Map<String, String> readLastPulledMap(SQLiteDatabase db, List<String> tables) {
        Map<String, String> result = new LinkedHashMap<>();
        Set<String> tableSet = new LinkedHashSet<>(tables);
        Cursor cursor = db.rawQuery("SELECT table_name, last_pulled FROM pull_sync_info", null);
        try {
            while (cursor.moveToNext()) {
                String tableName = cursor.getString(0);
                String lastPulled = cursor.getString(1);
                if (tableSet.contains(tableName) && lastPulled != null && !lastPulled.isEmpty()) {
                    result.put(tableName, lastPulled);
                }
            }
        } finally {
            cursor.close();
        }

        for (String tableName : tables) {
            result.putIfAbsent(tableName, DEFAULT_LAST_MODIFIED);
        }
        return result;
    }

    private JSONObject buildSyncPayload(List<String> tables, Map<String, String> lastPulled) throws JSONException {
        JSONObject payload = new JSONObject();
        JSONObject updatedAtJson = new JSONObject();
        JSONArray tableArray = new JSONArray();

        for (String tableName : tables) {
            tableArray.put(tableName);
            updatedAtJson.put(tableName, lastPulled.getOrDefault(tableName, DEFAULT_LAST_MODIFIED));
        }

        payload.put("p_updated_at", updatedAtJson);
        payload.put("p_tables", tableArray);
        payload.put("p_is_first_time", false);
        return payload;
    }

    private JSONObject fetchSyncPayload(OkHttpClient client, JSONObject payload) throws IOException, JSONException {
        RequestBody body = RequestBody.create(payload.toString(), JSON);
        Request request = new Request.Builder()
                .url(getNormalizedSupabaseUrl() + "/rest/v1/rpc/sql_sync_all")
                .post(body)
                .addHeader("apikey", BuildConfig.SUPABASE_KEY)
                .addHeader("Authorization", getAuthorizationHeader())
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Sync API failed: HTTP " + response.code() + " - " + response.message());
            }
            if (response.body() == null) {
                throw new IOException("Sync API returned an empty body");
            }
            String responseBody = response.body().string();
            if (responseBody.trim().isEmpty()) {
                throw new IOException("Sync API returned a blank body");
            }
            return new JSONObject(responseBody);
        }
    }

    private String nowIsoString() {
        return new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
                .format(new java.util.Date());
    }

    private static final class PendingMutation {
        final String id;
        final String tableName;
        final String changeType;
        final JSONObject data;
        final String createdAt;

        PendingMutation(String id, String tableName, String changeType, JSONObject data, String createdAt) {
            this.id = id;
            this.tableName = tableName;
            this.changeType = changeType;
            this.data = data;
            this.createdAt = createdAt;
        }
    }

    private void applySyncResponse(SQLiteDatabase db, JSONObject response, List<String> requestedTables) throws JSONException {
        long syncTimestamp = System.currentTimeMillis();
        String syncIso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
                .format(new java.util.Date(syncTimestamp));

        db.beginTransaction();
        try {
            for (String tableName : requestedTables) {
                if (!response.has(tableName) || response.isNull(tableName)) {
                    continue;
                }

                JSONArray rows = response.optJSONArray(tableName);
                if (rows == null) {
                    continue;
                }

                upsertTableRows(db, tableName, rows);
                updateLastPulled(db, tableName, syncIso);
                Log.i(TAG, "Applied " + rows.length() + " row(s) to table " + tableName);
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    private void upsertTableRows(SQLiteDatabase db, String tableName, JSONArray rows) throws JSONException {
        Set<String> validColumns = getTableColumns(db, tableName);
        if (validColumns.isEmpty()) {
            Log.w(TAG, "Skipping unknown SQLite table: " + tableName);
            return;
        }

        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row == null) {
                continue;
            }

            ContentValues values = new ContentValues();
            Iterator<String> keys = row.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                if (!validColumns.contains(key)) {
                    continue;
                }
                putJsonValue(values, key, row.get(key));
            }

            if (values.size() == 0) {
                continue;
            }

            upsertRowWithTimestampConflictRule(db, tableName, values, validColumns);
        }
    }

    private void upsertRowWithTimestampConflictRule(
            SQLiteDatabase db,
            String tableName,
            ContentValues values,
            Set<String> validColumns
    ) {
        boolean hasIdColumn = validColumns.contains("id");
        boolean hasIdValue = values.containsKey("id") && values.get("id") != null;
        boolean hasUpdatedAtColumn = validColumns.contains("updated_at");
        boolean hasUpdatedAtValue = values.containsKey("updated_at") && values.get("updated_at") != null;

        if (!hasIdColumn || !hasIdValue) {
            long insertResult = db.insertWithOnConflict(
                    tableName,
                    null,
                    values,
                    SQLiteDatabase.CONFLICT_REPLACE
            );
            if (insertResult == -1) {
                throw new IllegalStateException("Failed to insert row without id conflict handling for table " + tableName);
            }
            return;
        }

        List<String> columns = new java.util.ArrayList<>(values.keySet());
        String sql = buildUpsertSql(tableName, columns, hasUpdatedAtColumn && hasUpdatedAtValue);
        Object[] bindArgs = buildBindArgs(values, columns);
        db.execSQL(sql, bindArgs);
    }

    private String buildUpsertSql(String tableName, List<String> columns, boolean useTimestampGuard) {
        StringBuilder sql = new StringBuilder();
        sql.append("INSERT INTO ").append(tableName).append(" (");
        sql.append(joinColumns(columns));
        sql.append(") VALUES (");
        sql.append(repeatPlaceholders(columns.size()));
        sql.append(") ON CONFLICT(id) DO UPDATE SET ");
        sql.append(buildUpdateAssignments(columns));
        if (useTimestampGuard) {
            sql.append(" WHERE excluded.updated_at > ").append(tableName).append(".updated_at");
        }
        return sql.toString();
    }

    private String joinColumns(List<String> columns) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) {
                builder.append(", ");
            }
            builder.append(columns.get(i));
        }
        return builder.toString();
    }

    private String repeatPlaceholders(int count) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < count; i++) {
            if (i > 0) {
                builder.append(", ");
            }
            builder.append("?");
        }
        return builder.toString();
    }

    private String buildUpdateAssignments(List<String> columns) {
        StringBuilder builder = new StringBuilder();
        boolean addedAny = false;
        for (String column : columns) {
            if ("id".equals(column)) {
                continue;
            }
            if (addedAny) {
                builder.append(", ");
            }
            builder.append(column).append(" = excluded.").append(column);
            addedAny = true;
        }

        if (!addedAny) {
            builder.append("id = excluded.id");
        }
        return builder.toString();
    }

    private Object[] buildBindArgs(ContentValues values, List<String> columns) {
        Object[] bindArgs = new Object[columns.size()];
        for (int i = 0; i < columns.size(); i++) {
            bindArgs[i] = toBindArg(values.get(columns.get(i)));
        }
        return bindArgs;
    }

    private Object toBindArg(Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        if (rawValue instanceof Boolean) {
            return ((Boolean) rawValue) ? 1 : 0;
        }
        return rawValue;
    }

    private Set<String> getTableColumns(SQLiteDatabase db, String tableName) {
        Set<String> columns = new LinkedHashSet<>();
        Cursor cursor = db.rawQuery("PRAGMA table_info(" + tableName + ")", null);
        try {
            while (cursor.moveToNext()) {
                columns.add(cursor.getString(cursor.getColumnIndexOrThrow("name")));
            }
        } finally {
            cursor.close();
        }
        return columns;
    }

    private void updateLastPulled(SQLiteDatabase db, String tableName, String syncIso) {
        ContentValues values = new ContentValues();
        values.put("table_name", tableName);
        values.put("last_pulled", syncIso);
        db.insertWithOnConflict("pull_sync_info", null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }

    private void putJsonValue(ContentValues values, String key, Object rawValue) throws JSONException {
        if (rawValue == null || rawValue == JSONObject.NULL) {
            values.putNull(key);
            return;
        }

        if (rawValue instanceof Boolean) {
            values.put(key, (Boolean) rawValue);
            return;
        }
        if (rawValue instanceof Integer) {
            values.put(key, (Integer) rawValue);
            return;
        }
        if (rawValue instanceof Long) {
            values.put(key, (Long) rawValue);
            return;
        }
        if (rawValue instanceof Float) {
            values.put(key, (Float) rawValue);
            return;
        }
        if (rawValue instanceof Double) {
            values.put(key, (Double) rawValue);
            return;
        }
        if (rawValue instanceof Number) {
            values.put(key, rawValue.toString());
            return;
        }
        if (rawValue instanceof JSONArray || rawValue instanceof JSONObject) {
            values.put(key, rawValue.toString());
            return;
        }

        values.put(key, String.valueOf(rawValue));
    }

    private void persistRunStatus(String status, String errorMessage) {
        SharedPreferences prefs = getApplicationContext().getSharedPreferences(SYNC_PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(SYNC_STATUS_KEY, status);
        editor.putLong(SYNC_AT_KEY, System.currentTimeMillis());
        if (errorMessage != null) {
            editor.putString(SYNC_ERROR_KEY, errorMessage);
        } else {
            editor.remove(SYNC_ERROR_KEY);
        }
        editor.apply();
    }
}
