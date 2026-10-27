package org.chimple.bahama;

import android.app.Application;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import org.openeel.libcache.ipc.client.HttpIpcClient;
import org.openeel.libcache.ipc.client.HttpIpcClientBuilder;
import org.openeel.libcache.ipc.client.interceptor.HttpIpcInterceptor;

public class RespectHttpClient extends Application {
    private static final long CONNECT_TIMEOUT_SECONDS = 10;
    private static final long READ_TIMEOUT_SECONDS = 30;
    private static final long WRITE_TIMEOUT_SECONDS = 30;
    private static final long CALL_TIMEOUT_SECONDS = 30;
    private static HttpIpcClient httpIpcClient;
    private static OkHttpClient okHttpClient;

    @Override
    public void onCreate() {
        super.onCreate();

        httpIpcClient = new HttpIpcClientBuilder(this)
                .setIpcServicePackageName("world.respect.app")
                .build();
        okHttpClient = withTimeouts(
                new OkHttpClient.Builder()
                        .addInterceptor(new HttpIpcInterceptor(httpIpcClient))
        )
                .build();
    }

    static OkHttpClient.Builder withTimeouts(OkHttpClient.Builder builder) {
        return builder
                .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .writeTimeout(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .callTimeout(CALL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    public static OkHttpClient getOkHttpClient() {
        return okHttpClient;
    }

    public static HttpIpcClient getHttpIpcClient() {
        return httpIpcClient;
    }
}
