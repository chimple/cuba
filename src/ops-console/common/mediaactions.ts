import { useEffect, useRef, useState } from 'react';
import { compressMediaForUpload } from './mediaactionscompressor';
import logger from '../../utility/logger';
import type {
  MediaUploadItem,
  UseMediaActionsOptions,
  UseMediaActionsResult,
} from './mediaactions.types';
import {
  createMediaId,
  inferMediaType,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_MB,
  renameFileForUpload,
} from './mediaactionsHelpers';
import { useMediaCamera } from './useMediaCamera';

export type {
  MediaUploadItem,
  UseMediaActionsResult,
} from './mediaactions.types';

const defaultTranslate = (key: string) => key;

export function useMediaActions(
  options: UseMediaActionsOptions = {},
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

  const setMediaUploadsAndRef = (
    updater: (prev: MediaUploadItem[]) => MediaUploadItem[],
  ) => {
    setMediaUploads((prev) => {
      const next = updater(prev);
      mediaUploadsRef.current = next;
      return next;
    });
  };

  const addMediaFile = (file: File) => {
    const mediaType = inferMediaType(file);
    if (mediaType === 'video' && file.size > MAX_VIDEO_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setMediaError(
        translate(
          `Video must be ${MAX_VIDEO_UPLOAD_MB}MB or less. Selected: ${sizeMb}MB.`,
        ),
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
      status: 'compressing',
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
        if (cur.status !== 'compressing') return prev;
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
          logTag: 'media',
          onProgress: (p) => {
            const mapped = Math.round(
              Math.max(0, Math.min(1, p)) * compressionMaxProgress,
            );
            setMediaUploadsAndRef((prev) => {
              const idx = prev.findIndex((x) => x.id === id);
              if (idx === -1) return prev;
              const cur = prev[idx];
              if (cur.status !== 'compressing') return prev;
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
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
      } finally {
        stopCompressionTimer(id);
        compressionAbortRef.current.delete(id);
      }

      const finalFile = renameFileForUpload(compressed, schoolId);

      setMediaUploadsAndRef((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return prev;
        const cur = prev[idx];
        if (cur.status !== 'compressing') return prev;

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
          status: 'done',
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

  const cameraActions = useMediaCamera({
    translate,
    addMediaFile,
    captureAnyInputRef,
    captureImageInputRef,
    captureVideoInputRef,
  });

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
    uploadFn: (file: File) => Promise<string>,
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

      if (
        inferMediaType(item.file) === 'video' &&
        item.file.size > MAX_VIDEO_UPLOAD_BYTES
      ) {
        const sizeMb = (item.file.size / (1024 * 1024)).toFixed(2);
        const msg = translate(
          `Video must be ${MAX_VIDEO_UPLOAD_MB}MB or less. Selected: ${sizeMb}MB.`,
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
          status: 'uploading',
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
          if (cur.status !== 'uploading') return prev;
          const cap = Math.max(95, cur.progress);
          const nextProgress = Math.min(
            cap,
            cur.progress + 4 + Math.floor(Math.random() * 6),
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
            status: 'done',
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
          next[idx] = { ...cur, status: 'done', progress: 100 };
          return next;
        });
        throw e;
      }
    }

    return urls;
  };

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
    uploadInputRef,
    ...cameraActions,
  };
}
