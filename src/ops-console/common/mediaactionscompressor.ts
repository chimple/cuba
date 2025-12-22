import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useCallback, useState } from "react";

type CompressProgressCb = (progress: number) => void;

type CompressOptions = {
  signal?: AbortSignal;
  onProgress?: CompressProgressCb;
  maxImageDimension?: number;
  imageQuality?: number;
  videoQuality?: "high" | "medium" | "low";
  logTag?: string;
};

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;
let ffmpegLoadFailed = false;
let ffmpegTaskQueue: Promise<void> = Promise.resolve();

const runWithFFmpegLock = async <T>(task: () => Promise<T>): Promise<T> => {
  let release = () => {};
  const prev = ffmpegTaskQueue;
  ffmpegTaskQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await task();
  } finally {
    release();
  }
};

const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegLoadFailed) {
    throw new Error("FFmpeg failed to load previously");
  }

  if (ffmpegInstance) return ffmpegInstance;

  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    try {
      const ffmpeg = new FFmpeg();

      const supportsMultiThread =
        globalThis.crossOriginIsolated === true &&
        typeof (globalThis as any).SharedArrayBuffer !== "undefined";

      const loadCore = async (coreBaseUrl: string, multithread: boolean) => {
        const coreURL = await toBlobURL(
          `${coreBaseUrl}/ffmpeg-core.js`,
          "text/javascript"
        );
        const wasmURL = await toBlobURL(
          `${coreBaseUrl}/ffmpeg-core.wasm`,
          "application/wasm"
        );
        const workerURL = multithread
          ? await toBlobURL(
              `${coreBaseUrl}/ffmpeg-core.worker.js`,
              "text/javascript"
            )
          : undefined;

        const startedAt =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        await ffmpeg.load({ coreURL, wasmURL, workerURL });
        const endedAt =
          typeof performance !== "undefined" ? performance.now() : Date.now();

        if (process.env.NODE_ENV !== "production") {
          const kind = multithread ? "mt" : "st";
          const ms = Math.max(0, Math.round(endedAt - startedAt));
          console.info(`[media] FFmpeg core loaded (${kind}) in ${ms}ms`);
        }
      };

      const localBase = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");

      // Prefer optimized multi-thread core when the page is crossOriginIsolated (SharedArrayBuffer available).
      // Fall back to single-thread core otherwise (works everywhere).
      if (supportsMultiThread) {
        try {
          // Try local core first (if you host ffmpeg-core.* in `public/`), then CDN.
          await loadCore(localBase, true);
        } catch (e) {
          try {
            // Local single-thread fallback (in case you only host the st build).
            await loadCore(localBase, false);
          } catch {
            // ignore
          }

          try {
            await loadCore(
              "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd",
              true
            );
          } catch (e2) {
            console.warn(
              "[media] Multi-thread FFmpeg core failed; falling back to single-thread core.",
              e2
            );
            await loadCore(
              "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
              false
            );
          }
        }
      } else {
        try {
          await loadCore(localBase, false);
        } catch {
          await loadCore(
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
            false
          );
        }
      }

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      ffmpegLoadFailed = true;
      ffmpegLoading = null;
      console.error("Failed to load FFmpeg:", error);
      throw error;
    }
  })();

  return ffmpegLoading;
};

const abortIfNeeded = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
};

const loadImage = (url: string, signal?: AbortSignal) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    abortIfNeeded(signal);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const precision = idx === 0 ? 0 : idx === 1 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[idx]}`;
};

const nowMs = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const formatDurationMs = (ms: number) => {
  const safe = Math.max(0, Math.round(ms));
  if (safe < 1000) return `${safe}ms`;
  const s = safe / 1000;
  const precision = s < 10 ? 1 : 0;
  return `${s.toFixed(precision)}s`;
};

const inferMediaKind = (file: File): "video" | "image" | "other" => {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";

  const name = (file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() ?? "" : "";
  const imageExts = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "heic",
    "heif",
    "avif",
    "tif",
    "tiff",
    "svg",
  ]);
  const videoExts = new Set([
    "mp4",
    "mov",
    "m4v",
    "webm",
    "mkv",
    "avi",
    "3gp",
    "3gpp",
    "3g2",
    "ogg",
    "ogv",
  ]);
  if (videoExts.has(ext)) return "video";
  if (imageExts.has(ext)) return "image";
  return "other";
};

const getVideoSettings = (quality: "high" | "medium" | "low") => {
  switch (quality) {
    case "high":
      // Good quality, still compressed (typical “shareable”)
      return {
        crf: 23,
        maxWidth: 1280,
        fps: 30,
        audioBitrate: "128k",
        preset: "veryfast" as const,
      };
    case "medium":
      // Medium quality that won’t look bad on phones
      return {
        crf: 26,
        maxWidth: 960,
        fps: 30,
        audioBitrate: "96k",
        preset: "veryfast" as const,
      };
    case "low":
      // Smaller size, noticeable quality drop
      return {
        crf: 30,
        maxWidth: 640,
        fps: 24,
        audioBitrate: "64k",
        preset: "ultrafast" as const,
      };
    default:
      return {
        crf: 26,
        maxWidth: 960,
        fps: 30,
        audioBitrate: "96k",
        preset: "veryfast" as const,
      };
  }
};

// Compress video using FFmpeg
async function compressVideo(
  file: File,
  options: CompressOptions
): Promise<File> {
  const {
    signal,
    onProgress,
    videoQuality = "medium",
    logTag = "media",
  } = options;
  const startedAt = nowMs();

  const mime = (file.type || "").toLowerCase();
  const beforeSize = file.size;

  // Avoid expensive transcoding for already-small videos or WebM (often already efficient);
  // converting WebM -> MP4 can easily increase size.
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const isWebm = mime.includes("webm") || ext === "webm";
  if (beforeSize < 2 * 1024 * 1024 || isWebm) {
    onProgress?.(1);
    const elapsed = nowMs() - startedAt;
    console.info(
      `[${logTag}] compression skipped (kept original): ${
        file.name
      } (${formatBytes(beforeSize)}) in ${formatDurationMs(elapsed)}`
    );
    return file;
  }

  // Re-throw abort error if caught later
  try {
    abortIfNeeded(signal);

    // Ensure FFmpeg is loaded
    const ffmpeg = await getFFmpeg();
    abortIfNeeded(signal);

    return await runWithFFmpegLock(async () => {
      onProgress?.(0.05);

      // Setup input/output names
      const inputFileName = `input_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}.${file.name.split(".").pop() || "mp4"}`;
      const outputFileName = `output_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}.mp4`;

      // Setup progress handler (avoid console spam; it can noticeably slow down WASM compression)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(0.15 + progress * 0.75);
      };
      ffmpeg.on("progress", progressHandler);

      try {
        // Write file
        await ffmpeg.writeFile(inputFileName, await fetchFile(file));
        abortIfNeeded(signal);

        const settings = getVideoSettings(videoQuality);
        const crf = settings.crf;
        const scaleFilter = `scale='min(${settings.maxWidth},iw)':-2:flags=bilinear`;

        // Execute compression
        // -preset ultrafast: fastest compression speed
        // -r 30: Cap frame rate at 30fps
        // -vf: video filters (scaling)
        await ffmpeg.exec([
          "-i",
          inputFileName,

          // Video
          "-c:v",
          "libx264",
          "-crf",
          settings.crf.toString(),
          "-preset",
          settings.preset,
          "-pix_fmt",
          "yuv420p",
          "-r",
          settings.fps.toString(),
          "-vf",
          scaleFilter,

          // Audio (don’t force mono)
          "-c:a",
          "aac",
          "-b:a",
          settings.audioBitrate,
          "-ac",
          "2",

          "-movflags",
          "+faststart",
          "-y",
          outputFileName,
        ]);
        abortIfNeeded(signal);

        // Read output
        const data = await ffmpeg.readFile(outputFileName);
        onProgress?.(0.95);

        // Convert to Blob
        let blobData: BlobPart;
        if (data instanceof Uint8Array) {
          blobData = new Uint8Array(data).buffer as ArrayBuffer;
        } else {
          blobData = data as string;
        }

        const compressedBlob = new Blob([blobData], { type: "video/mp4" });
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const compressedFile = new File(
          [compressedBlob],
          `${baseName}-compressed.mp4`,
          {
            type: "video/mp4",
          }
        );

        // check size
        if (compressedFile.size >= beforeSize) {
          const elapsed = nowMs() - startedAt;
          console.info(
            `[${logTag}] kept original (compressed larger): ${
              file.name
            } (${formatBytes(beforeSize)} -> ${formatBytes(
              compressedFile.size
            )}) in ${formatDurationMs(elapsed)}`
          );
          onProgress?.(1);
          return file;
        }

        const elapsed = nowMs() - startedAt;
        console.info(
          `[${logTag}] compressed: ${file.name} (${formatBytes(
            beforeSize
          )} -> ${formatBytes(compressedFile.size)}) in ${formatDurationMs(elapsed)}`
        );
        onProgress?.(1);
        return compressedFile;
      } finally {
        // Cleanup resources
        ffmpeg.off("progress", progressHandler);
        try {
          await ffmpeg.deleteFile(inputFileName);
        } catch {}
        try {
          await ffmpeg.deleteFile(outputFileName);
        } catch {}
      }
    });
  } catch (error) {
    if (
      (error as any)?.name === "AbortError" ||
      (error as any)?.message === "Aborted"
    ) {
      throw error;
    }
    const elapsed = nowMs() - startedAt;
    console.error(
      `[${logTag}] video compression failed in ${formatDurationMs(elapsed)}:`,
      error
    );
    onProgress?.(1);
    return file;
  }
}

// Compress image using Canvas API
async function compressImage(
  file: File,
  options: CompressOptions
): Promise<File> {
  const {
    signal,
    onProgress,
    maxImageDimension = 1080,
    imageQuality = 0.72,
    logTag = "media",
  } = options;
  const startedAt = nowMs();

  const mime = (file.type || "").toLowerCase();
  const beforeSize = file.size;

  const objectUrl = URL.createObjectURL(file);
  try {
    onProgress?.(0.05);

    const img = await loadImage(objectUrl, signal);
    abortIfNeeded(signal);
    onProgress?.(0.25);

    const srcW = img.naturalWidth || img.width || 1;
    const srcH = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, maxImageDimension / Math.max(srcW, srcH));
    const dstW = Math.max(1, Math.round(srcW * scale));
    const dstH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onProgress?.(1);
      return file;
    }
    ctx.drawImage(img, 0, 0, dstW, dstH);
    onProgress?.(0.7);

    // Prefer WebP for better compression when available, fall back to JPEG.
    const blob =
      (await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", clamp01(imageQuality));
      })) ??
      (await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", clamp01(imageQuality));
      }));
    abortIfNeeded(signal);

    if (!blob) {
      onProgress?.(1);
      const elapsed = nowMs() - startedAt;
      console.info(
        `[${logTag}] compression failed (kept original): ${
          file.name
        } (${formatBytes(beforeSize)}) in ${formatDurationMs(elapsed)}`
      );
      return file;
    }

    const ext =
      blob.type === "image/png"
        ? "png"
        : blob.type === "image/webp"
        ? "webp"
        : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const nextName = `${baseName}-compressed.${ext}`;
    onProgress?.(0.95);
    const compressed = new File([blob], nextName, { type: blob.type });

    // Only use compressed version if it's actually smaller
    if (compressed.size >= beforeSize) {
      const elapsed = nowMs() - startedAt;
      console.info(
        `[${logTag}] compression skipped (no size reduction): ${
          file.name
        } (${formatBytes(beforeSize)} -> ${formatBytes(
          compressed.size
        )}) in ${formatDurationMs(elapsed)}`
      );
      onProgress?.(1);
      return file;
    }

    const elapsed = nowMs() - startedAt;
    console.info(
      `[${logTag}] compressed: ${file.name} (${formatBytes(
        beforeSize
      )} -> ${formatBytes(compressed.size)}) in ${formatDurationMs(elapsed)}`
    );
    return compressed;
  } finally {
    URL.revokeObjectURL(objectUrl);
    onProgress?.(1);
  }
}

async function compressImageWithFFmpeg(
  file: File,
  options: CompressOptions
): Promise<File> {
  const { signal, onProgress, logTag = "media" } = options;
  const startedAt = nowMs();
  const beforeSize = file.size;

  try {
    abortIfNeeded(signal);
    const ffmpeg = await getFFmpeg();
    abortIfNeeded(signal);

    return await runWithFFmpegLock(async () => {
      onProgress?.(0.05);

      const inputExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const inputFileName = `input_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}.${inputExt}`;
      const outputFileName = `output_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}.webp`;

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(0.15 + progress * 0.75);
      };
      ffmpeg.on("progress", progressHandler);

      try {
        await ffmpeg.writeFile(inputFileName, await fetchFile(file));
        abortIfNeeded(signal);

        await ffmpeg.exec([
          "-i",
          inputFileName,
          "-vf",
          "scale=1920:1080:force_original_aspect_ratio=decrease:flags=fast_bilinear",
          "-c:v",
          "libwebp",
          "-q:v",
          "90",
          "-compression_level",
          "4",
          "-lossless",
          "0",
          "-y",
          outputFileName,
        ]);
        abortIfNeeded(signal);

        const data = await ffmpeg.readFile(outputFileName);
        onProgress?.(0.95);

        let blobData: BlobPart;
        if (data instanceof Uint8Array) {
          blobData = new Uint8Array(data).buffer as ArrayBuffer;
        } else {
          blobData = data as string;
        }

        const compressedBlob = new Blob([blobData], { type: "image/webp" });
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const compressedFile = new File([compressedBlob], `${baseName}.webp`, {
          type: "image/webp",
        });

        if (compressedFile.size >= beforeSize) {
          const elapsed = nowMs() - startedAt;
          console.info(
            `[${logTag}] kept original (compressed larger): ${
              file.name
            } (${formatBytes(beforeSize)} -> ${formatBytes(
              compressedFile.size
            )}) in ${formatDurationMs(elapsed)}`
          );
          onProgress?.(1);
          return file;
        }

        const elapsed = nowMs() - startedAt;
        console.info(
          `[${logTag}] compressed: ${file.name} (${formatBytes(
            beforeSize
          )} -> ${formatBytes(compressedFile.size)}) in ${formatDurationMs(elapsed)}`
        );
        onProgress?.(1);
        return compressedFile;
      } finally {
        ffmpeg.off("progress", progressHandler);
        try {
          await ffmpeg.deleteFile(inputFileName);
        } catch {}
        try {
          await ffmpeg.deleteFile(outputFileName);
        } catch {}
      }
    });
  } catch (error) {
    if (
      (error as any)?.name === "AbortError" ||
      (error as any)?.message === "Aborted"
    ) {
      throw error;
    }
    const elapsed = nowMs() - startedAt;
    console.error(
      `[${logTag}] image compression (FFmpeg) failed in ${formatDurationMs(
        elapsed
      )}:`,
      error
    );
    onProgress?.(1);
    return file;
  }
}

export async function compressMediaForUpload(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { signal, onProgress, logTag = "media" } = options;

  abortIfNeeded(signal);

  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() ?? "" : "";
  const beforeSize = file.size;
  const kind = inferMediaKind(file);

  // Handle video compression
  if (kind === "video") {
    return compressVideo(file, options);
  }

  // Skip compression for non-compressible image formats
  if (
    mime === "image/gif" ||
    mime === "image/svg+xml" ||
    ext === "gif" ||
    ext === "svg"
  ) {
    onProgress?.(1);
    console.info(
      `[${logTag}] compression skipped: ${file.name} (${formatBytes(
        beforeSize
      )} -> ${formatBytes(file.size)})`
    );
    return file;
  }

  // Handle image compression
  if (kind === "image") {
    return compressImage(file, options);
  }

  // Skip compression for unsupported file types
  onProgress?.(1);
  console.info(
    `[${logTag}] compression skipped (unsupported type): ${
      file.name
    } (${formatBytes(beforeSize)})`
  );
  return file;
}

export type FFmpegCompressType = "video" | "image";

export const useFFmpegCompress = () => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const loadFFmpeg = useCallback(async () => {
    setLoading(true);
    try {
      await getFFmpeg();
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const compressFile = useCallback(
    async (file: File, type: FFmpegCompressType) => {
      if (!ready) throw new Error("FFmpeg not loaded");
      setLoading(true);
      try {
        if (type === "video") {
          return await compressMediaForUpload(file, {
            logTag: "media",
            videoQuality: "medium",
          });
        }
        return await compressImageWithFFmpeg(file, { logTag: "media" });
      } finally {
        setLoading(false);
      }
    },
    [ready]
  );

  return { loadFFmpeg, compressFile, loading, ready };
};
