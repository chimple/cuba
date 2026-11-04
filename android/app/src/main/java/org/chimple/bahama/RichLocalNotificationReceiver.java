package org.chimple.bahama;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONObject;

/** Displays a scheduled local notification, including a cached image. */
public class RichLocalNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        JSONObject payload;
        try {
            payload = new JSONObject(intent.getStringExtra("extra"));
        } catch (Exception ignored) {
            payload = new JSONObject();
        }
        if (!RichLocalNotificationEligibility.shouldShow(
                context, payload, intent.getLongExtra("at", System.currentTimeMillis()))) return;
        JSONObject variant = RichLocalNotificationEligibility.selectVariant(context, payload);
        if (variant == null) return;
        String openPayload = intent.getStringExtra("extra");
        if (variant.length() > 0) {
            try {
                JSONObject selectedPayload = new JSONObject(payload.toString());
                selectedPayload.put("template_id", variant.optString("copy_id"));
                selectedPayload.put("deep_link", variant.optString("deep_link"));
                selectedPayload.remove("guard");
                openPayload = selectedPayload.toString();
            } catch (Exception ignored) {
                return;
            }
        }
        int id = intent.getIntExtra("id", 1);
        String channelId = intent.getStringExtra("channelId");
        if (channelId == null) channelId = "general_notifications";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId, "Notifications", NotificationManager.IMPORTANCE_HIGH);
            context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
        Intent open = new Intent(context, MainActivity.class)
                .setAction(RichLocalNotificationPlugin.ACTION_OPEN)
                .putExtra(RichLocalNotificationPlugin.EXTRA_PAYLOAD, openPayload)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(context, id, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String body = variant.optString("body", intent.getStringExtra("body"));
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_stat_chimple)
                .setContentTitle(variant.optString("title", intent.getStringExtra("title")))
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(content)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);
        String imageId = variant.length() > 0
                ? variant.optString("image_id", "") : intent.getStringExtra("imageId");
        if (imageId != null) {
            Bitmap image = BitmapFactory.decodeFile(RichLocalNotificationPlugin.imageFile(context, imageId).getAbsolutePath());
            if (image != null) builder.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(image));
        }
        NotificationManagerCompat.from(context).notify(id, builder.build());
        RichLocalNotificationEligibility.markShown(context, payload, variant);
    }
}
