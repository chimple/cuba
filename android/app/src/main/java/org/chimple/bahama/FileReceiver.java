package org.chimple.bahama;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import java.io.*;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class FileReceiver extends BroadcastReceiver {
    private static final String TAG = "FileReceiver";
    private static final int BUFFER_SIZE = 8192;
    private static final int BATCH_SIZE = 25;
    private static final long SLEEP_TIME_MS = 500;

    private int totalZipFiles = 0;
    private int processedZipFiles = 0;
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"org.copy.chimple.SHARE_FOLDER".equals(intent.getAction())) return;

        List<Uri> fileUris = intent.getParcelableArrayListExtra("file_uris");
        if (fileUris == null || fileUris.isEmpty()) {
            Log.e(TAG, "❌ No files received!");
            return;
        }
        totalZipFiles = fileUris.size();
        processedZipFiles = 0;
        new Thread(() -> processFilesInBatches(context, fileUris)).start();
    }

    private void processFilesInBatches(Context context, List<Uri> fileUris) {
        int batchCount = 0;

        for (int i = 0; i < totalZipFiles; i++) {
            extractZipFile(context, fileUris.get(i));
            processedZipFiles++;
            batchCount++;

            sendExtractionProgressIntent(context, processedZipFiles, totalZipFiles);

            if (batchCount % BATCH_SIZE == 0) {
                Log.d(TAG, "⏳ Processed " + batchCount + " ZIP files. Sleeping for " + SLEEP_TIME_MS + "ms...");
                try {
                    Thread.sleep(SLEEP_TIME_MS);
                } catch (InterruptedException e) {
                    Log.e(TAG, "⚠️ Batch sleep interrupted: " + e.getMessage());
                }
            }
        }
        sendExtractionCompleteIntent(context, processedZipFiles);
    }

    private void extractZipFile(Context context, Uri zipUri) {
        File outputDir = context.getExternalFilesDir(null);
        if (outputDir == null) {
            Log.e(TAG, "❌ External storage not available!");
            return;
        }
        String folderName = getFolderNameFromUri(zipUri);
        if (folderName == null) {
            Log.e(TAG, "❌ Unable to get folder name from URI.");
            return;
        }

        File extractFolder = new File(outputDir, folderName);
        if (!extractFolder.exists() && !extractFolder.mkdirs()) {
            Log.e(TAG, "❌ Failed to create extraction folder: " + extractFolder.getAbsolutePath());
            return;
        }

        try (InputStream inputStream = context.getContentResolver().openInputStream(zipUri);
             ZipInputStream zipInputStream = new ZipInputStream(new BufferedInputStream(inputStream))) {

            byte[] buffer = new byte[BUFFER_SIZE];
            ZipEntry zipEntry;

            while ((zipEntry = zipInputStream.getNextEntry()) != null) {
                File outputFile = new File(extractFolder, zipEntry.getName());

                if (zipEntry.isDirectory()) {
                    outputFile.mkdirs();
                } else {
                    outputFile.getParentFile().mkdirs();

                    try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                        int length;
                        while ((length = zipInputStream.read(buffer)) > 0) {
                            fos.write(buffer, 0, length);
                        }
                    }
                }

                zipInputStream.closeEntry();
            }

            Log.d(TAG, "✅ ZIP extraction completed: " + folderName);

        } catch (IOException e) {
            Log.e(TAG, "❌ Error extracting ZIP: " + e.getMessage(), e);
        }
    }

    private void sendExtractionProgressIntent(Context context, int processed, int total) {
        Intent intent = new Intent("org.copy.chimple.EXTRACTION_PROGRESS");
        intent.putExtra("extracted_files", processed);
//        intent.putExtra("total_files", total);
        context.sendBroadcast(intent);
        Log.d(TAG, "📢 Extraction progress: " + processed + "/" + total + " ZIP files.");
    }

    private void sendExtractionCompleteIntent(Context context, int processedZipCount) {
        Intent intent = new Intent("org.copy.chimple.EXTRACTION_COMPLETE");
        intent.putExtra("extracted_file_count", processedZipCount);
        context.sendBroadcast(intent);
        Log.d(TAG, "📢 Extraction complete broadcast sent. Processed ZIPs: " + processedZipCount);
    }

    private String getFolderNameFromUri(Uri uri) {
        if (uri == null) return null;
        String name = uri.getLastPathSegment();
        if (name == null) return null;
        return name.replaceAll("^.*/", "").replace(".zip", "");
    }
}
