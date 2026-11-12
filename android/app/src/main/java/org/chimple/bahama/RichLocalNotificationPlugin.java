package org.chimple.bahama;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Caches remote images and schedules rich Android local notifications. */
@CapacitorPlugin(name = "RichLocalNotifications")
public class RichLocalNotificationPlugin extends Plugin {
    public static final String ACTION_OPEN = "org.chimple.bahama.RICH_LOCAL_NOTIFICATION_OPEN";
    public static final String EXTRA_PAYLOAD = "rich_local_notification_extra";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        publishOpenIntent(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        publishOpenIntent(intent);
    }

    @PluginMethod
    public void cacheImages(PluginCall call) {
        JSArray assets = call.getArray("assets");
        if (assets == null) {
            call.resolve();
            return;
        }
        executor.execute(() -> {
            for (int index = 0; index < assets.length(); index++) {
                JSONObject asset = assets.optJSONObject(index);
                if (asset == null) continue;
                try {
                    cacheImage(asset.optString("imageId", ""), asset.optString("url", ""));
                } catch (Exception ignored) {
                    // A missing image must not prevent the text notification.
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray notifications = call.getArray("notifications");
        if (notifications == null) {
            call.resolve();
            return;
        }
        JSONArray previous;
        try {
            previous = new JSONArray(preferences(getContext()).getString("scheduled", "[]"));
        } catch (Exception ignored) {
            previous = new JSONArray();
        }
        JSONArray saved = new JSONArray();
        Set<Integer> newIds = new HashSet<>();
        for (int index = 0; index < notifications.length(); index++) {
            JSONObject item = notifications.optJSONObject(index);
            if (item == null || item.optInt("id", 0) <= 0 || item.optLong("at", 0) <= 0) continue;
            scheduleItem(getContext(), item);
            saved.put(item);
            newIds.add(item.optInt("id"));
        }
        if (!preferences(getContext()).edit().putString("scheduled", saved.toString()).commit()) {
            call.reject("Unable to save scheduled notifications");
            return;
        }
        for (int index = 0; index < previous.length(); index++) {
            JSONObject item = previous.optJSONObject(index);
            if (item == null || newIds.contains(item.optInt("id"))) continue;
            cancelItem(getContext(), item.optInt("id"));
        }
        call.resolve();
    }

    @PluginMethod
    public void clearScheduled(PluginCall call) {
        clearScheduled(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getPendingAction(PluginCall call) {
        String payload = preferences(getContext()).getString("pending_action", null);
        preferences(getContext()).edit().remove("pending_action").apply();
        if (payload == null) {
            call.resolve();
            return;
        }
        try {
            call.resolve(JSObject.fromJSONObject(new JSONObject(payload)));
        } catch (Exception ignored) {
            call.resolve();
        }
    }

    static void rescheduleAfterBoot(Context context) {
        try {
            JSONArray saved = new JSONArray(preferences(context).getString("scheduled", "[]"));
            long now = System.currentTimeMillis();
            for (int index = 0; index < saved.length(); index++) {
                JSONObject item = saved.optJSONObject(index);
                if (item != null && item.optLong("at", 0) > now) scheduleItem(context, item);
            }
        } catch (Exception ignored) { }
    }

    private void publishOpenIntent(Intent intent) {
        if (intent == null || !ACTION_OPEN.equals(intent.getAction())) return;
        String payload = intent.getStringExtra(EXTRA_PAYLOAD);
        if (payload == null) return;
        preferences(getContext()).edit().putString("pending_action", payload).apply();
        try {
            notifyListeners("notificationActionPerformed", JSObject.fromJSONObject(new JSONObject(payload)), true);
        } catch (Exception ignored) { }
    }

    private static void clearScheduled(Context context) {
        try {
            JSONArray saved = new JSONArray(preferences(context).getString("scheduled", "[]"));
            for (int index = 0; index < saved.length(); index++) {
                JSONObject item = saved.optJSONObject(index);
                if (item == null) continue;
                cancelItem(context, item.optInt("id", 0));
            }
        } catch (Exception ignored) { }
        preferences(context).edit().remove("scheduled").apply();
    }

    private static void cancelItem(Context context, int id) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null || id <= 0) return;
        PendingIntent pending = PendingIntent.getBroadcast(context, id,
                new Intent(context, RichLocalNotificationReceiver.class),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pending != null) {
            alarms.cancel(pending);
            pending.cancel();
        }
    }

    private static void scheduleItem(Context context, JSONObject item) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        int id = item.optInt("id", 0);
        Intent intent = new Intent(context, RichLocalNotificationReceiver.class)
                .putExtra("id", id)
                .putExtra("at", item.optLong("at", 0))
                .putExtra("channelId", item.optString("channelId", "general_notifications"))
                .putExtra("title", item.optString("title", "Chimple"))
                .putExtra("body", item.optString("body", ""))
                .putExtra("imageId", item.optString("imageId", ""))
                .putExtra("extra", item.optJSONObject("extra") == null ? "{}" : item.optJSONObject("extra").toString());
        PendingIntent pending = PendingIntent.getBroadcast(context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long at = item.optLong("at", 0);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarms.canScheduleExactAlarms()) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
        } else {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
        }
    }

    static File imageFile(Context context, String imageId) {
        File directory = new File(context.getFilesDir(), "rich_local_notifications");
        if (!directory.exists()) directory.mkdirs();
        return new File(directory, imageId.replaceAll("[^A-Za-z0-9_-]", "_") + ".png");
    }

    private void cacheImage(String imageId, String sourceUrl) throws Exception {
        if (imageId.isEmpty() || sourceUrl.isEmpty()) return;
        File destination = imageFile(getContext(), imageId);
        if (destination.exists() && destination.length() > 0) return;
        HttpURLConnection connection = (HttpURLConnection) new URL(sourceUrl).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        File temporary = new File(destination.getParentFile(), destination.getName() + ".tmp");
        try (InputStream input = new BufferedInputStream(connection.getInputStream());
             FileOutputStream output = new FileOutputStream(temporary)) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        } finally {
            connection.disconnect();
        }
        if (!temporary.renameTo(destination)) throw new IllegalStateException("Unable to cache image");
    }

    private static android.content.SharedPreferences preferences(Context context) {
        return context.getSharedPreferences("rich_local_notifications", Context.MODE_PRIVATE);
    }
}
