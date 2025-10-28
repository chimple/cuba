package org.chimple.bahama;


import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;

import org.json.JSONObject;


public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
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
         // Register plugins
        registerPlugin(PortPlugin.class);
//        super.onCreate(savedInstanceState);
//        var respectClientManager = RespectClientManager();
//        respectClientManager.bindService(this);

        super.onCreate(savedInstanceState);
        this.bridge.setWebViewClient(new MyCustomWebViewClient(this.bridge, this));
        appContext = this;
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        // Handle deep linking on cold start
        handleDeepLink(getIntent());
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
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
        }
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

    /**
     * Handles incoming deep links with proper validation and error handling
     * @param intent The incoming intent containing the deep link
     */
    private void handleDeepLink(Intent intent) {
        if (intent == null) {
            Log.w(TAG, "Received null intent in handleDeepLink");
            return;
        }

        Uri data = intent.getData();
        if (data == null) {
            Log.d(TAG, "No deep link data found in intent");
            return;
        }

        Log.d(TAG, "Processing deep link: " + data.toString());

        try {
            // Clear previous deep link data
            deepLinkData = new JSONObject();
            
            // Add all query parameters to deepLinkData
            for (String key : data.getQueryParameterNames()) {
                String value = data.getQueryParameter(key);
                if (value != null) {
                    deepLinkData.put(key, value);
                    
                    // Special handling for activity_id
                    if ("activity_id".equals(key)) {
                        activity_id = value;
                        showDeepLinkToast("Preparing your lesson...");
                    }
                }
            }

            // Validate required parameters
            if (deepLinkData.length() == 0) {
                Log.w(TAG, "No valid query parameters found in deep link");
                return;
            }

            // Notify the web view about the deep link
            notifyDeepLinkReceived();
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing deep link", e);
            showDeepLinkToast("Error processing the link. Please try again.");
        }
    }

    /**
     * Shows a toast message for deep link related notifications
     */
    private void showDeepLinkToast(String message) {
        runOnUiThread(() -> 
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        );
    }

    /**
     * Notifies the web view that a deep link was received
     */
    private void notifyDeepLinkReceived() {
        // Check if bridge is ready
        if (this.bridge != null && this.bridge.getWebView() != null) {
            // If bridge is ready, send the deep link data immediately
            PortPlugin.sendLaunch();
        } else {
            // If bridge isn't ready, wait for it with a timeout
            waitForBridgeAndSend();
        }
    }

    /**
     * Waits for the WebView bridge to be ready with a timeout
     */
    private void waitForBridgeAndSend() {
        final int maxAttempts = 10; // 5 seconds total (500ms * 10)
        final long delayMs = 500;
        
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            int attempts = 0;
            
            @Override
            public void run() {
                attempts++;
                
                if (bridge != null && bridge.getWebView() != null) {
                    // Bridge is ready, send the deep link data
                    PortPlugin.sendLaunch();
                } else if (attempts < maxAttempts) {
                    // Try again after delay
                    new Handler(Looper.getMainLooper()).postDelayed(this, delayMs);
                } else {
                    // Timeout reached
                    Log.w(TAG, "Timeout waiting for WebView bridge to be ready");
                    showDeepLinkToast("App is taking longer to load. Please try again.");
                }
            }
        }, delayMs);
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
