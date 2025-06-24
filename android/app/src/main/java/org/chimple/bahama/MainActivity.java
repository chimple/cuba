package org.chimple.bahama;

import android.content.Intent;
import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.json.JSONObject;

import java.util.ArrayList;

import com.google.firebase.crashlytics.FirebaseCrashlytics;       

import android.app.Activity;

import android.content.pm.PackageManager;

import android.util.Base64;
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;

import java.security.MessageDigest;


public  class MainActivity extends BridgeActivity {
    private static Context appContext;
    private static String phoneNumber;
    private static ActivityResultLauncher activityResultLauncher;
    // private RespectClientManager respectClientManager; // Declare RespectClientManager
    public static MainActivity instance;
    static String activity_id = "";
    static boolean isRespect = false;

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
        appContext = this;
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

        // Handle deep linking on cold start
        handleDeepLink(getIntent());
        isRespect = isAppInstalled("com.whatsapp");
        Log.d("TAG ---> ", isRespect + " : " + "Respect is Installed");
        var _hash = getAppHash(this);
        System.out.println("HashCode: " + _hash);
        initializeActivityLauncher();
    }

    public static String getAppHash(Context context) {
        try {
            String packageName = context.getPackageName();
            String signature = context.getPackageManager()
                    .getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
                    .signatures[0]
                    .toCharsString();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update((packageName + " " + signature).getBytes());
            byte[] hash = md.digest();
            String appHash = Base64.encodeToString(hash, Base64.NO_WRAP).substring(0, 11);
            return appHash;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
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
        JSONObject deepLinkData = new JSONObject();
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

    public ArrayList<Class<? extends Plugin>> getPlugins() {
        return new ArrayList<>();
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
    public static Context getAppContext() {
        return appContext;
    }
    public static String getPhoneNumber() {
        return phoneNumber;
    }

}
