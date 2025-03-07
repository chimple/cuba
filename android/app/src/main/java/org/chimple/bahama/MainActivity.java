package org.chimple.bahama;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

//    private RespectClientManager respectClientManager; // Declare RespectClientManager

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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

        // Handle deep linking
        handleDeepLink(getIntent());
    }

    private void handleDeepLink(Intent intent) {
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri data = intent.getData();
            if (data != null) {
                // ✅ Log full URL
                Log.d("MainActivity", "Received Deep Link: " + data.toString());

                // ✅ Retrieve query parameters
                String courseId = data.getQueryParameter("courseid");
                String chapterId = data.getQueryParameter("chapterid");
                String lessonId = data.getQueryParameter("lessonid");

                // ✅ Log each parameter
                Log.d("MainActivity", "Parsed courseId: " + courseId);
                Log.d("MainActivity", "Parsed chapterId: " + chapterId);
                Log.d("MainActivity", "Parsed lessonId: " + lessonId);

                if (courseId != null && chapterId != null && lessonId != null) {
                    // ✅ Send deep link data to Capacitor manually
                    sendDeepLinkToCapacitor(courseId, chapterId, lessonId);
                } else {
                    Log.e("MainActivity", "Some parameters are missing!");
                }
            } else {
                Log.e("MainActivity", "Deep link data is NULL");
            }
        }
    }

    private void sendDeepLinkToCapacitor(String courseId, String chapterId, String lessonId) {
        JSObject deepLinkData = new JSObject();
        deepLinkData.put("courseId", courseId);
        deepLinkData.put("chapterId", chapterId);
        deepLinkData.put("lessonId", lessonId);

        // ✅ Send event to Ionic React using Capacitor's WebView bridge
        bridge.triggerWindowJSEvent("deepLinkReceived", deepLinkData.toString());

        Log.d("MainActivity", "Sent deep link data to Capacitor via triggerWindowJSEvent.");
    }

    @Override
    public ArrayList<Class<? extends Plugin>> getPlugins() {
        ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
        //         plugins.add(NativeSSOPlugin.class);
//         plugins.add(PortPlugin.class);
        return plugins;
    }

    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

}