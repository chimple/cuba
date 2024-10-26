package org.chimple.bahama;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


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
        getPhoneNumbers();
    }
    @Override
    public void onDestroy() {
        super.onDestroy();
    }


    public  void requestSmsPhonePermission() {
        List<String> permissionsNeeded = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.READ_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.READ_SMS);
        }

        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.READ_PHONE_NUMBERS)
                != PackageManager.PERMISSION_GRANTED) {
//            permissionsNeeded.add(Manifest.permission.READ_PHONE_NUMBERS);
            permissionsNeeded.add(Manifest.permission.READ_PHONE_STATE);
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
            getPhoneNumbers();
        }
    }



    private void getPhoneNumbers(){
        List<String> phoneNumbers = new ArrayList<>();
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            SubscriptionManager subscriptionManager = (SubscriptionManager) getSystemService(SubscriptionManager.class);
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
        if(!phoneNumbers.isEmpty()){
            promptPhoneNumber(phoneNumbers);
        }
    }
    private void promptPhoneNumber(List<String> phoneNumbers) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        LayoutInflater inflater = getLayoutInflater();
        View dialogView = inflater.inflate(R.layout.dialog_phone_selection, null);

        LinearLayout phoneOptionsContainer = dialogView.findViewById(R.id.phoneOptionsContainer);
        for (String phoneNumber : phoneNumbers) {
            LinearLayout phoneOptionLayout = new LinearLayout(this);
            phoneOptionLayout.setOrientation(LinearLayout.HORIZONTAL);
            phoneOptionLayout.setPadding(8, 8, 8, 8);
            phoneOptionLayout.setClickable(true);
            ImageView phoneIcon = new ImageView(this);
            LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(60, 60); // Adjust size as needed
            phoneIcon.setLayoutParams(iconParams);
            phoneIcon.setImageResource(android.R.drawable.sym_action_call);  // or any other suitable icon
            TextView phoneText = new TextView(this);
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
                System.out.println("Selected Phone Number: " + phoneNumber);
            });
            phoneOptionsContainer.addView(phoneOptionLayout);
        }
        TextView noneOfTheAbove = dialogView.findViewById(R.id.noneOfTheAbove);
        noneOfTheAbove.setOnClickListener(v -> {
            System.out.println("None of the above selected");
        });

        builder.setView(dialogView);

        AlertDialog dialog = builder.create();
        dialog.show();
        dialog.getWindow().setLayout(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }
    public static Context getAppContext() {
        return appContext;
    }
}