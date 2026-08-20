package org.chimple.bahama;

import android.app.Activity;
import android.util.Log;
import android.webkit.WebView;

public class MyWebGLMonitor {
    private static final String TAG = "MyWebGLMonitor";

    private final Activity activity;
    private final WebView webView;

    public MyWebGLMonitor(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        reInjectWatcher();
    }

    public void reInjectWatcher() {
        if (activity == null || webView == null) {
            Log.e(TAG, "Cannot inject WebGL watcher: activity or WebView is null");
            return;
        }

        activity.runOnUiThread(() -> webView.post(() -> webView.evaluateJavascript(getWatcherScript(), null)));
    }

    private String getWatcherScript() {
        return "(function(){"
                + "if(window.__chimpleWebGLMonitorInstalled){return;}"
                + "window.__chimpleWebGLMonitorInstalled=true;"
                + "window.addEventListener('webglcontextlost',function(event){"
                + "console.error('WebGL context lost');"
                + "if(event&&event.preventDefault){event.preventDefault();}"
                + "},false);"
                + "window.addEventListener('webglcontextrestored',function(){"
                + "console.info('WebGL context restored');"
                + "},false);"
                + "})();";
    }
}
