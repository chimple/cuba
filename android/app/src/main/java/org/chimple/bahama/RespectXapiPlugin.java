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

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

/**
 * Sends RESPECT xAPI statements through the launcher-owned IPC service. This avoids making an
 * insecure HTTP request from Cuba's HTTPS WebView when RESPECT runs on a local network address.
 */
@CapacitorPlugin(name = "RespectXapi")
public class RespectXapiPlugin extends Plugin {
    private static final String ACTION_XAPI_OVER_IPC = "org.openeel.action.xapioveripc";
    private static final String KEY_AUTH = "auth";
    private static final String KEY_BODY = "body";
    private static final String KEY_CLIENT_PACKAGE = "xapiIpcClientPackage";
    private static final String KEY_ENDPOINT = "endpoint";
    private static final String KEY_STATUS_CODE = "status";
    private static final int POST_STATEMENTS = 3;
    private static final int WHAT_REQUEST = 1;
    private static final int WHAT_RESPONSE = 2;

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

        private final Messenger replyMessenger = new Messenger(new Handler(Looper.getMainLooper()) {
            @Override
            public void handleMessage(Message message) {
                if (message.what != WHAT_RESPONSE) {
                    return;
                }

                Bundle response = message.getData();
                int status = response.getInt(KEY_STATUS_CODE, 500);
                release();

                if (status == 200) {
                    JSObject result = new JSObject();
                    result.put("status", status);
                    call.resolve(result);
                } else {
                    call.reject("RESPECT xAPI service returned status " + status + ".");
                }
            }
        });

        IpcRequest(PluginCall call, String endpoint, String auth, JSObject statement) {
            this.call = call;
            this.endpoint = endpoint;
            this.auth = auth;
            this.statement = statement;
        }

        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            bound = true;
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
            } catch (Exception exception) {
                release();
                call.reject("Unable to send the RESPECT xAPI statement.", exception);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            release();
        }

        private void release() {
            if (bound) {
                getContext().unbindService(this);
                bound = false;
            }
        }
    }
}
