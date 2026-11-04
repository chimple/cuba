package org.chimple.bahama;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restores rich local notification alarms following a device reboot. */
public class RichLocalNotificationBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            RichLocalNotificationPlugin.rescheduleAfterBoot(context);
        }
    }
}
