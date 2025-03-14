package org.chimple.bahama;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.json.JSONObject;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    // private RespectClientManager respectClientManager; // Declare RespectClientManager
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        

        // Handle global crash exceptions
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            SharedPreferences sharedPreferences = getSharedPreferences("AppPreferences", MODE_PRIVATE);
            String userId = sharedPreferences.getString("userId", null);
            if (userId != null) {
                FirebaseCrashlytics.getInstance().setUserId(userId);
            }
            FirebaseCrashlytics.getInstance().recordException(throwable);
        });

        // Register plugins
        registerPlugin(PortPlugin.class);
        registerPlugin(NativeSSOPlugin.class);

        super.onCreate(savedInstanceState);
//        var respectClientManager = RespectClientManager();
//        respectClientManager.bindService(this);
        // Hide navigation bar and set fullscreen mode
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);

        // Initialize Firebase services
        FirebaseApp.initializeApp(this);
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        firebaseAppCheck.installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance());
 // Initialize and bind RespectClientManager
//        respectClientManager = new RespectClientManager(); // Initialize RespectClientManager
//        respectClientManager.bindService(this); // Bind the service

        // ✅ Handle deep linking on cold start
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) {
            Log.e("MainActivity", "❌ ERROR: No deep link data found in intent!");
            return;
        }
    
        Uri data = intent.getData();
        Log.d("MainActivity", "🌍 Deep Link Received: " + data.toString());
    
        // Extract all query parameters
        JSONObject deepLinkData = new JSONObject();
        try {
            for (String key : data.getQueryParameterNames()) {
                deepLinkData.put(key, data.getQueryParameter(key));
            }
        } catch (Exception e) {
            Log.e("MainActivity", "❌ ERROR: Failed to parse query parameters!", e);
            return;
        }
    
        Log.d("MainActivity", "🚀 Extracted Parameters: " + deepLinkData.toString());
    
        // Ensure WebView is ready before sending deep link
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            sendDeepLinkToCapacitor(deepLinkData);
        }, 1000); // Delay 1 second to ensure WebView is ready
    }
    
    private void sendDeepLinkToCapacitor(JSONObject deepLinkData) {
        if (this.getBridge() == null || this.isDestroyed()) {
            Log.e("MainActivity", "❌ ERROR: Bridge is NULL or Activity is destroyed! Skipping event dispatch.");
            return;
        }
    
        try {
            Log.d("MainActivity", "📡 Triggering 'appUrlOpen' Event with Data: " + deepLinkData.toString());
    
            this.getBridge().executeOnMainThread(() -> {
                this.getBridge().triggerWindowJSEvent("appUrlOpen", deepLinkData.toString());
                Log.d("MainActivity", "✅ Deep Link Event Sent Successfully.");
            });
        } catch (Exception e) {
            Log.e("MainActivity", "❌ ERROR: Failed to send deep link event!", e);
        }
    }
    

    //@Override
    public ArrayList<Class<? extends Plugin>> getPlugins() {
        ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
        return plugins;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
