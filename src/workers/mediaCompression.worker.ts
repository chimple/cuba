import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import {
  CompressWorkerRequest,
  CompressWorkerResponse,
  VideoQuality,
} from './mediaCompression.worker.types';

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope;
const WORKER_SIGNATURE = '[MEDIA-WORKER]';
const FFMPEG_CACHE_PREFIX = 'ffmpeg-core-cache-v0.12.6';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;
let ffmpegLoadFailed = false;
let ffmpegTaskQueue: Promise<void> = Promise.resolve();

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const toTransferableArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

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

const toCachedBlobURL = async (
  url: string,
  mimeType: string,
  cacheBucket: string,
): Promise<string> => {
  const hasCacheStorage = typeof caches !== 'undefined';
  if (!hasCacheStorage) {
    return toBlobURL(url, mimeType);
  }
  const cacheName = `${FFMPEG_CACHE_PREFIX}:${cacheBucket}`;
  const cache = await caches.open(cacheName);
  let res = await cache.match(url);
  if (!res) {
    res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
      );
    }
    await cache.put(url, res.clone());
  }
  const ab = await res.arrayBuffer();
  const blob = new Blob([ab], { type: mimeType });
  return URL.createObjectURL(blob);
};

const postProgress = (
  id: string,
  progress: number,
  phase: 'loading' | 'processing' | 'finalizing',
) => {
  const response: CompressWorkerResponse = {
    id,
    ok: true,
    progress: clamp01(progress),
    phase,
  };
  workerScope.postMessage(response);
};

const getVideoSettings = (quality: VideoQuality) => {
  switch (quality) {
    case 'high':
      return {
        crf: 23,
        maxWidth: 1280,
        fps: 30,
        audioBitrate: '128k',
        preset: 'veryfast' as const,
      };
    case 'low':
      return {
        crf: 30,
        maxWidth: 640,
        fps: 24,
        audioBitrate: '64k',
        preset: 'ultrafast' as const,
      };
    case 'medium':
    default:
      return {
        crf: 26,
        maxWidth: 960,
        fps: 30,
        audioBitrate: '96k',
        preset: 'veryfast' as const,
      };
  }
};

const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegLoadFailed) {
    throw new Error('FFmpeg failed to load previously');
  }
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (ffmpegLoading) {
    return ffmpegLoading;
  }
  ffmpegLoading = (async () => {
    try {
      const ffmpeg = new FFmpeg();
      const supportsMultiThread =
        globalThis.crossOriginIsolated === true &&
        typeof (globalThis as any).SharedArrayBuffer !== 'undefined';

      const loadCore = async (coreBaseUrl: string, multithread: boolean) => {
        const bucket = multithread ? 'mt' : 'st';
        const coreURL = await toCachedBlobURL(
          `${coreBaseUrl}/ffmpeg-core.js`,
          'text/javascript',
          bucket,
        );
        const wasmURL = await toCachedBlobURL(
          `${coreBaseUrl}/ffmpeg-core.wasm`,
          'application/wasm',
          bucket,
        );
        const workerURL = multithread
          ? await toCachedBlobURL(
              `${coreBaseUrl}/ffmpeg-core.worker.js`,
              'text/javascript',
              bucket,
            )
          : undefined;
        await ffmpeg.load({ coreURL, wasmURL, workerURL });
      };

      const localBase = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
      if (supportsMultiThread) {
        try {
          await loadCore(localBase, true);
        } catch (error) {
          console.error(
            `${WORKER_SIGNATURE} local mt FFmpeg load failed, trying fallbacks.`,
            error,
          );
          try {
            await loadCore(localBase, false);
          } catch {
            await loadCore(
              'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd',
              true,
            );
          }
        }
      } else {
        try {
          await loadCore(localBase, false);
        } catch {
          await loadCore(
            'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
            false,
          );
        }
      }
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      ffmpegLoadFailed = true;
      ffmpegLoading = null;
      throw error;
    }
  })();
  return ffmpegLoading;
};

const toResultName = (fileName: string, ext: string) =>
  `${fileName.replace(/\.[^.]+$/, '')}-compressed.${ext}`;

const compressVideo = async (
  id: string,
  payload: Extract<
    CompressWorkerRequest,
    { type: 'COMPRESS_VIDEO' }
  >['payload'],
) => {
  postProgress(id, 0.05, 'loading');
  const ffmpeg = await getFFmpeg();
  postProgress(id, 0.1, 'processing');

  const ext = payload.fileName.split('.').pop() || 'mp4';
  const inputFileName = `input_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const outputFileName = `output_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp4`;
  const settings = getVideoSettings(payload.quality);

  return runWithFFmpegLock(async () => {
    const progressHandler = ({ progress }: { progress: number }) => {
      postProgress(id, 0.15 + clamp01(progress) * 0.75, 'processing');
    };
    ffmpeg.on('progress', progressHandler);
    try {
      const inputBytes = new Uint8Array(payload.buffer);
      await ffmpeg.writeFile(inputFileName, inputBytes);
      await ffmpeg.exec([
        '-i',
        inputFileName,
        '-c:v',
        'libx264',
        '-crf',
        settings.crf.toString(),
        '-preset',
        settings.preset,
        '-pix_fmt',
        'yuv420p',
        '-r',
        settings.fps.toString(),
        '-vf',
        `scale='min(${settings.maxWidth},iw)':-2:flags=bilinear`,
        '-c:a',
        'aac',
        '-b:a',
        settings.audioBitrate,
        '-ac',
        '2',
        '-movflags',
        '+faststart',
        '-y',
        outputFileName,
      ]);
      const output = await ffmpeg.readFile(outputFileName);
      const outBytes =
        output instanceof Uint8Array
          ? output
          : new TextEncoder().encode(output);
      postProgress(id, 0.98, 'finalizing');
      return {
        fileName: toResultName(payload.fileName, 'mp4'),
        mimeType: 'video/mp4',
        buffer: toTransferableArrayBuffer(outBytes),
      };
    } finally {
      ffmpeg.off('progress', progressHandler);
      try {
        await ffmpeg.deleteFile(inputFileName);
      } catch {}
      try {
        await ffmpeg.deleteFile(outputFileName);
      } catch {}
    }
  });
};

const compressImageCanvas = async (
  id: string,
  payload: Extract<
    CompressWorkerRequest,
    { type: 'COMPRESS_IMAGE_CANVAS' }
  >['payload'],
) => {
  postProgress(id, 0.05, 'loading');
  const blob = new Blob([payload.buffer], {
    type: payload.mimeType || 'image/jpeg',
  });
  const bitmap = await createImageBitmap(blob);
  try {
    postProgress(id, 0.2, 'processing');
    const srcW = bitmap.width || 1;
    const srcH = bitmap.height || 1;
    const scale = Math.min(1, payload.maxImageDimension / Math.max(srcW, srcH));
    const dstW = Math.max(1, Math.round(srcW * scale));
    const dstH = Math.max(1, Math.round(srcH * scale));
    const canvas = new OffscreenCanvas(dstW, dstH);
    const ctx = canvas.getContext(
      '2d',
    ) as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
      throw new Error('Failed to get OffscreenCanvas context');
    }
    ctx.drawImage(bitmap, 0, 0, dstW, dstH);
    postProgress(id, 0.8, 'processing');

    const canvasWithConvert = canvas as OffscreenCanvas & {
      convertToBlob: (options?: {
        type?: string;
        quality?: number;
      }) => Promise<Blob>;
    };
    let outBlob = await canvasWithConvert.convertToBlob({
      type: 'image/webp',
      quality: clamp01(payload.imageQuality),
    });
    if (!outBlob || outBlob.size <= 0) {
      outBlob = await canvasWithConvert.convertToBlob({
        type: 'image/jpeg',
        quality: clamp01(payload.imageQuality),
      });
    }
    const outputBuffer = await outBlob.arrayBuffer();
    postProgress(id, 0.98, 'finalizing');
    const ext = outBlob.type === 'image/webp' ? 'webp' : 'jpg';
    return {
      fileName: toResultName(payload.fileName, ext),
      mimeType: outBlob.type || 'image/jpeg',
      buffer: outputBuffer,
    };
  } finally {
    bitmap.close();
  }
};

const compressImageFFmpeg = async (
  id: string,
  payload: Extract<
    CompressWorkerRequest,
    { type: 'COMPRESS_IMAGE_FFMPEG' }
  >['payload'],
) => {
  postProgress(id, 0.05, 'loading');
  const ffmpeg = await getFFmpeg();
  postProgress(id, 0.1, 'processing');
  const inputExt = payload.fileName.split('.').pop() || 'jpg';
  const inputFileName = `input_${Date.now()}_${Math.floor(Math.random() * 1000)}.${inputExt}`;
  const outputFileName = `output_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`;

  return runWithFFmpegLock(async () => {
    const progressHandler = ({ progress }: { progress: number }) => {
      postProgress(id, 0.15 + clamp01(progress) * 0.75, 'processing');
    };
    ffmpeg.on('progress', progressHandler);
    try {
      await ffmpeg.writeFile(inputFileName, new Uint8Array(payload.buffer));
      await ffmpeg.exec([
        '-i',
        inputFileName,
        '-vf',
        'scale=1920:1080:force_original_aspect_ratio=decrease:flags=fast_bilinear',
        '-c:v',
        'libwebp',
        '-q:v',
        '90',
        '-compression_level',
        '4',
        '-lossless',
        '0',
        '-y',
        outputFileName,
      ]);
      const output = await ffmpeg.readFile(outputFileName);
      const outBytes =
        output instanceof Uint8Array
          ? output
          : new TextEncoder().encode(output);
      postProgress(id, 0.98, 'finalizing');
      return {
        fileName: toResultName(payload.fileName, 'webp'),
        mimeType: 'image/webp',
        buffer: toTransferableArrayBuffer(outBytes),
      };
    } finally {
      ffmpeg.off('progress', progressHandler);
      try {
        await ffmpeg.deleteFile(inputFileName);
      } catch {}
      try {
        await ffmpeg.deleteFile(outputFileName);
      } catch {}
    }
  });
};

const runRequest = async (request: CompressWorkerRequest) => {
  switch (request.type) {
    case 'COMPRESS_VIDEO':
      return compressVideo(request.id, request.payload);
    case 'COMPRESS_IMAGE_CANVAS':
      return compressImageCanvas(request.id, request.payload);
    case 'COMPRESS_IMAGE_FFMPEG':
      return compressImageFFmpeg(request.id, request.payload);
    default:
      throw new Error(`Unsupported media worker request`);
  }
};

workerScope.onmessage = async (event: MessageEvent<CompressWorkerRequest>) => {
  const request = event.data;
  try {
    const result = await runRequest(request);
    const response: CompressWorkerResponse = {
      id: request.id,
      ok: true,
      done: true,
      result,
    };
    workerScope.postMessage(response, [result.buffer]);
  } catch (error) {
    const response: CompressWorkerResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    workerScope.postMessage(response);
    console.error(`${WORKER_SIGNATURE} failed`, {
      id: request.id,
      type: request.type,
      error: response.error,
      ts: Date.now(),
    });
  }
};
