package org.chimple.bahama;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

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
    public static MainActivity instance;
    private static final String TAG = "Logger001";
    String activity_id = "";



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;

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
        IntentLogger.logIntentDeeply(getIntent());


        Log.d("MainActivity", "🌍 Deep Link Received: " + data.toString());

        // Extract all query parameters
        JSONObject deepLinkData = new JSONObject();
        try {
            for (String key : data.getQueryParameterNames()) {
                Log.d("LoggerMain", key + " --> " + data.getQueryParameter(key));
                if (key.equals("activity_id")) {
                    Toast.makeText(this, "Please Wait, We are launching the Lesson...", Toast.LENGTH_LONG).show();
                    activity_id = data.getQueryParameter(key);

                }
                deepLinkData.put(key, data.getQueryParameter(key));
            }
        } catch (Exception e) {
            Log.e("MainActivity", "❌ ERROR: Failed to parse query parameters!", e);
            return;
        }

        Log.d("MainActivity", "🚀 Extracted Parameters: " + deepLinkData.toString());

//        // Ensure WebView is ready before sending deep link
//        new Handler(Looper.getMainLooper()).postDelayed(() -> {
////            sendDeepLinkToCapacitor(deepLinkData);
//        }, 1000); // Delay 1 second to ensure WebView is ready

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            PortPlugin.sendLaunch();
        }, 5000); // Delayed by 2 seconds to ensure Capacitor is ready
    }


    //@Override
    public ArrayList<Class<? extends Plugin>> getPlugins() {
        ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
        return plugins;
    }

    public static String getLastDeepLinkData() {
        return instance.activity_id;
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
