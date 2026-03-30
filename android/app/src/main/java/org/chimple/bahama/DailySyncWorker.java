package org.chimple.bahama;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

// 👇 IMPORTANT
import org.chimple.bahama.SupabaseClient;
import org.chimple.bahama.SyncScheduler;

public class DailySyncWorker extends Worker {

    private static final String TAG = "DailySyncWorker";

    public DailySyncWorker(@NonNull Context context,
                           @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {

        Log.i(TAG, "🚀 Sync started");

        SupabaseClient client = new SupabaseClient();

        String data = client.fetchChanges();
        Log.i("DEBUG", "RAW RESPONSE: " + data);
        if (data != null) {
            Log.i(TAG, "📥 Pulled data: " + data);
            SyncScheduler.scheduleNextSync(getApplicationContext());
            return Result.success();
        } else {
            return Result.retry();
        }

    }
}