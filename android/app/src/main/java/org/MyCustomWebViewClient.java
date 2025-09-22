package org.chimple.bahama;

import android.app.Activity;
import android.util.Log;
// import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import android.widget.Toast;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

public class MyCustomWebViewClient extends BridgeWebViewClient {

    private Activity activity; // Store a reference to the activity

    // The constructor now accepts the Bridge and the Activity
    public MyCustomWebViewClient(Bridge bridge, Activity activity) {
        super(bridge);
        this.activity = activity;
    }

    @Override
    public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
        // It gets called when the WebView's renderer dies.

        // 1. Log the event for your own monitoring
        Log.e("WebViewCrash", "Render process gone! Crashed: " + detail.didCrash());
        FirebaseCrashlytics.getInstance().recordException(
                new RuntimeException("WebView RenderProcessGone: Crashed=" + detail.didCrash())
        );

       // --- REMOVED THIS BLOCK ---
        // Do NOT manually destroy the broken WebView. Let the Activity's lifecycle handle it.
        /*
        if (view != null) {
            if (view.getParent() instanceof ViewGroup) {
                ((ViewGroup) view.getParent()).removeView(view);
            }
            view.destroy();
        }
        */

        // 3. Inform the user and gracefully exit
        Toast.makeText(
                activity.getApplicationContext(),
                "A critical error occurred. Please restart the app.",
                Toast.LENGTH_LONG
        ).show();

        activity.finish(); // Close the activity to prevent a blank screen

        // 4. Return true to tell the system you handled it, preventing the app crash
        return true;
    }
}
