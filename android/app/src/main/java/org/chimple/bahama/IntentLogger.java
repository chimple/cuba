package org.chimple.bahama;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

public class IntentLogger {
    private static final String TAG = "IntentLogger";

    public static void logIntentDeeply(Intent intent) {
        if (intent == null) {
            Log.e(TAG, "Intent is null");
            return;
        }

        StringBuilder logMessage = new StringBuilder();
        logMessage.append("----- Logging Intent Details -----\n");
        logMessage.append("Action: ").append(intent.getAction()).append("\n");
        logMessage.append("Data: ").append(intent.getData()).append("\n");
        logMessage.append("Type: ").append(intent.getType()).append("\n");
        logMessage.append("Component: ").append(intent.getComponent()).append("\n");
        logMessage.append("Package: ").append(intent.getPackage()).append("\n");
        logMessage.append("Flags: ").append(intent.getFlags()).append("\n");

        // Log categories
        if (intent.getCategories() != null) {
            logMessage.append("Categories: ").append(intent.getCategories()).append("\n");
        }

        // Log extras
        Bundle extras = intent.getExtras();
        if (extras != null) {
            logMessage.append("Extras:\n");
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                logMessage.append("   ").append(key).append(" = ")
                        .append(value).append(" (").append(value != null ? value.getClass().getSimpleName() : "null").append(")\n");
            }
        } else {
            logMessage.append("No extras found.\n");
        }

        logMessage.append("---------------------------------\n");

        // Print the full log
        Log.d(TAG, logMessage.toString());
    }
}
