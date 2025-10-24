package org.chimple.bahama;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;
import android.content.Intent;

import java.lang.ref.WeakReference;

public class MyWebGLMonitor {

    private final WeakReference<Activity> activityRef;
    private final WeakReference<WebView> webViewRef;

    public MyWebGLMonitor(Activity activity, WebView webView) {
        this.activityRef = new WeakReference<>(activity);
        this.webViewRef = new WeakReference<>(webView);
        setupInterface();
        injectWebGLWatcher();
    }

    // JS interface called when WebGL fails or is lost
    private void setupInterface() {
        WebView webView = webViewRef.get();
        if (webView == null) return;

        webView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void onWebGLFail() {
                Log.e("WebGLMonitor", "⚠️ onWebGLFail called from JS");
                restartApp();
            }
        }, "AndroidHandler");
    }

    // Inject JS to watch WebGL context creation and loss
    private void injectWebGLWatcher() {
        WebView webView = webViewRef.get();
        if (webView == null) return;

        Log.e("WebGLMonitor", "Injecting WebGL watcher JS");

        webView.evaluateJavascript(
                "(() => {" +
                        "console.log('✅ WebGL monitor injected');" +
                        "const canvas = document.getElementById('GameCanvas');" +
                        "if (canvas) {" +
                        "   console.log('✅ GameCanvas found');" +
                        "} else {" +
                        "   console.log('❌ GameCanvas NOT found');" +
                        "}" +
                        "const originalGetContext = HTMLCanvasElement.prototype.getContext;" +
                        "HTMLCanvasElement.prototype.getContext = function(type) {" +
                        "  const ctx = originalGetContext.call(this, type);" +
                        "  if (!ctx && type.includes('webgl')) {" +
                        "    console.error('⚠️ WebGL context creation failed');" +
                        "    AndroidHandler.onWebGLFail();" +
                        "  }" +
                        "  return ctx;" +
                        "};" +
                        "if (canvas) {" +
                        "  canvas.addEventListener('webglcontextlost', e => {" +
                        "    e.preventDefault();" + // prevents automatic context destruction
                        "    console.error('⚠️ WebGL context lost event');" +
                        "    AndroidHandler.onWebGLFail();" +
                        "  }, false);" +
                        "}" +
                        "})()", null
        );
    }

    // Allow reinjection of JS when app comes back from background
    public void reInjectWatcher() {
        WebView webView = webViewRef.get();
        if (webView != null) {
            injectWebGLWatcher();
        }
    }

    // Restart app safely
    private void restartApp() {
        Activity activity = activityRef.get();
        if (activity == null) {
            Log.e("WebGLMonitor", "Activity is null, cannot restart app");
            return;
        }

        Log.e("WebGLMonitor", "🚀 Restarting app due to WebGL failure");
        Handler handler = new Handler(Looper.getMainLooper());
        handler.post(() -> {
            Intent intent = activity.getPackageManager()
                    .getLaunchIntentForPackage(activity.getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                activity.startActivity(intent);
            }
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);
        });
    }
}
