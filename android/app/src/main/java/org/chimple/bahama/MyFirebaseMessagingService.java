package org.chimple.bahama;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "MyFirebaseMsgService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        if (!remoteMessage.getData().isEmpty()) {
            String messageTitle = remoteMessage.getData().get("messageTitle");
            String messageBody = remoteMessage.getData().get("messageBody");

            if (messageTitle == null && messageBody == null && remoteMessage.getNotification() != null) {
                messageTitle = remoteMessage.getNotification().getTitle();
                messageBody = remoteMessage.getNotification().getBody();
            }
            String sendAt = remoteMessage.getData().get("sendAt");
            long delay = parseStartTime(sendAt);
            scheduleNotification(messageTitle, messageBody, delay, new JSONObject(remoteMessage.getData()).toString());
        }
    }

    private long parseStartTime(String sendAt) {
        if (sendAt == null) {
            Log.e(TAG, "sendAt is null, sending notification immediately.");
            return 0;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("EEE MMM dd yyyy HH:mm:ss 'GMT'Z", Locale.ENGLISH);
        try {
            long startTimeMillis = sdf.parse(sendAt).getTime();
            long currentTimeMillis = System.currentTimeMillis();
            return Math.max(startTimeMillis - currentTimeMillis, 0);
        } catch (ParseException e) {
            Log.e(TAG, "Error parsing sendAt timestamp", e);
            return 0;
        }
    }

    private void scheduleNotification(String messageTitle, String messageBody, long delay, String fullPayload) {
        Log.d(TAG, "Notification scheduled in: " + TimeUnit.MILLISECONDS.toSeconds(delay) + " seconds");

        Data inputData = new Data.Builder()
                .putString("messageTitle", messageTitle)
                .putString("messageBody", messageBody)
                .putString("fullPayload", fullPayload) // Send the full payload to Worker
                .build();

        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(MyWorker.class)
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .setInputData(inputData)
                .addTag("notificationTag")
                .build();

        WorkManager.getInstance(this).enqueue(workRequest);
    }


    public static class MyWorker extends Worker {
        private final Context context;

        public MyWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
            super(context, workerParams);
            this.context = context;
        }

        @Override
        public Result doWork() {
            String messageTitle = getInputData().getString("messageTitle");
            String messageBody = getInputData().getString("messageBody");
            String fullPayload = getInputData().getString("fullPayload");

            Log.d(TAG, "Sending scheduled notification: " + messageTitle + " - " + messageBody);
            Log.d(TAG, "Full payload data: " + fullPayload); // Log the full payload

            sendNotification(messageTitle, messageBody, fullPayload);
            return Result.success();
        }

        private void sendNotification(String messageTitle, String messageBody, String fullPayload) {
            Intent intent = new Intent(context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("fullPayload", fullPayload); // Attach full payload to the intent
            int requestCode = (int) System.currentTimeMillis();

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, requestCode, intent,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                            ? PendingIntent.FLAG_MUTABLE
                            : PendingIntent.FLAG_IMMUTABLE
            );

            String channelId = "scheduled_notification_channel";
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder notificationBuilder =
                    new NotificationCompat.Builder(context, channelId)
                            .setSmallIcon(R.mipmap.chimple_monkey_icon)
                            .setContentTitle(messageTitle)
                            .setContentText(messageBody)
                            .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
                            .setAutoCancel(true)
                            .setSound(defaultSoundUri)
                            .setContentIntent(pendingIntent)
                            .setPriority(NotificationCompat.PRIORITY_HIGH);

            NotificationManager notificationManager =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {  // For Android 8.0+ (Oreo and above)
                NotificationChannel channel = new NotificationChannel(
                        channelId, "Scheduled Notifications", NotificationManager.IMPORTANCE_HIGH);
                notificationManager.createNotificationChannel(channel);
            }
            int notificationId = (int) System.currentTimeMillis();
            notificationManager.notify(notificationId, notificationBuilder.build());
            Log.d(TAG, "Notification sent successfully with full payload!");
        }
    }

}
