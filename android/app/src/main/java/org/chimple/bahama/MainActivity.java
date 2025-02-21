package org.chimple.bahama;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public  class MainActivity extends BridgeActivity {

//    private RespectClientManager respectClientManager; // Declare RespectClientManager

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
//        registerPlugin(NativeSSOPlugin.class);
        super.onCreate(savedInstanceState);
//        var respectClientManager = RespectClientManager();
//        respectClientManager.bindService(this);
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);

        FirebaseApp.initializeApp(/*context=*/ this);
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        firebaseAppCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance());

        // Initialize and bind RespectClientManager
//        respectClientManager = new RespectClientManager(); // Initialize RespectClientManager
//        respectClientManager.bindService(this); // Bind the service
    }

//    @Override
//    public ArrayList<Class<? extends Plugin>> getPlugins() {
//        ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
//        plugins.add(NativeSSOPlugin.class);
//        return plugins;
//    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

}