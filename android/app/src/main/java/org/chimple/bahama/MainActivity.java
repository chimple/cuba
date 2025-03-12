package org.chimple.bahama;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.view.View;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import com.eidu.integration.RunLearningUnitRequest;
import com.eidu.integration.RunLearningUnitResult;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;

import java.security.MessageDigest;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;


public class MainActivity extends BridgeActivity {
    private static Context appContext;
    private static String phoneNumber;
    private static  ActivityResultLauncher activityResultLauncher;
    private static final String TAG = "Logger001";
    public static MainActivity instance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PortPlugin.class);
        super.onCreate(savedInstanceState);
        appContext = this;
        instance = this;

        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        FirebaseApp.initializeApp(/*context=*/ this);
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        firebaseAppCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance());
       var _hash =  getAppHash(this);
       System.out.println("HashCode"+_hash);

//        RunLearningUnitRequest request = RunLearningUnitRequest.fromIntent(getIntent());
//        if(request != null) {
//
//            ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
//
//            System.out.println("Execution started...");
//
////            scheduler.schedule(() -> handleRequest(), 7, TimeUnit.SECONDS);
//
//            scheduler.shutdown(); // Shutdown after execution
//        }

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
                            phoneNumber = _phoneNumber;
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
    public void onDestroy() {
        super.onDestroy();
    }

    public static Context getAppContext() {
        return appContext;
    }
    public static String getPhoneNumber() {
        return phoneNumber;
    }

    public void handleRequest() {
        RunLearningUnitRequest request = RunLearningUnitRequest.fromIntent(getIntent());
        if (request != null) {
            Log.d(TAG, "call from eidu");

            Intent curr_intent = getIntent();

            // Extract learningUnitId from intent extras
            String learningUnitId = curr_intent.getStringExtra("learningUnitId");

            if (learningUnitId != null && learningUnitId.contains("_")) {
                // Split the learningUnitId into course, chapter, and lesson
                String[] parts = learningUnitId.split("_");
                if (parts.length == 6) {
                    String courseId = parts[0];   // "en" -- example
                    String chapterId = parts[1];  // "en00" -- example
                    String lessonId = parts[2];   // "en0000" -- example

                    // Construct the URL dynamically
                    String url = "https://chimple.cc/microlink/?courseid=" + courseId +
                            "&chapterid=" + chapterId +
                            "&lessonid=" + lessonId +
                            "&app=eidu";
                    PortPlugin.sendLaunch(courseId, chapterId, lessonId);
                    curr_intent.setData(Uri.parse(url));
                    Log.d(TAG, "Generated URL: " + url);
                } else {
                    Log.e(TAG, "Invalid learningUnitId format: " + learningUnitId);
                }
            } else {
                Log.e(TAG, "learningUnitId is missing or not formatted correctly.");
            }
        }
    }


    public void sendResultToEidu(float score) {
        Log.d(TAG, "sending result to eidu");
        setResult(RESULT_OK, RunLearningUnitResult.ofSuccess(score, 1000, null, null).toIntent());
        finish();
    }


}






