package org.chimple.bahama;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;

import androidx.activity.result.ActivityResultLauncher;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;



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

    }
    @Override
    public void onDestroy() {
        super.onDestroy();
    }


    public static void requestSmsPermission(){
        if (ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.READ_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions((Activity) appContext,
                    new String[]{android.Manifest.permission.READ_SMS}, READ_SMS_PERMISSION_CODE);
        }

    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        System.out.println("GGGGGGGGGGGGGGGGGGGGGGGGGGGKKKKK111111111111111");
        if (requestCode == READ_SMS_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                System.out.println("GGGGGGGGGGGGGGGGGGGGGGGGGGGKKK3333333333333333");
                // Permission granted, now register the BroadcastReceiver
                registerReceiver();
            } else {
                // Permission denied, handle the failure
            }
        }
    }
    private void registerReceiver() {
        BroadcastReceiver smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
              System.out.println("GGGGGGGGGGGGGGGGGGGGGGGGGGGKKKKKKKKKKKKKKKKKKKK");
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction("android.provider.Telephony.SMS_RECEIVED");
        registerReceiver(smsReceiver, filter);
    }
    public static Context getAppContext() {
        return appContext;
    }
}