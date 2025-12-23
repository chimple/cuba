import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { compressMediaForUpload } from "./mediaactionscompressor";

export type MediaUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "image" | "video" | "file";
  progress: number;
  status: "compressing" | "uploading" | "done";
  uploadedUrl?: string | null;
};

const MAX_VIDEO_UPLOAD_MB = 25;
const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

const inferMediaType = (file: File): MediaUploadItem["mediaType"] => {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";

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
  if (imageExts.has(ext)) return "image";
  if (videoExts.has(ext)) return "video";
  return "file";
};

type CameraUiMode = "desktop" | "mobile";

type UseMediaActionsOptions = {
  t?: (key: string) => string;
  schoolId?: string;
};

export type UseMediaActionsResult = {
  mediaUploads: MediaUploadItem[];
  mediaError: string | null;
  clearMediaError: () => void;
  addMediaFiles: (files: FileList | null) => void;
  removeMedia: (id: string) => void;
  resetMedia: () => void;
  uploadAllMedia: (uploadFn: (file: File) => Promise<string>) => Promise<string[]>;

  captureAnyInputRef: RefObject<HTMLInputElement | null>;
  captureImageInputRef: RefObject<HTMLInputElement | null>;
  captureVideoInputRef: RefObject<HTMLInputElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;

  isCameraOpen: boolean;
  cameraError: string | null;
  cameraUiMode: CameraUiMode;
  cameraStream: MediaStream | null;
  isRecording: boolean;
  recordingSecondsLeft: number | null;

  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;

  openCapture: () => void;
  openCamera: () => Promise<void>;
  closeCamera: () => void;
  cancelCamera: () => void;
  takePhoto: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;

  shutterPressStart: () => void;
  shutterPressEnd: () => void;
  shutterPressCancel: () => void;
};

const defaultTranslate = (key: string) => key;

export function useMediaActions(
  options: UseMediaActionsOptions = {}
): UseMediaActionsResult {
  const translate = options.t ?? defaultTranslate;
  const schoolId = options.schoolId;

  const [mediaUploads, setMediaUploads] = useState<MediaUploadItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const mediaUploadsRef = useRef<MediaUploadItem[]>([]);
  const uploadTimersRef = useRef<Map<string, number>>(new Map());
  const compressionTimersRef = useRef<Map<string, number>>(new Map());
  const compressionAbortRef = useRef<Map<string, AbortController>>(new Map());
  const compressionPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  const captureImageInputRef = useRef<HTMLInputElement | null>(null);
  const captureVideoInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const captureAnyInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraUiMode, setCameraUiMode] = useState<CameraUiMode>("desktop");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number | null>(
    null
  );
  const recordingTimerRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const discardRecordingRef = useRef(false);
  const shutterTimerRef = useRef<number | null>(null);
  const shutterStartedRecordingRef = useRef(false);
  const hasAutoStoppedRef = useRef(false);

  const createMediaId = () => {
    const maybeUuid = globalThis.crypto?.randomUUID?.();
    if (maybeUuid) return maybeUuid;
    return `media-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const createShortId = () => {
    const maybeUuid = globalThis.crypto?.randomUUID?.();
    if (maybeUuid) return maybeUuid.replace(/-/g, "").slice(0, 5);
    return Math.random().toString(36).slice(2, 7);
  };

  const getFileExtension = (file: File) => {
    const type = (file.type || "").toLowerCase();
    if (type === "image/jpeg") return "jpg";
    if (type === "image/png") return "png";
    if (type === "image/webp") return "webp";
    if (type === "image/heic") return "heic";
    if (type === "image/heif") return "heif";
    if (type === "image/avif") return "avif";
    if (type === "image/gif") return "gif";
    if (type === "video/mp4") return "mp4";
    if (type === "video/webm") return "webm";
    if (type === "video/quicktime") return "mov";
    if (type === "video/x-matroska") return "mkv";
    if (type === "video/3gpp") return "3gp";
    if (type === "video/ogg") return "ogv";

    const fromName =
      file.name && file.name.includes(".")
        ? (file.name.split(".").pop() ?? "").toLowerCase()
        : "";
    const safeFromName = fromName.replace(/[^a-z0-9]/g, "");
    return safeFromName || "bin";
  };

  const renameFileForUpload = (file: File) => {
    const safeSchoolId = (schoolId || "schoolid").replace(/[^a-z0-9_-]/gi, "-");
    const shortId = createShortId();
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ext = getFileExtension(file);
    const nextName = `${safeSchoolId}_${shortId}_${dateStr}.${ext}`;
    return new File([file], nextName, {
      type: file.type,
      lastModified: file.lastModified,
    });
  };

  const stopRecordingTimer = (opts: { updateState?: boolean } = {}) => {
    const updateState = opts.updateState ?? true;
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (updateState) setRecordingSecondsLeft(null);
    hasAutoStoppedRef.current = false;
  };

  const stopUploadTimer = (id: string) => {
    const timer = uploadTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearInterval(timer);
      uploadTimersRef.current.delete(id);
    }
  };

  const stopCompressionTimer = (id: string) => {
    const timer = compressionTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearInterval(timer);
      compressionTimersRef.current.delete(id);
    }
  };

  const cancelCompression = (id: string) => {
    stopCompressionTimer(id);
    const ctrl = compressionAbortRef.current.get(id);
    if (ctrl) {
      try {
        ctrl.abort();
      } catch {
        // ignore
      }
      compressionAbortRef.current.delete(id);
    }
  };

  const startSimulatedUpload = (id: string) => {
    stopUploadTimer(id);
    const timer = window.setInterval(() => {
      let completed = false;
      setMediaUploads((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return prev;
        const cur = prev[idx];
        if (cur.status !== "uploading") return prev;
        const nextProgress = Math.min(
          100,
          cur.progress + 8 + Math.floor(Math.random() * 10)
        );
        const nextStatus = nextProgress >= 100 ? "done" : "uploading";
        completed = nextStatus === "done";
        const next = [...prev];
        next[idx] = { ...cur, progress: nextProgress, status: nextStatus };
        return next;
      });
      if (completed) stopUploadTimer(id);
    }, 180);
    uploadTimersRef.current.set(id, timer);
  };

  const setMediaUploadsAndRef = (
    updater: (prev: MediaUploadItem[]) => MediaUploadItem[]
  ) => {
    setMediaUploads((prev) => {
      const next = updater(prev);
      mediaUploadsRef.current = next;
      return next;
    });
  };

  const addMediaFile = (file: File) => {
    const mediaType = inferMediaType(file);
    if (mediaType === "video" && file.size > MAX_VIDEO_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setMediaError(
        translate(
          `Video must be ${MAX_VIDEO_UPLOAD_MB}MB or less. Selected: ${sizeMb}MB.`
        )
      );
      return;
    }

    setMediaError(null);
    const id = createMediaId();
    const previewUrl = URL.createObjectURL(file);
    const compressionMaxProgress = 95;
    const item: MediaUploadItem = {
      id,
      file,
      previewUrl,
      mediaType,
      progress: 0,
      status: "compressing",
      uploadedUrl: null,
    };
    setMediaUploadsAndRef((prev) => [...prev, item]);

    cancelCompression(id);
    const abortController = new AbortController();
    compressionAbortRef.current.set(id, abortController);

    stopCompressionTimer(id);
    const compressTimer = window.setInterval(() => {
      setMediaUploadsAndRef((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return prev;
        const cur = prev[idx];
        if (cur.status !== "compressing") return prev;
        const nextProgress = Math.min(compressionMaxProgress, cur.progress + 1);
        if (nextProgress === cur.progress) return prev;
        const next = [...prev];
        next[idx] = { ...cur, progress: nextProgress };
        return next;
      });
    }, 120);
    compressionTimersRef.current.set(id, compressTimer);

    const compressionPromise = (async () => {
      let compressed = file;
      try {
        compressed = await compressMediaForUpload(file, {
          signal: abortController.signal,
          logTag: "media",
          onProgress: (p) => {
            const mapped = Math.round(
              Math.max(0, Math.min(1, p)) * compressionMaxProgress
            );
            setMediaUploadsAndRef((prev) => {
              const idx = prev.findIndex((x) => x.id === id);
              if (idx === -1) return prev;
              const cur = prev[idx];
              if (cur.status !== "compressing") return prev;
              if (mapped <= cur.progress) return prev;
              const next = [...prev];
              next[idx] = {
                ...cur,
                progress: Math.min(compressionMaxProgress, mapped),
              };
              return next;
            });
          },
        });
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        console.error("Failed to compress media:", e);
      } finally {
        stopCompressionTimer(id);
        compressionAbortRef.current.delete(id);
      }

      const finalFile = renameFileForUpload(compressed);

      setMediaUploadsAndRef((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return prev;
        const cur = prev[idx];
        if (cur.status !== "compressing") return prev;

        let nextPreviewUrl = cur.previewUrl;
        if (finalFile !== cur.file) {
          try {
            URL.revokeObjectURL(cur.previewUrl);
          } catch {
            // ignore
          }
          nextPreviewUrl = URL.createObjectURL(finalFile);
        }

        const next = [...prev];
        next[idx] = {
          ...cur,
          file: finalFile,
          previewUrl: nextPreviewUrl,
          mediaType: inferMediaType(finalFile),
          progress: 100,
          status: "done",
          uploadedUrl: null,
        };
        return next;
      });
    })();
    compressionPromisesRef.current.set(id, compressionPromise);
    compressionPromise.finally(() => {
      compressionPromisesRef.current.delete(id);
    });
  };

  const addMediaFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) addMediaFile(file);
  };

  const removeMedia = (id: string) => {
    stopUploadTimer(id);
    cancelCompression(id);
    setMediaUploadsAndRef((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const closeCamera = () => {
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (recorder.state !== "inactive") {
          discardRecordingRef.current = true;
          recorder.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    recordedChunksRef.current = [];
    setIsRecording(false);

    if (cameraStream) {
      for (const track of cameraStream.getTracks()) track.stop();
    }
    setCameraStream(null);
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const cancelCamera = () => {
    discardRecordingRef.current = true;
    closeCamera();
  };

  const clearMediaError = () => setMediaError(null);

  const resetMedia = () => {
    setMediaError(null);
    for (const timer of uploadTimersRef.current.values()) {
      window.clearInterval(timer);
    }
    uploadTimersRef.current.clear();

    for (const timer of compressionTimersRef.current.values()) {
      window.clearInterval(timer);
    }
    compressionTimersRef.current.clear();
    for (const ctrl of compressionAbortRef.current.values()) {
      try {
        ctrl.abort();
      } catch {
        // ignore
      }
    }
    compressionAbortRef.current.clear();
    compressionPromisesRef.current.clear();

    setMediaUploadsAndRef((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
  };

  const uploadAllMedia = async (
    uploadFn: (file: File) => Promise<string>
  ): Promise<string[]> => {
    const pending = Array.from(compressionPromisesRef.current.values());
    if (pending.length > 0) {
      await Promise.allSettled(pending);
    }

    const items = mediaUploadsRef.current;
    if (items.length === 0) return [];

    const urls: string[] = [];
    for (const item of items) {
      if (item.uploadedUrl) {
        urls.push(item.uploadedUrl);
        continue;
      }

      if (inferMediaType(item.file) === "video" && item.file.size > MAX_VIDEO_UPLOAD_BYTES) {
        const sizeMb = (item.file.size / (1024 * 1024)).toFixed(2);
        const msg = translate(
          `Video must be ${MAX_VIDEO_UPLOAD_MB}MB or less. Selected: ${sizeMb}MB.`
        );
        setMediaError(msg);
        throw new Error(msg);
      }

      // Mark as uploading (UI) and start a lightweight simulated progress while awaiting the real upload.
      setMediaUploadsAndRef((prev) => {
        const idx = prev.findIndex((x) => x.id === item.id);
        if (idx === -1) return prev;
        const cur = prev[idx];
        const next = [...prev];
        next[idx] = {
          ...cur,
          status: "uploading",
          progress: cur.progress,
        };
        return next;
      });

      stopUploadTimer(item.id);
      const timer = window.setInterval(() => {
        setMediaUploadsAndRef((prev) => {
          const idx = prev.findIndex((x) => x.id === item.id);
          if (idx === -1) return prev;
          const cur = prev[idx];
          if (cur.status !== "uploading") return prev;
          const cap = Math.max(95, cur.progress);
          const nextProgress = Math.min(
            cap,
            cur.progress + 4 + Math.floor(Math.random() * 6)
          );
          if (nextProgress <= cur.progress) return prev;
          const next = [...prev];
          next[idx] = { ...cur, progress: nextProgress };
          return next;
        });
      }, 220);
      uploadTimersRef.current.set(item.id, timer);

      try {
        const url = await uploadFn(item.file);
        urls.push(url);
        stopUploadTimer(item.id);
        setMediaUploadsAndRef((prev) => {
          const idx = prev.findIndex((x) => x.id === item.id);
          if (idx === -1) return prev;
          const cur = prev[idx];
          const next = [...prev];
          next[idx] = {
            ...cur,
            status: "done",
            progress: 100,
            uploadedUrl: url,
          };
          return next;
        });
      } catch (e) {
        stopUploadTimer(item.id);
        setMediaUploadsAndRef((prev) => {
          const idx = prev.findIndex((x) => x.id === item.id);
          if (idx === -1) return prev;
          const cur = prev[idx];
          const next = [...prev];
          next[idx] = { ...cur, status: "done", progress: 100 };
          return next;
        });
        throw e;
      }
    }

    return urls;
  };

  const openCamera = async () => {
    discardRecordingRef.current = false;
    const ua = (navigator.userAgent ?? "").toLowerCase();
    const isLikelyMobile =
      /android|iphone|ipad|ipod|mobi/.test(ua) || navigator.maxTouchPoints > 1;

    setCameraError(null);
    setCameraUiMode(isLikelyMobile ? "mobile" : "desktop");
    setIsCameraOpen(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraUiMode("mobile");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setCameraUiMode("desktop");
      setCameraStream(stream);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCameraUiMode("desktop");
        setCameraStream(stream);
      } catch (err2) {
        console.error("Failed to access camera:", err2);
        setCameraError(
          translate(
            "Camera access was blocked. Please allow permission or upload media."
          )
        );
        setCameraUiMode("mobile");
      }
    }
  };

  const openCapture = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      captureAnyInputRef.current?.click();
      return;
    }
    void openCamera();
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    if (!blob) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }

    const safeTs = new Date().toISOString().replace(/[:.]/g, "-");
    const file = new File([blob], `capture-${safeTs}.jpg`, { type: blob.type });
    addMediaFile(file);
    closeCamera();
  };

  const startRecording = () => {
    if (!cameraStream) {
      closeCamera();
      captureVideoInputRef.current?.click();
      return;
    }
    discardRecordingRef.current = false;

    if (!(window as any).MediaRecorder) {
      closeCamera();
      captureVideoInputRef.current?.click();
      return;
    }

    const preferredTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const supportedType =
      preferredTypes.find((mt) =>
        (window as any).MediaRecorder?.isTypeSupported?.(mt)
      ) ?? "";

    try {
      recordedChunksRef.current = [];
      const recordingOptions: MediaRecorderOptions = supportedType
        ? { mimeType: supportedType }
        : {};

      // Try to keep recorded videos reasonably small; browsers may ignore these values.
      // 1.6 Mbps tends to be acceptable quality while reducing size on mobile.
      (recordingOptions as any).videoBitsPerSecond = 1_600_000;
      const recorder = new MediaRecorder(
        cameraStream,
        Object.keys(recordingOptions).length > 0 ? recordingOptions : undefined
      );
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        recordedChunksRef.current = [];
        const shouldDiscard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        if (!shouldDiscard && blob.size > 0) {
          const safeTs = new Date().toISOString().replace(/[:.]/g, "-");
          const file = new File([blob], `capture-${safeTs}.webm`, {
            type: blob.type,
          });
          addMediaFile(file);
        }
        setIsRecording(false);
        stopRecordingTimer();
        closeCamera();
      };
      mediaRecorderRef.current = recorder;
      // Avoid timeslices so very short recordings still produce a blob on stop.
      recorder.start();
      setIsRecording(true);

      stopRecordingTimer();
      setRecordingSecondsLeft(30);
      hasAutoStoppedRef.current = false;
      recordingTimerRef.current = window.setInterval(() => {
        let shouldAutoStop = false;
        setRecordingSecondsLeft((prev) => {
          if (prev === null) return prev;
          const next = prev - 1;
          if (next <= 0) {
            shouldAutoStop = true;
            return 0;
          }
          return next;
        });

        if (shouldAutoStop && !hasAutoStoppedRef.current) {
          hasAutoStoppedRef.current = true;
          try {
            stopRecording();
          } catch {
            // ignore
          }
        }
      }, 1000);
    } catch (e) {
      console.error("Failed to start recording:", e);
      closeCamera();
      captureVideoInputRef.current?.click();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    try {
      stopRecordingTimer();
      try {
        recorder.requestData?.();
      } catch {
        // ignore
      }
      recorder.stop();
    } catch (e) {
      console.error("Failed to stop recording:", e);
      setIsRecording(false);
    }
  };

  const shutterPressStart = () => {
    if (!cameraStream) return;
    // While recording, a single tap stops & saves (no need to keep holding).
    if (isRecording) {
      stopRecording();
      return;
    }
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    shutterTimerRef.current = window.setTimeout(() => {
      shutterTimerRef.current = null;
      shutterStartedRecordingRef.current = true;
      startRecording();
    }, 350);
  };

  const shutterPressEnd = () => {
    // If the user released before long-press threshold, take a photo.
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
      void takePhoto();
      return;
    }

    // If recording started, releasing should NOT stop it; timer (or a later tap) will.
    if (shutterStartedRecordingRef.current) {
      shutterStartedRecordingRef.current = false;
      return;
    }
  };

  const shutterPressCancel = () => {
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    if (isRecording) {
      discardRecordingRef.current = true;
      stopRecording();
    } else {
      cancelCamera();
    }
  };

  useEffect(() => {
    if (!isCameraOpen || !cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    // Some browsers (esp. desktop Safari) won't start playback without an explicit play().
    // Muted + playsInline makes autoplay much more likely to succeed.
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    void videoRef.current.play().catch(() => {});
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (!cameraStream) return;
      if (cameraStream) {
        for (const track of cameraStream.getTracks()) track.stop();
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      for (const timer of uploadTimersRef.current.values()) {
        window.clearInterval(timer);
      }
      uploadTimersRef.current.clear();

      for (const timer of compressionTimersRef.current.values()) {
        window.clearInterval(timer);
      }
      compressionTimersRef.current.clear();
      for (const ctrl of compressionAbortRef.current.values()) {
        try {
          ctrl.abort();
        } catch {
          // ignore
        }
      }
      compressionAbortRef.current.clear();

      stopRecordingTimer({ updateState: false });
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== "inactive") {
            discardRecordingRef.current = true;
            mediaRecorderRef.current.stop();
          }
        } catch {
          // ignore
        }
        mediaRecorderRef.current = null;
      }
      for (const item of mediaUploadsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  return {
    mediaUploads,
    mediaError,
    clearMediaError,
    addMediaFiles,
    removeMedia,
    resetMedia,
    uploadAllMedia,

    captureAnyInputRef,
    captureImageInputRef,
    captureVideoInputRef,
    uploadInputRef,

    isCameraOpen,
    cameraError,
    cameraUiMode,
    cameraStream,
    isRecording,
    recordingSecondsLeft,

    videoRef,
    canvasRef,

    openCapture,
    openCamera,
    closeCamera,
    cancelCamera,
    takePhoto,
    startRecording,
    stopRecording,

    shutterPressStart,
    shutterPressEnd,
    shutterPressCancel,
  };
}
