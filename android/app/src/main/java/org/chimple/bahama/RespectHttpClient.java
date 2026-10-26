package org.chimple.bahama;

import android.app.Application;
import okhttp3.OkHttpClient;
import org.openeel.libcache.ipc.client.HttpIpcClient;
import org.openeel.libcache.ipc.client.HttpIpcClientBuilder;
import org.openeel.libcache.ipc.client.interceptor.HttpIpcInterceptor;

public class RespectHttpClient extends Application {
    private static OkHttpClient okHttpClient;

    @Override
    public void onCreate() {
        super.onCreate();

        HttpIpcClient httpIpcClient = new HttpIpcClientBuilder(this)
                .setIpcServicePackageName("world.respect.app")
                .build();
        okHttpClient = new OkHttpClient.Builder()
                .addInterceptor(new HttpIpcInterceptor(httpIpcClient))
                .build();
    }

    public static OkHttpClient getOkHttpClient() {
        return okHttpClient;
    }
}
