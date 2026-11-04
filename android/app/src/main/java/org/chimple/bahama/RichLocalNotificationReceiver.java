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

/** Displays a scheduled local notification, including a cached image. */
public class RichLocalNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
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
                .putExtra(RichLocalNotificationPlugin.EXTRA_PAYLOAD, intent.getStringExtra("extra"))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(context, id, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String body = intent.getStringExtra("body");
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle(intent.getStringExtra("title"))
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(content)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);
        String imageId = intent.getStringExtra("imageId");
        if (imageId != null) {
            Bitmap image = BitmapFactory.decodeFile(RichLocalNotificationPlugin.imageFile(context, imageId).getAbsolutePath());
            if (image != null) builder.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(image));
        }
        NotificationManagerCompat.from(context).notify(id, builder.build());
    }
}
