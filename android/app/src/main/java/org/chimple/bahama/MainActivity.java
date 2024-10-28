package org.chimple.bahama;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;


public class MainActivity extends BridgeActivity {
    private static final int READ_SMS_PERMISSION_CODE = 1;
    private static Context appContext;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PortPlugin.class);
        super.onCreate(savedInstanceState);
        appContext = this;

        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);

        FirebaseApp.initializeApp(/*context=*/ this);
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        firebaseAppCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance());

        requestSmsPhonePermission();
    }
    @Override
    public void onDestroy() {
        super.onDestroy();
    }


    public  static void requestSmsPhonePermission() {
        List<String> permissionsNeeded = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.READ_PHONE_STATE)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.READ_PHONE_STATE);
            permissionsNeeded.add(android.Manifest.permission.READ_PHONE_NUMBERS);
        }
        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        // Add any additional permissions you want to request
        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.RECEIVE_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECEIVE_SMS);
        }

        // Request permissions if any are needed
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions((Activity) appContext,
                    permissionsNeeded.toArray(new String[0]),
                    PackageManager.PERMISSION_GRANTED);
        }
        else {
            getPhoneNumbers();
        }
    }
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if(ContextCompat.checkSelfPermission(appContext, Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED) {
//            getPhoneNumbers();
        }
    }



    public static CompletableFuture<String> getPhoneNumbers() {
        CompletableFuture<String> future = new CompletableFuture<>();
        List<String> phoneNumbers = new ArrayList<>();

        if (ActivityCompat.checkSelfPermission(appContext, android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            SubscriptionManager subscriptionManager = (SubscriptionManager) appContext.getSystemService(SubscriptionManager.class);
            if (subscriptionManager != null) {
                List<SubscriptionInfo> subscriptionInfos = subscriptionManager.getActiveSubscriptionInfoList();
                if (subscriptionInfos != null) {
                    for (SubscriptionInfo info : subscriptionInfos) {
                        String number = info.getNumber(); // Get the phone number
                        if (number != null) {
                            phoneNumbers.add(number);
                        }
                    }
                }
            }
        }
        if (!phoneNumbers.isEmpty()) {
            promptPhoneNumber(phoneNumbers).thenAccept(selectedPhoneNumber -> {
                if (selectedPhoneNumber != null) {
                    future.complete(selectedPhoneNumber); // Complete future with the selected number
                } else {
                    future.complete(null); // Complete future with null if "None of the above" is selected
                }
            });
        } else {
            future.completeExceptionally(new Exception("No phone numbers found or permission not granted"));
        }
        return future;
    }

    public static CompletableFuture<String> promptPhoneNumber(List<String> phoneNumbers) {
        CompletableFuture<String> future = new CompletableFuture<>();

        AlertDialog.Builder builder = new AlertDialog.Builder(appContext);
        LayoutInflater inflater = LayoutInflater.from(appContext);
        View dialogView = inflater.inflate(R.layout.dialog_phone_selection, null);
        LinearLayout phoneOptionsContainer = dialogView.findViewById(R.id.phoneOptionsContainer);
        AlertDialog dialog = builder.setView(dialogView).create();

        for (String phoneNumber : phoneNumbers) {
            LinearLayout phoneOptionLayout = new LinearLayout(appContext);
            phoneOptionLayout.setOrientation(LinearLayout.HORIZONTAL);
            phoneOptionLayout.setPadding(8, 8, 8, 8);
            phoneOptionLayout.setClickable(true);

            ImageView phoneIcon = new ImageView(appContext);
            LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(60, 60); // Adjust size as needed
            phoneIcon.setLayoutParams(iconParams);
            phoneIcon.setImageResource(android.R.drawable.sym_action_call);  // or any other suitable icon

            TextView phoneText = new TextView(appContext);
            phoneText.setText(phoneNumber);
            phoneText.setPadding(16, 0, 0, 0);
            phoneText.setTextSize(16);

            phoneOptionLayout.addView(phoneIcon);
            phoneOptionLayout.addView(phoneText);

            LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            layoutParams.setMargins(0, 8, 0, 8); // Set top and bottom margin for spacing
            phoneOptionLayout.setLayoutParams(layoutParams);

            phoneOptionLayout.setOnClickListener(v -> {

                System.out.println("HHHHHHHHHHHHHHHHHHHHHHHH!!!!!!!!!!!!"+phoneNumber);
                future.complete(phoneNumber);  // Resolve the selected phone number
                dialog.dismiss();
            });
            phoneOptionsContainer.addView(phoneOptionLayout);
        }

        TextView noneOfTheAbove = dialogView.findViewById(R.id.noneOfTheAbove);
        noneOfTheAbove.setOnClickListener(v -> {
            future.complete(null);  // Return null if "None of the above" is selected
            dialog.dismiss();
        });

        dialog.show();
        dialog.getWindow().setLayout(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);

        return future;
    }


}






