package org.chimple.bahama;

import android.content.Intent;
import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.nfc.Tag;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Toast;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import android.app.Activity;

import android.util.Log;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;

import org.json.JSONObject;

import java.security.MessageDigest;


public  class MainActivity extends BridgeActivity {
    private static Context appContext;
    private static final String TAG = "RespectLauncher";

    private static String phoneNumber;
    private static ActivityResultLauncher activityResultLauncher;
    // private RespectClientManager respectClientManager; // Declare RespectClientManager
    public static MainActivity instance;
    static String activity_id = "";
    static JSONObject deepLinkData = new JSONObject();
    static boolean isRespect = false;
    private MyWebGLMonitor webGLMonitor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) ->{
            SharedPreferences sharedPreferences = getSharedPreferences("AppPreferences", MODE_PRIVATE);
            String userId = sharedPreferences.getString("userId", null);
            if(userId !=null){
                FirebaseCrashlytics.getInstance().setUserId(userId);
            }
            FirebaseCrashlytics.getInstance().recordException(throwable);
        });
        registerPlugin(PortPlugin.class);
        super.onCreate(savedInstanceState);

        this.bridge.setWebViewClient(new MyCustomWebViewClient(this.bridge, this));
        appContext = this;
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        isRespect = isAppInstalled("com.whatsapp");
        Log.d("TAG ---> ", isRespect + " : " + "Respect is Installed");
        FirebaseApp.initializeApp(/*context=*/ this);
        initializeActivityLauncher();

        // --- ✅ Initialize WebGL Monitor ---
        if (this.bridge != null && this.bridge.getWebView() != null) {
            Log.e("MainActivity", "Initializing WebGL monitor...");
            webGLMonitor = new MyWebGLMonitor(this, this.bridge.getWebView());
        } else {
            Log.e("MainActivity", "WebView not ready for WebGL monitor");
        }
    }
    public void initializeActivityLauncher(){
        // Register the ActivityResultLauncher for Phone Number Hint
        ActivityResultLauncher<IntentSenderRequest> phoneNumberHintLauncher = registerForActivityResult (
                new ActivityResultContracts.StartIntentSenderForResult(),
                result -> {
                    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                        try {
                            String _phoneNumber = Identity.getSignInClient(this)
                                    .getPhoneNumberFromIntent(result.getData());
                            if (_phoneNumber != null && _phoneNumber.length() > 10) {
                                phoneNumber = _phoneNumber.substring(_phoneNumber.length() - 10);
                            } else {
                                phoneNumber = _phoneNumber;
                            }
                            PortPlugin.isNumberSelected();
                        } catch (ApiException e) {
                            Log.e("TAG", "Failed to retrieve phone number", e);
                        }
                    }
                });
        activityResultLauncher = phoneNumberHintLauncher;
    }

    public static void  promptPhoneNumbers(){
        GetPhoneNumberHintIntentRequest request = GetPhoneNumberHintIntentRequest.builder().build();
        // Request Phone Number Hint Intent
        Identity.getSignInClient(appContext)
                .getPhoneNumberHintIntent(request)
                .addOnSuccessListener(pendingIntent -> {
                    try {
                        // Launch the PendingIntent properly using IntentSenderRequest
                        activityResultLauncher.launch(new IntentSenderRequest.Builder(pendingIntent).build());
                    } catch (Exception e) {
                        Log.e("TAG", "Launching Phone Number Hint failed", e);
                    }
                })
                .addOnFailureListener(e -> Log.e("TAG", "Phone Number Hint Request failed", e));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) {
            return;
        }

        Uri data = intent.getData();
        try {
            for (String key : data.getQueryParameterNames()) {
                if (key.equals("activity_id")) {
                    Toast.makeText(this, "Please Wait, We are launching the Lesson...", Toast.LENGTH_LONG).show();
                    activity_id = data.getQueryParameter(key);
                }
                deepLinkData.put(key, data.getQueryParameter(key));
            }
        } catch (Exception e) {
            return;
        }

        // Delay launch to ensure Capacitor is ready
        new Handler(Looper.getMainLooper()).postDelayed(() -> PortPlugin.sendLaunch(), 5000);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-inject WebGL watcher when app comes back from background
        if (this.bridge != null && this.bridge.getWebView() != null && webGLMonitor != null) {
            Log.e("MainActivity", "Re-injecting WebGL monitor after resume");
            webGLMonitor.reInjectWatcher();
        }
    }

    public boolean isAppInstalled(String packageName) {
        PackageManager pm = getPackageManager();
        try {
            // Attempt to get package info for the given package name.
            pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
    public static Context getAppContext() {
        return appContext;
    }
    public static String getPhoneNumber() {
        return phoneNumber;
    }

}
