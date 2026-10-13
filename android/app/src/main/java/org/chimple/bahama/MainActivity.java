package org.chimple.bahama;


import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.net.Uri;
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
        registerPlugin(RespectXapiPlugin.class);
//        super.onCreate(savedInstanceState);
//        var respectClientManager = RespectClientManager();
//        respectClientManager.bindService(this);

        registerPlugin(LessonBundlePlugin.class);
        super.onCreate(savedInstanceState);
        this.bridge.setWebViewClient(new MyCustomWebViewClient(this.bridge, this));
        appContext = this;
        PortPlugin.checkInstallReferrerOnLaunch();
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        // Handle deep linking on cold start
        handleDeepLink(getIntent());
        FirebaseApp.initializeApp(/*context=*/ this);
        initializeActivityLauncher();
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
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) {
            return;
        }

        if (!setRespectLaunchData(intent.getData())) {
            return;
        }

        // RESPECT launches a full-screen Lido activity. Lock here,
        // before the web player initializes, to prevent portrait UI.
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

        // The web app independently retries launch preparation until its data is ready.
        // Do not delay this event: a warm Cuba activity otherwise briefly shows the
        // previous student-selection screen before the RESPECT lesson is opened.
        PortPlugin.sendLaunch();
    }

    static void handleInstallReferrer(String installReferrer) {
        try {
            String decodedReferrer = Uri.decode(installReferrer);
            Uri referrerData;
            if (decodedReferrer.startsWith("intent://")
                    || decodedReferrer.startsWith("https://")
                    || decodedReferrer.startsWith("http://")) {
                Intent referrerIntent = Intent.parseUri(
                        decodedReferrer, Intent.URI_INTENT_SCHEME
                );
                referrerData = referrerIntent.getData();
            } else {
                // Play referrers are query strings; retain nested encoded values.
                referrerData = new Uri.Builder()
                        .scheme("https")
                        .authority("play-referrer")
                        .encodedQuery(installReferrer)
                        .build();
            }
            boolean hasActivityId = referrerData != null
                    && referrerData.getQueryParameter("activity_id") != null;
            boolean hasChimpleLessonId = referrerData != null
                    && referrerData.getQueryParameter("chimple_lesson_id") != null;
            String activityId = hasActivityId
                    ? referrerData.getQueryParameter("activity_id") : "";
            String chimpleLessonId = hasChimpleLessonId
                    ? referrerData.getQueryParameter("chimple_lesson_id") : "";
            // Play delivers a deferred RESPECT launch as referrer text rather than an intent.
            if (setRespectLaunchData(referrerData)) {
                PortPlugin.sendLaunch();
            } else {
                Log.d(TAG, "Install referrer lesson handoff=false");
            }
        } catch (Exception exception) {
            Log.w(TAG, "Unable to read the install referrer launch data", exception);
        }
    }

    private static boolean setRespectLaunchData(Uri data) {
        if (data == null) {
            return false;
        }

        try {
            for (String key : data.getQueryParameterNames()) {
                if (key.equals("activity_id")) {
                    activity_id = data.getQueryParameter(key);
                }
                deepLinkData.put(key, data.getQueryParameter(key));
            }
        } catch (Exception e) {
            return false;
        }

        return !activity_id.isEmpty();
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
