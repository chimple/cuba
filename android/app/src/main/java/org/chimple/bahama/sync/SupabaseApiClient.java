package org.chimple.bahama.sync;

import android.content.Context;
import android.util.Log;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

public class SupabaseApiClient {

    private static final String TAG = "SupabaseApiClient";
    private final String supabaseUrl;
    private final String supabaseAnonKey;

    // Mirrors MUTATE_TYPES enum in TypeScript
    public static final String MUTATE_INSERT = "INSERT";
    public static final String MUTATE_UPDATE = "UPDATE";
    public static final String MUTATE_DELETE = "DELETE";

    /**
     * Mirrors PostgrestSingleResponse — carries status, error code, message, details.
     * PushSyncHelper reads these fields directly instead of catching exceptions,
     * matching how the TS code reads mutate?.error, mutate?.status, etc.
     */
    public static class MutateResult {
        public final int status;
        public final String errorCode;
        public final String errorMessage;
        public final String errorDetails;

        public MutateResult(int status, String errorCode, String errorMessage, String errorDetails) {
            this.status = status;
            this.errorCode = errorCode != null ? errorCode : "";
            this.errorMessage = errorMessage != null ? errorMessage : "";
            this.errorDetails = errorDetails != null ? errorDetails : "";
        }

        /** Mirrors: !mutate || mutate.error */
        public boolean hasError() {
            return status >= 400 || !errorCode.isEmpty() || !errorMessage.isEmpty();
        }

        public static MutateResult success() {
            return new MutateResult(200, "", "", "");
        }
    }

    public SupabaseApiClient(Context context) {
        this.supabaseUrl = readBuildConfigString("SUPABASE_URL", "REACT_APP_SUPABASE_URL");
        this.supabaseAnonKey = readBuildConfigString("SUPABASE_ANON_KEY", "REACT_APP_SUPABASE_ANON_KEY");
     }

    /**
     * Mirrors getTablesData() — calls sql_sync_all RPC.
     *
     * POST /rest/v1/rpc/sql_sync_all
     * body: {
     *   p_updated_at: { "user": "2024-...", "class": "2024-..." },
     *   p_tables:     ["user", "class", ...],
     *   p_is_first_time: false
     * }
     *
     * Returns: map of tableName -> list of row maps
     * Throws on network/server error (caller handles retry).
     */
    public Map<String, List<Map<String, Object>>> getTablesData(
            String[] tableNames,
            Map<String, String> lastPullMap,
            boolean isFirstSync
    ) throws Exception {
        if (supabaseUrl == null || supabaseUrl.isEmpty()) {
            throw new IllegalStateException("Missing Supabase URL");
        }
        if (supabaseAnonKey == null || supabaseAnonKey.isEmpty()) {
            throw new IllegalStateException("Missing Supabase anon key");
        }

        JSONObject body = new JSONObject();
        JSONObject pUpdatedAt = new JSONObject();
        if (lastPullMap != null) {
            for (Map.Entry<String, String> entry : lastPullMap.entrySet()) {
                pUpdatedAt.put(entry.getKey(), entry.getValue());
            }
        }
        body.put("p_updated_at", pUpdatedAt);
        body.put("p_tables", new JSONArray(tableNames));
        body.put("p_is_first_time", isFirstSync);

        HttpURLConnection connection = null;
        try {
            URL url = new URI(normalizeBaseUrl(supabaseUrl) + "/rest/v1/rpc/sql_sync_all").toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setDoOutput(true);
            connection.setRequestProperty("apikey", supabaseAnonKey);
            connection.setRequestProperty("Authorization", "Bearer " + supabaseAnonKey);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");

            byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = connection.getOutputStream()) {
                os.write(payload);
            }

            int status = connection.getResponseCode();
            String responseBody = readStream(status >= 200 && status < 300
                    ? connection.getInputStream()
                    : connection.getErrorStream());

            if (status < 200 || status >= 300) {
                throw new IllegalStateException("Supabase RPC failed (" + status + "): " + responseBody);
            }

            Object parsed = new JSONTokener(responseBody).nextValue();
            if (!(parsed instanceof JSONObject)) {
                throw new IllegalStateException("Unexpected RPC response: " + responseBody);
            }

            return jsonObjectToTableMap((JSONObject) parsed);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * Mirrors mutate() — INSERT, UPDATE, or DELETE a single row via Supabase REST.
     *
     * Returns MutateResult (never throws) so PushSyncHelper can inspect
     * status + error fields exactly like TS reads PostgrestSingleResponse.
     *
     * INSERT → POST   /rest/v1/<table>
     * UPDATE → PATCH  /rest/v1/<table>?id=eq.<id>
     * DELETE → DELETE /rest/v1/<table>?id=eq.<id>
     */
    public MutateResult mutate(
            String changeType,
            String tableName,
            Map<String, Object> rowData,
            String id
    ) {
        // Always set updated_at to now, mirrors: data.updated_at = new Date().toISOString()
        rowData.put("updated_at", isoNow());

        try {
            switch (changeType) {
                case MUTATE_INSERT: {
                    // POST /rest/v1/<tableName>
                    // body: rowData as JSON
                    return executeMutation("POST", tableName, null, rowData);
                }
                case MUTATE_UPDATE: {
                    // PATCH /rest/v1/<tableName>?id=eq.<id>
                    // body: rowData WITHOUT the id field (mirrors: delete data.id)
                    Map<String, Object> updateData = new java.util.HashMap<>(rowData);
                    updateData.remove("id");
                    return executeMutation("PATCH", tableName, "?id=eq." + encodeQueryParam(id), updateData);
                }
                case MUTATE_DELETE: {
                    // DELETE /rest/v1/<tableName>?id=eq.<id>
                    return executeMutation("DELETE", tableName, "?id=eq." + encodeQueryParam(id), null);
                }
                default:
                    Log.w(TAG, "Unknown changeType: " + changeType);
                    return MutateResult.success();
            }
        } catch (Exception e) {
            // Parse HTTP error response into MutateResult fields
            // so PushSyncHelper can check status + errorCode + errorMessage
            Log.e(TAG, "mutate failed: " + e.getMessage());
            return new MutateResult(500, "", e.getMessage(), "");
        }
    }

    private String isoNow() {
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        return sdf.format(new java.util.Date());
    }

    private MutateResult executeMutation(
            String method,
            String tableName,
            String querySuffix,
            Map<String, Object> bodyData
    ) throws Exception {
        if (supabaseUrl == null || supabaseUrl.isEmpty()) {
            return new MutateResult(500, "", "Missing Supabase URL", "");
        }
        if (supabaseAnonKey == null || supabaseAnonKey.isEmpty()) {
            return new MutateResult(500, "", "Missing Supabase anon key", "");
        }

        HttpURLConnection connection = null;
        try {
            String suffix = querySuffix != null ? querySuffix : "";
            URL url = new URI(normalizeBaseUrl(supabaseUrl) + "/rest/v1/" + tableName + suffix).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod(method);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("apikey", supabaseAnonKey);
            connection.setRequestProperty("Authorization", "Bearer " + supabaseAnonKey);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Prefer", "return=minimal");

            if (bodyData != null) {
                connection.setDoOutput(true);
                byte[] payload = new JSONObject(bodyData).toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = connection.getOutputStream()) {
                    os.write(payload);
                }
            }

            int status = connection.getResponseCode();
            String responseBody = readStream(status >= 200 && status < 300
                    ? connection.getInputStream()
                    : connection.getErrorStream());

            if (status >= 200 && status < 300) {
                return new MutateResult(status, "", "", "");
            }

            String errorCode = "";
            String errorMessage = responseBody;
            String errorDetails = "";
            if (responseBody != null && !responseBody.isEmpty()) {
                Object parsed = new JSONTokener(responseBody).nextValue();
                if (parsed instanceof JSONObject) {
                    JSONObject errorJson = (JSONObject) parsed;
                    errorCode = errorJson.optString("code", "");
                    errorMessage = errorJson.optString("message", responseBody);
                    errorDetails = errorJson.optString("details", "");
                }
            }
            return new MutateResult(status, errorCode, errorMessage, errorDetails);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String encodeQueryParam(String value) throws Exception {
        return URLEncoder.encode(value, StandardCharsets.UTF_8.name());
    }

    private String readBuildConfigString(String... fieldNames) {
        for (String fieldName : fieldNames) {
            try {
                Field field = Class.forName("org.chimple.bahama.BuildConfig").getField(fieldName);
                Object value = field.get(null);
                if (value instanceof String && !((String) value).isEmpty()) {
                    return (String) value;
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String normalizeBaseUrl(String baseUrl) {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String readStream(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }

    private Map<String, List<Map<String, Object>>> jsonObjectToTableMap(JSONObject jsonObject) throws Exception {
        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        JSONArray names = jsonObject.names();
        if (names == null) {
            return result;
        }

        for (int i = 0; i < names.length(); i++) {
            String key = names.getString(i);
            Object value = jsonObject.get(key);
            if (!(value instanceof JSONArray)) {
                continue;
            }

            JSONArray rowsJson = (JSONArray) value;
            List<Map<String, Object>> rows = new ArrayList<>(rowsJson.length());
            for (int j = 0; j < rowsJson.length(); j++) {
                Object row = rowsJson.get(j);
                if (row instanceof JSONObject) {
                    rows.add(jsonObjectToMap((JSONObject) row));
                }
            }
            result.put(key, rows);
        }

        return result;
    }

    private Map<String, Object> jsonObjectToMap(JSONObject jsonObject) throws Exception {
        Map<String, Object> result = new HashMap<>();
        JSONArray names = jsonObject.names();
        if (names == null) {
            return result;
        }

        for (int i = 0; i < names.length(); i++) {
            String key = names.getString(i);
            result.put(key, jsonValueToJava(jsonObject.get(key)));
        }
        return result;
    }

    private Object jsonValueToJava(Object value) throws Exception {
        if (value == JSONObject.NULL) {
            return null;
        }
        if (value instanceof JSONObject) {
            return jsonObjectToMap((JSONObject) value);
        }
        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            List<Object> list = new ArrayList<>(array.length());
            for (int i = 0; i < array.length(); i++) {
                list.add(jsonValueToJava(array.get(i)));
            }
            return list;
        }
        return value;
    }
}
