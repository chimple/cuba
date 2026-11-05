package org.chimple.bahama;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.Log;

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
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import okhttp3.Call;
import okhttp3.Request;
import okhttp3.Response;

@CapacitorPlugin(name = "LessonBundle")
public class LessonBundlePlugin extends Plugin {
    private static final String TAG = "LessonBundle";
    private static final int BUFFER_SIZE = 8192;
    private static final int CONNECT_TIMEOUT_MS = 10000;
    private static final int READ_TIMEOUT_MS = 10000;
    private static final long LAUNCHER_CACHE_TIMEOUT_SECONDS = 5;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndExtract(PluginCall call) {
        String lessonId = call.getString("lessonId");
        JSArray zipUrls = call.getArray("zipUrls");
        String requestedZipUrl = call.getString("zipUrl");
        String zipUrl = requestedZipUrl == null || requestedZipUrl.trim().isEmpty()
                ? null : requestedZipUrl.trim();
        Integer dbVersion = call.getInt("dbVersion");

        if (lessonId == null || lessonId.trim().isEmpty()) {
            call.reject("lessonId is required");
            return;
        }

        if (zipUrl == null && (zipUrls == null || zipUrls.length() == 0)) {
            call.reject("zipUrl or zipUrls is required");
            return;
        }

        if (zipUrl != null && !isValidExactZipUrl(zipUrl, lessonId)) {
            call.reject("zipUrl must be an HTTPS URL for the requested lesson ZIP");
            return;
        }

        int resolvedDbVersion = dbVersion == null ? 1 : dbVersion;
        executor.execute(() -> {
            File zipFile = null;
            try {
                File rootDir = getExternalRootDirectory(getContext());
                zipFile = File.createTempFile(lessonId, ".zip", rootDir);
                DownloadResult downloadResult = zipUrl == null
                        ? downloadFirstAvailableZip(zipUrls, lessonId, zipFile)
                        : downloadZip(zipUrl, zipFile);

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

    private boolean isValidExactZipUrl(String zipUrl, String lessonId) {
        try {
            URL url = new URL(zipUrl);
            return "https".equals(url.getProtocol())
                    && url.getHost() != null
                    && !url.getHost().isEmpty()
                    && url.getUserInfo() == null
                    && url.getRef() == null
                    && url.getPath().endsWith("/" + lessonId + ".zip");
        } catch (Exception exception) {
            return false;
        }
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
        if (!MainActivity.activity_id.isEmpty()
                && RespectHttpClient.getHttpIpcClient() != null) {
            try {
                return downloadZipThroughLauncherCache(zipUrl, destination);
            } catch (IOException exception) {
                if (!hasValidatedInternetConnection()) {
                    Log.w(TAG, getLauncherCacheName() + " cache unavailable while offline");
                    throw exception;
                }

                // A stalled launcher cache must not block an online launch forever.
                Log.w(TAG, getLauncherCacheName() + " cache download failed; using direct download");
            }
        }

        return downloadZipDirect(zipUrl, destination);
    }

    private boolean hasValidatedInternetConnection() {
        ConnectivityManager connectivityManager = getContext().getSystemService(
                ConnectivityManager.class
        );
        if (connectivityManager == null) {
            return false;
        }

        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork == null) {
            return false;
        }

        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(
                activeNetwork
        );
        return capabilities != null
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    private DownloadResult downloadZipDirect(String zipUrl, File destination)
            throws IOException, NoSuchAlgorithmException {
        HttpURLConnection connection = (HttpURLConnection) new URL(zipUrl).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setRequestMethod("GET");

        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            connection.disconnect();
            throw new IOException("Unexpected response " + responseCode + " for lesson bundle");
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

    private String getLauncherCacheName() {
        return RespectHttpClient.OPEN_EEL_PACKAGE_NAME.equals(PortPlugin.getLauncherPackageName())
                ? "OpenEEL" : "RESPECT";
    }

    private DownloadResult downloadZipThroughLauncherCache(String zipUrl, File destination)
            throws IOException {
        Request request = new Request.Builder()
                .url(zipUrl)
                .build();
        Call cacheCall = RespectHttpClient.getHttpIpcClient().newCall(request);
        File cacheDestination = File.createTempFile(
                "launcher-cache-",
                ".zip",
                destination.getParentFile()
        );
        ExecutorService cacheExecutor = Executors.newSingleThreadExecutor();
        Future<DownloadResult> cacheTask = cacheExecutor.submit(
                () -> downloadZipFromLauncherCache(cacheCall, cacheDestination)
        );

        try {
            DownloadResult result = getWithinDeadline(
                    cacheTask,
                    LAUNCHER_CACHE_TIMEOUT_SECONDS,
                    TimeUnit.SECONDS
            );
            if (destination.exists() && !destination.delete()) {
                throw new IOException("Failed to replace lesson bundle download");
            }
            if (!cacheDestination.renameTo(destination)) {
                throw new IOException("Failed to save launcher cache download");
            }
            return result;
        } catch (IOException exception) {
            // HttpIpcInterceptor blocks in a separate IPC call, so cancel its
            // call directly to enforce the launch deadline.
            cacheCall.cancel();
            cacheTask.cancel(true);
            throw exception;
        } finally {
            cacheExecutor.shutdownNow();
            if (cacheDestination.exists()) {
                //noinspection ResultOfMethodCallIgnored
                cacheDestination.delete();
            }
        }
    }

    static <T> T getWithinDeadline(
            Future<T> future,
            long timeout,
            TimeUnit timeUnit
    ) throws IOException {
        try {
            return future.get(timeout, timeUnit);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("Launcher cache request was interrupted", exception);
        } catch (TimeoutException exception) {
            throw new IOException("Launcher cache request timed out", exception);
        } catch (ExecutionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof IOException) {
                throw (IOException) cause;
            }
            throw new IOException("Launcher cache request failed", cause);
        }
    }

    private DownloadResult downloadZipFromLauncherCache(Call cacheCall, File destination)
            throws IOException, NoSuchAlgorithmException {
        try (Response response = cacheCall.execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new IOException("Unexpected response " + response.code());
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long byteLength = 0;
            try (
                    InputStream inputStream = new BufferedInputStream(response.body().byteStream());
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
            }

            return new DownloadResult(byteLength, bytesToHex(digest.digest()));
        }
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
