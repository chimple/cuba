import {
  CompressWorkerProgressResponse,
  CompressWorkerRequest,
  CompressWorkerResponse,
  VideoQuality,
} from './mediaCompression.worker.types';

type CompressOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  maxImageDimension?: number;
  imageQuality?: number;
  videoQuality?: VideoQuality;
};

type PendingMediaTask = {
  resolve: (value: File) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  abortListener?: () => void;
};

let workerInstance: Worker | null = null;
const pendingTasks = new Map<string, PendingMediaTask>();
let nextId = 0;

const createRequestId = () => {
  nextId += 1;
  return `media_${Date.now()}_${nextId}`;
};

const getWorker = (): Worker => {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new Worker(
    new URL('./mediaCompression.worker.ts', import.meta.url),
  );
  workerInstance.onmessage = (event: MessageEvent<CompressWorkerResponse>) => {
    const response = event.data;
    const pending = pendingTasks.get(response.id);
    if (!pending) {
      return;
    }
    if ('progress' in response) {
      const progressEvent = response as CompressWorkerProgressResponse;
      pending.onProgress?.(Math.max(0, Math.min(1, progressEvent.progress)));
      return;
    }
    pendingTasks.delete(response.id);
    if (pending.signal && pending.abortListener) {
      pending.signal.removeEventListener('abort', pending.abortListener);
    }
    if (!response.ok) {
      pending.reject(new Error(response.error));
      return;
    }
    if (!('done' in response) || !response.done) {
      pending.reject(new Error('Unexpected media worker response'));
      return;
    }
    const { result } = response;
    pending.resolve(
      new File([result.buffer], result.fileName, { type: result.mimeType }),
    );
  };
  workerInstance.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || 'Media compression worker error');
    for (const [, pending] of pendingTasks) {
      if (pending.signal && pending.abortListener) {
        pending.signal.removeEventListener('abort', pending.abortListener);
      }
      pending.reject(error);
    }
    pendingTasks.clear();
  };
  return workerInstance;
};

const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> =>
  file.arrayBuffer();

export const runMediaCompressionTask = async (
  type: CompressWorkerRequest['type'],
  file: File,
  options: CompressOptions = {},
): Promise<File> => {
  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  const worker = getWorker();
  const id = createRequestId();
  const buffer = await fileToArrayBuffer(file);
  const payloadBase = {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    buffer,
  };
  const request: CompressWorkerRequest =
    type === 'COMPRESS_VIDEO'
      ? {
          id,
          type,
          payload: {
            ...payloadBase,
            quality: options.videoQuality ?? 'medium',
          },
        }
      : type === 'COMPRESS_IMAGE_CANVAS'
        ? {
            id,
            type,
            payload: {
              ...payloadBase,
              maxImageDimension: options.maxImageDimension ?? 1080,
              imageQuality: options.imageQuality ?? 0.72,
            },
          }
        : {
            id,
            type,
            payload: payloadBase,
          };

  return new Promise<File>((resolve, reject) => {
    const task: PendingMediaTask = {
      resolve,
      reject,
      onProgress: options.onProgress,
      signal: options.signal,
    };
    const abortListener = () => {
      pendingTasks.delete(id);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (options.signal) {
      task.abortListener = abortListener;
      options.signal.addEventListener('abort', abortListener, { once: true });
    }
    pendingTasks.set(id, task);
    worker.postMessage(request, [request.payload.buffer]);
  });
};

export const terminateMediaCompressionWorker = () => {
  if (!workerInstance) {
    return;
  }
  workerInstance.terminate();
  workerInstance = null;
  for (const [, pending] of pendingTasks) {
    if (pending.signal && pending.abortListener) {
      pending.signal.removeEventListener('abort', pending.abortListener);
    }
    pending.reject(new Error('Media compression worker terminated'));
  }
  pendingTasks.clear();
};
