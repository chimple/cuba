package org.chimple.bahama;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import java.util.Collections;

import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class MyCustomWebViewClient extends BridgeWebViewClient {

    private final Activity activity;

    public MyCustomWebViewClient(Bridge bridge, Activity activity) {
        super(bridge); // ✅ only Bridge is passed to super
        this.activity = activity;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        if (!isRespectLaunchActive(request)) {
            return super.shouldInterceptRequest(view, request);
        }

        try {
            Request cacheRequest = new Request.Builder()
                    .url(request.getUrl().toString())
                    .build();
            Response response = RespectHttpClient.getOkHttpClient()
                    .newCall(cacheRequest)
                    .execute();
            ResponseBody body = response.body();
            if (response.isSuccessful() && body != null) {
                String[] contentType = getContentType(response.header("Content-Type"));
                return new WebResourceResponse(
                        contentType[0],
                        contentType[1],
                        response.code(),
                        response.message(),
                        Collections.emptyMap(),
                        body.byteStream()
                );
            }
            response.close();
        } catch (Exception exception) {
            Log.w("RespectCache", "Cached resource request failed", exception);
        }

        return super.shouldInterceptRequest(view, request);
    }

    private boolean isRespectLaunchActive(WebResourceRequest request) {
        if (request == null || !"GET".equalsIgnoreCase(request.getMethod())
                || MainActivity.activity_id.isEmpty()
                || RespectHttpClient.getOkHttpClient() == null) {
            return false;
        }

        String scheme = request.getUrl().getScheme();
        String host = request.getUrl().getHost();
        if ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host)) {
            return false;
        }
        return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
    }

    private String[] getContentType(String header) {
        if (header == null || header.trim().isEmpty()) {
            return new String[] {"application/octet-stream", "UTF-8"};
        }

        String[] parts = header.split(";");
        String mimeType = parts[0].trim();
        String encoding = "UTF-8";
        for (int index = 1; index < parts.length; index++) {
            String part = parts[index].trim();
            if (part.toLowerCase().startsWith("charset=")) {
                encoding = part.substring("charset=".length()).trim();
            }
        }
        return new String[] {mimeType, encoding};
    }

    @Override
public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
    Log.e("WebViewCrash", "Renderer gone. DidCrash=" + detail.didCrash());

    // Destroy the dead WebView
    if (view != null) view.destroy();

    // Relaunch app for **any renderer death**
    Handler handler = new Handler(Looper.getMainLooper());
    handler.post(() -> {
        Intent intent = view.getContext().getPackageManager()
                .getLaunchIntentForPackage(view.getContext().getPackageName());
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            view.getContext().startActivity(intent);
        }

        // Kill old process
        android.os.Process.killProcess(android.os.Process.myPid());
        System.exit(0);
    });

    return true; // We handled it
}

}
