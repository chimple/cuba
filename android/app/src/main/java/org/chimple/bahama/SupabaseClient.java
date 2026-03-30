package org.chimple.bahama;

import org.chimple.bahama.BuildConfig;
import android.content.Context;
import android.util.Log;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.MediaType;
import okhttp3.RequestBody;

import java.io.IOException;
public class SupabaseClient {

    private final String BASE_URL = BuildConfig.SUPABASE_URL;
    private final String API_KEY = BuildConfig.SUPABASE_KEY;

    private final OkHttpClient client = new OkHttpClient();

    public String fetchChanges() {

        String url = BASE_URL + "/rest/v1/rpc/sql_sync_all";

        String json = "{ \"p_updated_at\": {}, \"p_tables\": [\"user\"], \"p_is_first_time\": true }";

        RequestBody body = RequestBody.create(
                MediaType.parse("application/json"),
                json
        );

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("apikey", API_KEY)
                .addHeader("Authorization", "Bearer " + API_KEY)
                .addHeader("Content-Type", "application/json")
                .build();

        try {
            Response response = client.newCall(request).execute();

            if (response.isSuccessful()) {
                String data = response.body().string();
                System.out.println("PULL DATA: " + data);
                return data;
            } else {
                return null;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}