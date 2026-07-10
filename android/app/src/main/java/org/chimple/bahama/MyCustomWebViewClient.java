package org.chimple.bahama;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

public class MyCustomWebViewClient extends BridgeWebViewClient {

    private final Activity activity;

    public MyCustomWebViewClient(Bridge bridge, Activity activity) {
        super(bridge); // ✅ only Bridge is passed to super
        this.activity = activity;
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
