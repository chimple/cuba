package org.chimple.bahama;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;

import java.security.MessageDigest;


public class MainActivity extends BridgeActivity {
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
       var _hash =  getAppHash(this);
       System.out.println("HashCode"+_hash);
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

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if(ContextCompat.checkSelfPermission(appContext, Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED) {
            PortPlugin.isPermissionAccepted();
        }
    }
    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    public static Context getAppContext() {
        return appContext;
    }

}






