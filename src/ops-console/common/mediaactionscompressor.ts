import { useCallback, useState } from 'react';
import { runMediaCompressionTask } from '../../workers/mediaCompressionWorkerClient';
import { VideoQuality } from '../../workers/mediaCompression.worker.types';
import logger from '../../utility/logger';

type CompressProgressCb = (progress: number) => void;

type CompressOptions = {
  signal?: AbortSignal;
  onProgress?: CompressProgressCb;
  maxImageDimension?: number;
  imageQuality?: number;
  videoQuality?: VideoQuality;
  logTag?: string;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const precision = idx === 0 ? 0 : idx === 1 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[idx]}`;
};

const inferMediaKind = (file: File): 'video' | 'image' | 'other' => {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? (name.split('.').pop() ?? '') : '';
  const imageExts = new Set([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'bmp',
    'heic',
    'heif',
    'avif',
    'tif',
    'tiff',
    'svg',
  ]);
  const videoExts = new Set([
    'mp4',
    'mov',
    'm4v',
    'webm',
    'mkv',
    'avi',
    '3gp',
    '3gpp',
    '3g2',
    'ogg',
    'ogv',
  ]);
  if (videoExts.has(ext)) return 'video';
  if (imageExts.has(ext)) return 'image';
  return 'other';
};

const shouldSkipVideoCompression = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isWebm = mime.includes('webm') || ext === 'webm';
  return file.size < 2 * 1024 * 1024 || isWebm;
};

const shouldSkipImageCompression = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  const ext = ((file.name || '').split('.').pop() || '').toLowerCase();
  return (
    mime === 'image/gif' ||
    mime === 'image/svg+xml' ||
    ext === 'gif' ||
    ext === 'svg'
  );
};

const preferWorkerCanvas = () =>
  typeof OffscreenCanvas !== 'undefined' &&
  typeof createImageBitmap === 'function';

export async function compressMediaForUpload(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { signal, onProgress, logTag = 'media' } = options;
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  const kind = inferMediaKind(file);
  if (kind === 'video') {
    if (shouldSkipVideoCompression(file)) {
      onProgress?.(1);
      return file;
    }
    try {
      const compressed = await runMediaCompressionTask('COMPRESS_VIDEO', file, {
        signal,
        onProgress,
        videoQuality: options.videoQuality ?? 'medium',
      });
      if (compressed.size >= file.size) {
        logger.info(
          `[${logTag}] kept original (compressed larger): ${file.name} (${formatBytes(
            file.size,
          )} -> ${formatBytes(compressed.size)})`,
        );
        onProgress?.(1);
        return file;
      }
      onProgress?.(1);
      return compressed;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      logger.error(`[${logTag}] video compression failed:`, error);
      onProgress?.(1);
      return file;
    }
  }

  if (kind === 'image') {
    if (shouldSkipImageCompression(file)) {
      onProgress?.(1);
      return file;
    }
    const taskType = preferWorkerCanvas()
      ? 'COMPRESS_IMAGE_CANVAS'
      : 'COMPRESS_IMAGE_FFMPEG';
    try {
      const compressed = await runMediaCompressionTask(taskType, file, {
        signal,
        onProgress: (progress) => onProgress?.(clamp01(progress)),
        maxImageDimension: options.maxImageDimension ?? 1080,
        imageQuality: options.imageQuality ?? 0.72,
      });
      if (compressed.size >= file.size) {
        logger.info(
          `[${logTag}] compression skipped (no size reduction): ${file.name} (${formatBytes(
            file.size,
          )} -> ${formatBytes(compressed.size)})`,
        );
        onProgress?.(1);
        return file;
      }
      onProgress?.(1);
      return compressed;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      logger.error(`[${logTag}] image compression failed:`, error);
      onProgress?.(1);
      return file;
    }
  }

  onProgress?.(1);
  return file;
}

export type FFmpegCompressType = 'video' | 'image';

export const useFFmpegCompress = () => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(true);

  const loadFFmpeg = useCallback(async () => {
    setLoading(false);
    setReady(true);
  }, []);

  const compressFile = useCallback(
    async (file: File, type: FFmpegCompressType) => {
      if (!ready) {
        throw new Error('Media worker not ready');
      }
      setLoading(true);
      try {
        if (type === 'video') {
          return await compressMediaForUpload(file, {
            logTag: 'media',
            videoQuality: 'medium',
          });
        }
        return await compressMediaForUpload(file, { logTag: 'media' });
      } finally {
        setLoading(false);
      }
    },
    [ready],
  );

  return { loadFFmpeg, compressFile, loading, ready };
};
