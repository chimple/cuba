package org.chimple.bahama;

import android.app.Application;
//import okhttp3.OkHttpClient;
//import world.respect.librespect.LibRespectCache;
//import world.respect.librespect.LibRespectCacheBuilder;
//import world.respect.librespect.LibRespectCacheInterceptor;
//import world.respect.librespect.LibRespectProxyServer;

public class RespectHttpClient extends Application {
//    private static OkHttpClient okHttpClient;
//    private static LibRespectProxyServer httpProxy;

    @Override
    public void onCreate() {
        super.onCreate();

//        LibRespectCache libRespectCache = LibRespectCacheBuilder.build();
        // Option 1
//        okHttpClient = new OkHttpClient.Builder()
//                .addInterceptor(new LibRespectCacheInterceptor(libRespectCache))
//                .build();

        // Option 2
        // httpProxy = new LibRespectProxyServer(libRespectCache);
        // httpProxy.start();
    }

//    public static OkHttpClient getOkHttpClient() {
//        return okHttpClient;
//    }

//    public static LibRespectProxyServer getHttpProxy() {
//        return httpProxy;
//    }
}
