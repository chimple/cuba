package org.chimple.bahama;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.view.View;

import rawhttp.core.RawHttp;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.ustadmobile.httpoveripc.client.HttpOverIpcClient;
import com.ustadmobile.httpoveripc.client.HttpOverIpcProxy;

import java.io.IOException;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PortPlugin.class);
        super.onCreate(savedInstanceState);
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        Intent intent = new Intent("oneroster").setPackage("com.toughra.ustadmobile");
        bindService(intent, mServiceConnection, Context.BIND_AUTO_CREATE);

        FirebaseApp.initializeApp(/*context=*/ this);
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        firebaseAppCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance());
    }

    private HttpOverIpcClient mIpcClient;

    protected HttpOverIpcProxy mHttpOverIpcProxy;
    private Boolean bound = false;
    private ServiceConnection mServiceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            Log.d("onServiceConnected", name.toString() + service.toString());
            mIpcClient = new HttpOverIpcClient(service);
            mHttpOverIpcProxy = new HttpOverIpcProxy(mIpcClient, new RawHttp(), 30000, null, 0);
            mHttpOverIpcProxy.start();
            bound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.d("onServiceDisconnected", name.toString());
            mHttpOverIpcProxy.stop();
            mIpcClient.close();
            mIpcClient = null;
            bound = false;
        }

    };

    @Override
    public void onDestroy() {
        if (bound) {
            unbindService(mServiceConnection);
        }
        super.onDestroy();
    }
}