package org.chimple.bahama;


import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.content.Intent;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.Plugin;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import android.app.Activity;

import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;



public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private static Context appContext;
    private static String phoneNumber;
    private static ActivityResultLauncher activityResultLauncher;
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

    public void initializeActivityLauncher() {
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
    public void onResume() {
        super.onResume();
        // Re-inject WebGL watcher when app comes back from background
        if (this.bridge != null && this.bridge.getWebView() != null && webGLMonitor != null) {
            Log.e("MainActivity", "Re-injecting WebGL monitor after resume");
            webGLMonitor.reInjectWatcher();
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

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Handle Google Sign-In result
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // This method is required by the ModifiedMainActivityForSocialLoginPlugin interface
        // It's used to verify that the MainActivity has been properly modified
    }
}