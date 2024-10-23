package org.chimple.bahama;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.widget.EditText;
import androidx.annotation.RequiresApi;

import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class OTPReceiver extends BroadcastReceiver {
    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
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
                            System.out.println("GGGGGGGGGGGGGGGGGGGGGGGGGG1111111111111");
                            String otp = extractOtp(messageBody);
                            if (otp != null) {
//                                notifyListeners("notificationOpened", eventData);
                                System.out.println("GGGGGGGGGGGGGGGGGGGGGGGGGG"+otp);
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
}