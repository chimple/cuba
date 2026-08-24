package org.chimple.bahama;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Sends RESPECT xAPI statements through the launcher-owned IPC service. This avoids making an
 * insecure HTTP request from Cuba's HTTPS WebView when RESPECT runs on a local network address.
 */
@CapacitorPlugin(name = "RespectXapi")
public class RespectXapiPlugin extends Plugin {
    private static final String TAG = "RespectXapi";
    private static final String ACTION_XAPI_OVER_IPC = "org.openeel.action.xapioveripc";
    private static final String KEY_AUTH = "auth";
    private static final String KEY_BODY = "body";
    private static final String KEY_CLIENT_PACKAGE = "xapiIpcClientPackage";
    private static final String KEY_ENDPOINT = "endpoint";
    private static final int POST_STATEMENTS = 3;
    private static final int WHAT_REQUEST = 1;
    private static final int WHAT_RESPONSE = 2;
    private static final long RESPONSE_TIMEOUT_MS = 15_000L;

    @PluginMethod
    public void postStatement(PluginCall call) {
        String endpoint = call.getString("endpoint");
        String auth = call.getString("auth");
        String ipcPackage = call.getString("ipcPackage");
        JSObject statement = call.getObject("statement");

        if (isBlank(endpoint) || isBlank(auth) || isBlank(ipcPackage) || statement == null) {
            call.reject("RESPECT xAPI endpoint, authorization, IPC package, and statement are required.");
            return;
        }

        Intent intent = new Intent(ACTION_XAPI_OVER_IPC);
        intent.setPackage(ipcPackage);
        intent.putExtra(KEY_CLIENT_PACKAGE, getContext().getPackageName());

        IpcRequest request = new IpcRequest(call, endpoint, auth, statement);
        Log.i(TAG, "Posting xAPI statement " + request.statementSummary());
        if (!getContext().bindService(intent, request, Context.BIND_AUTO_CREATE)) {
            call.reject("RESPECT xAPI service is unavailable.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private final class IpcRequest implements ServiceConnection {
        private final PluginCall call;
        private final String endpoint;
        private final String auth;
        private final JSObject statement;
        private boolean bound;
        private boolean completed;
        private final Handler mainHandler = new Handler(Looper.getMainLooper());

        private final Runnable timeoutRunnable = () -> fail(
            "Timed out waiting for RESPECT to save the xAPI statement.",
            null
        );

        private final Handler replyHandler = new Handler(Looper.getMainLooper()) {
            @Override
            public void handleMessage(Message message) {
                if (message.what != WHAT_RESPONSE) {
                    return;
                }

                try {
                    String responseBody = message.getData().getString(KEY_BODY);
                    JSONArray postedStatementIds = new JSONArray(responseBody);
                    if (postedStatementIds.length() != 1) {
                        fail("RESPECT did not confirm the xAPI statement was saved.", null);
                        return;
                    }

                    JSObject result = new JSObject();
                    result.put("postedStatementIds", postedStatementIds.toString());
                    Log.i(TAG, "RESPECT accepted xAPI statement " + statementSummary()
                            + " acknowledgement=" + postedStatementIds);
                    succeed(result);
                } catch (JSONException | NullPointerException exception) {
                    fail("RESPECT returned an invalid xAPI response.", exception);
                }
            }
        };

        private final Messenger replyMessenger = new Messenger(replyHandler);

        IpcRequest(PluginCall call, String endpoint, String auth, JSObject statement) {
            this.call = call;
            this.endpoint = endpoint;
            this.auth = auth;
            this.statement = statement;
        }

        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            bound = true;
            if (completed) {
                release();
                return;
            }

            try {
                Bundle requestData = new Bundle();
                requestData.putString(KEY_ENDPOINT, endpoint);
                requestData.putString(KEY_AUTH, auth);
                requestData.putString(KEY_CLIENT_PACKAGE, getContext().getPackageName());
                requestData.putString(KEY_BODY, new JSONArray().put(statement).toString());

                Message request = Message.obtain();
                request.what = WHAT_REQUEST;
                request.arg2 = POST_STATEMENTS;
                request.replyTo = replyMessenger;
                request.setData(requestData);
                new Messenger(service).send(request);
                mainHandler.postDelayed(timeoutRunnable, RESPONSE_TIMEOUT_MS);
            } catch (Exception exception) {
                fail("Unable to send the RESPECT xAPI statement.", exception);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            fail("RESPECT xAPI service disconnected before saving the statement.", null);
        }

        private void succeed(JSObject result) {
            if (completed) {
                return;
            }
            completed = true;
            release();
            call.resolve(result);
        }

        private void fail(String message, Exception exception) {
            if (completed) {
                return;
            }
            completed = true;
            release();
            if (exception == null) {
                Log.e(TAG, message + " " + statementSummary());
            } else {
                Log.e(TAG, message + " " + statementSummary(), exception);
            }
            if (exception == null) {
                call.reject(message);
            } else {
                call.reject(message, exception);
            }
        }

        private String statementSummary() {
            String statementId = statement.optString("id", "");
            JSONObject verb = statement.optJSONObject("verb");
            JSONObject activity = statement.optJSONObject("object");
            String verbId = verb == null ? "" : verb.optString("id", "");
            String activityId = activity == null ? "" : activity.optString("id", "");
            return "statementId=" + statementId
                    + " verb=" + verbId
                    + " activityId=" + activityId;
        }

        private void release() {
            mainHandler.removeCallbacks(timeoutRunnable);
            if (bound) {
                getContext().unbindService(this);
                bound = false;
            }
        }
    }
}
