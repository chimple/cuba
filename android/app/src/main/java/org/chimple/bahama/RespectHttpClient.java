package org.chimple.bahama;

import android.app.Application;
import android.content.Context;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import org.openeel.libcache.ipc.client.HttpIpcClient;
import org.openeel.libcache.ipc.client.HttpIpcClientBuilder;
import org.openeel.libcache.ipc.client.interceptor.HttpIpcInterceptor;

public class RespectHttpClient extends Application {
    public static final String RESPECT_PACKAGE_NAME = "world.respect.app";
    public static final String OPEN_EEL_PACKAGE_NAME = "org.openeel.app";
    private static final long CONNECT_TIMEOUT_SECONDS = 10;
    private static final long READ_TIMEOUT_SECONDS = 30;
    private static final long WRITE_TIMEOUT_SECONDS = 30;
    private static final long CALL_TIMEOUT_SECONDS = 30;
    private static HttpIpcClient respectHttpIpcClient;
    private static HttpIpcClient openEelHttpIpcClient;
    private static OkHttpClient respectOkHttpClient;
    private static OkHttpClient openEelOkHttpClient;

    @Override
    public void onCreate() {
        super.onCreate();

        respectHttpIpcClient = createHttpIpcClient(this, RESPECT_PACKAGE_NAME);
        openEelHttpIpcClient = createHttpIpcClient(this, OPEN_EEL_PACKAGE_NAME);
        respectOkHttpClient = createOkHttpClient(respectHttpIpcClient);
        openEelOkHttpClient = createOkHttpClient(openEelHttpIpcClient);
    }

    private static HttpIpcClient createHttpIpcClient(Context context, String packageName) {
        return new HttpIpcClientBuilder(context)
                .setIpcServicePackageName(packageName)
                .build();
    }

    private static OkHttpClient createOkHttpClient(HttpIpcClient httpIpcClient) {
        return withTimeouts(
                new OkHttpClient.Builder()
                        .addInterceptor(new HttpIpcInterceptor(httpIpcClient))
        ).build();
    }

    static OkHttpClient.Builder withTimeouts(OkHttpClient.Builder builder) {
        return builder
                .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .writeTimeout(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .callTimeout(CALL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    public static OkHttpClient getOkHttpClient() {
        return PortPlugin.getLauncherPackageName().equals(OPEN_EEL_PACKAGE_NAME)
                ? openEelOkHttpClient : respectOkHttpClient;
    }

    public static HttpIpcClient getHttpIpcClient() {
        return PortPlugin.getLauncherPackageName().equals(OPEN_EEL_PACKAGE_NAME)
                ? openEelHttpIpcClient : respectHttpIpcClient;
    }
}
