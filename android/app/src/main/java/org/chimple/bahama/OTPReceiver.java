package org.chimple.bahama;
import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;


import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class OTPReceiver extends BroadcastReceiver {
//    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    @Override
    public void onReceive(Context context, Intent intent) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String messageBody = smsMessage.getMessageBody();
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        if(sender.contains("CHIMPL")){
                            String otp = extractOtp(messageBody);
                            if (otp != null) {
                                PortPlugin.sendOtpData(otp);
                            }
                        }

                    }
                }
            }

    }
    private String extractOtp(String messageBody) {
        String otpPattern = "\\b\\d{6}\\b";
        Pattern pattern = Pattern.compile(otpPattern);
        Matcher matcher = pattern.matcher(messageBody);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    public  static CompletableFuture<List> requestSmsPhonePermission() {
        Context appContext = MainActivity.getAppContext();
        CompletableFuture<List> future = new CompletableFuture<>();
        List<String> permissionsNeeded = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.READ_PHONE_STATE)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.READ_PHONE_STATE);
            permissionsNeeded.add(android.Manifest.permission.READ_PHONE_NUMBERS);
        }
        if (ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.POST_NOTIFICATIONS);
        }

        // Add any additional permissions you want to request
        if (ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.RECEIVE_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECEIVE_SMS);
        }

        // Request permissions if any are needed
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions((Activity) appContext,
                    permissionsNeeded.toArray(new String[0]),
                    PackageManager.PERMISSION_GRANTED);
            future.complete(null);
        }
        else {
            getPhoneNumbers().thenAccept(selectedPhoneNumber -> {
                future.complete(selectedPhoneNumber);
            });
        }
        return future;
    }


    public static CompletableFuture<List> getPhoneNumbers() {
        Context appContext = MainActivity.getAppContext();
        CompletableFuture<List> future = new CompletableFuture<>();
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
            future.complete(phoneNumbers);
        } else {
            future.complete(null);
        }
        return future;
    }
}