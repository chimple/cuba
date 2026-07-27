package org.chimple.bahama;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "StorageManager")
public class StorageManagerPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }
    
    @PluginMethod
    public void getLessonFolders(PluginCall call) {
        executor.execute(() -> {
            try {
                File rootDir = getExternalRootDirectory();
                File[] files = rootDir.listFiles();
                JSObject result = new JSObject();
                com.getcapacitor.JSArray folders = new com.getcapacitor.JSArray();

                if (files != null) {
                    for (File file : files) {
                        if (file.isDirectory()) {
                            folders.put(file.getName());
                        }
                    }
                }

                result.put("folders", folders);
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("Failed to list lesson folders", exception);
            }
        });
    }

    @PluginMethod
    public void getDirectorySize(PluginCall call) {
        String path = call.getString("path", "");

        executor.execute(() -> {
            try {
                File target = resolvePath(path);
                long size = calculateDirectorySize(target);

                JSObject result = new JSObject();
                result.put("size", size);
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("Failed to calculate directory size", exception);
            }
        });
    }

    @PluginMethod
    public void deleteLessonFolder(PluginCall call) {
        String lessonId = call.getString("lessonId");
        if (lessonId == null || lessonId.trim().isEmpty()) {
            call.reject("lessonId is required");
            return;
        }

        executor.execute(() -> {
            try {
                File target = resolvePath(lessonId);
                deleteRecursively(target);
                call.resolve();
            } catch (Exception exception) {
                call.reject("Failed to delete lesson folder", exception);
            }
        });
    }

    private File getExternalRootDirectory() {
        File externalDir = getContext().getExternalFilesDir(null);
        return externalDir == null ? getContext().getFilesDir() : externalDir;
    }

    private File resolvePath(String path) throws IOException {
        File rootDir = getExternalRootDirectory();
        File target = (path == null || path.trim().isEmpty())
                ? rootDir
                : new File(rootDir, path);

        String rootCanonical = rootDir.getCanonicalPath();
        String targetCanonical = target.getCanonicalPath();
        String rootPrefix = rootCanonical + File.separator;
        if (!targetCanonical.equals(rootCanonical) && !targetCanonical.startsWith(rootPrefix)) {
            throw new IOException("Blocked unsafe path: " + path);
        }

        return target;
    }

    private long calculateDirectorySize(File file) {
        if (file == null || !file.exists()) {
            return 0L;
        }

        if (file.isFile()) {
            return file.length();
        }

        long totalSize = 0L;
        File[] children = file.listFiles();
        if (children == null) {
            return 0L;
        }

        for (File child : children) {
            totalSize += calculateDirectorySize(child);
        }

        return totalSize;
    }

    private void deleteRecursively(File file) throws IOException  {
        if (file == null || !file.exists()) {
            return;
        }

        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteRecursively(child);
            }
        }

        if (!file.delete()) {
            throw new IOException(
                "Failed to delete " + file.getAbsolutePath()
            );
        }
    }
}
