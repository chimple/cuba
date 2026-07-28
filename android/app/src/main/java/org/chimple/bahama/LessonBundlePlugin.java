package org.chimple.bahama;

import android.content.Context;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@CapacitorPlugin(name = "LessonBundle")
public class LessonBundlePlugin extends Plugin {
    private static final int BUFFER_SIZE = 8192;
    private static final int CONNECT_TIMEOUT_MS = 10000;
    private static final int READ_TIMEOUT_MS = 10000;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndExtract(PluginCall call) {
        String lessonId = call.getString("lessonId");
        JSArray zipUrls = call.getArray("zipUrls");
        Integer dbVersion = call.getInt("dbVersion");

        if (lessonId == null || lessonId.trim().isEmpty()) {
            call.reject("lessonId is required");
            return;
        }

        if (zipUrls == null || zipUrls.length() == 0) {
            call.reject("zipUrls is required");
            return;
        }

        int resolvedDbVersion = dbVersion == null ? 1 : dbVersion;
        executor.execute(() -> {
            File zipFile = null;
            try {
                File rootDir = getExternalRootDirectory(getContext());
                zipFile = File.createTempFile(lessonId, ".zip", rootDir);
                DownloadResult downloadResult = downloadFirstAvailableZip(zipUrls, lessonId, zipFile);

                File extractDir = new File(rootDir, lessonId + "_temp");
                deleteRecursively(extractDir);
                unzip(zipFile, extractDir);
                writeVersionFile(extractDir, resolvedDbVersion);
                replaceLessonDirectory(rootDir, lessonId, extractDir);

                JSObject result = new JSObject();
                result.put("byteLength", downloadResult.byteLength);
                result.put("sha256Hex", downloadResult.sha256Hex);
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("Failed to download lesson bundle", exception);
            } finally {
                if (zipFile != null && zipFile.exists()) {
                    //noinspection ResultOfMethodCallIgnored
                    zipFile.delete();
                }
            }
        });
    }

    private File getExternalRootDirectory(Context context) {
        File externalDir = context.getExternalFilesDir(null);
        return externalDir == null ? context.getFilesDir() : externalDir;
    }

    private DownloadResult downloadFirstAvailableZip(
            JSArray baseUrls,
            String lessonId,
            File destination
    ) throws Exception {
        Exception lastException = null;

        for (int attempt = 0; attempt < 3; attempt++) {
            for (int index = 0; index < baseUrls.length(); index++) {
                String baseUrl = baseUrls.optString(index, null);
                if (baseUrl == null || baseUrl.trim().isEmpty()) {
                    continue;
                }

                String zipUrl = baseUrl + lessonId + ".zip";
                try {
                    return downloadZip(zipUrl, destination);
                } catch (Exception exception) {
                    lastException = exception;
                }
            }
        }

        throw lastException == null
                ? new IOException("No lesson bundle URL could be downloaded")
                : lastException;
    }

    private DownloadResult downloadZip(String zipUrl, File destination)
            throws IOException, NoSuchAlgorithmException {
        HttpURLConnection connection = (HttpURLConnection) new URL(zipUrl).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setRequestMethod("GET");

        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            connection.disconnect();
            throw new IOException("Unexpected response " + responseCode + " for " + zipUrl);
        }

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long byteLength = 0;

        try (
                InputStream inputStream = new BufferedInputStream(connection.getInputStream());
                DigestInputStream digestInputStream = new DigestInputStream(inputStream, digest);
                FileOutputStream fileOutputStream = new FileOutputStream(destination);
                BufferedOutputStream outputStream = new BufferedOutputStream(fileOutputStream)
        ) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = digestInputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                byteLength += bytesRead;
            }
        } finally {
            connection.disconnect();
        }

        return new DownloadResult(byteLength, bytesToHex(digest.digest()));
    }

    private void unzip(File zipFile, File destinationDir) throws IOException {
        String destinationPath = destinationDir.getCanonicalPath() + File.separator;

        try (
                FileInputStream fileInputStream = new FileInputStream(zipFile);
                ZipInputStream zipInputStream = new ZipInputStream(new BufferedInputStream(fileInputStream))
        ) {
            ZipEntry entry;
            byte[] buffer = new byte[BUFFER_SIZE];

            while ((entry = zipInputStream.getNextEntry()) != null) {
                String entryName = entry.getName();
                if (entryName.startsWith("dist/")) {
                    zipInputStream.closeEntry();
                    continue;
                }

                File outputFile = new File(destinationDir, entryName);
                String outputPath = outputFile.getCanonicalPath();
                if (!outputPath.startsWith(destinationPath)) {
                    throw new IOException("Blocked unsafe zip entry: " + entryName);
                }

                if (entry.isDirectory()) {
                    ensureDirectory(outputFile);
                    zipInputStream.closeEntry();
                    continue;
                }

                File parent = outputFile.getParentFile();
                if (parent != null) {
                    ensureDirectory(parent);
                }

                try (
                        FileOutputStream fileOutputStream = new FileOutputStream(outputFile);
                        BufferedOutputStream outputStream = new BufferedOutputStream(fileOutputStream)
                ) {
                    int bytesRead;
                    while ((bytesRead = zipInputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                }

                zipInputStream.closeEntry();
            }
        }
    }

    private void replaceLessonDirectory(File rootDir, String lessonId, File tempDir) throws IOException {
        File lessonDir = new File(rootDir, lessonId);
        File backupDir = new File(rootDir, lessonId + "_old");

        deleteRecursively(backupDir);

        if (lessonDir.exists() && !lessonDir.renameTo(backupDir)) {
            throw new IOException("Failed to move old lesson directory");
        }

        if (!tempDir.renameTo(lessonDir)) {
            if (backupDir.exists()) {
                //noinspection ResultOfMethodCallIgnored
                backupDir.renameTo(lessonDir);
            }
            throw new IOException("Failed to move new lesson directory");
        }

        deleteRecursively(backupDir);
    }

    private void writeVersionFile(File lessonDir, int dbVersion) throws IOException {
        ensureDirectory(lessonDir);
        File versionFile = new File(lessonDir, ".version");
        try (FileOutputStream outputStream = new FileOutputStream(versionFile)) {
            outputStream.write(String.valueOf(dbVersion).getBytes());
        }
    }

    private void ensureDirectory(File directory) throws IOException {
        if (directory.exists()) {
            if (!directory.isDirectory()) {
                throw new IOException("Path is not a directory: " + directory.getAbsolutePath());
            }
            return;
        }

        if (!directory.mkdirs()) {
            throw new IOException("Failed to create directory: " + directory.getAbsolutePath());
        }
    }

    private void deleteRecursively(File file) throws IOException {
        if (!file.exists()) {
            return;
        }

        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }

        if (!file.delete()) {
            throw new IOException("Failed to delete: " + file.getAbsolutePath());
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte item : bytes) {
            builder.append(String.format("%02x", item));
        }
        return builder.toString();
    }

    private static final class DownloadResult {
        private final long byteLength;
        private final String sha256Hex;

        private DownloadResult(long byteLength, String sha256Hex) {
            this.byteLength = byteLength;
            this.sha256Hex = sha256Hex;
        }
    }
}
