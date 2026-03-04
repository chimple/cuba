import { v4 as uuidv4 } from "uuid";
import {
  BackgroundWorkerTask,
  SqlStatement,
  StreamSyncBatchesPayload,
  WorkerAckMessage,
  WorkerBatchReadyMessage,
  WorkerDoneMessage,
  WorkerIncomingMessage,
  WorkerRequest,
  WorkerResponse,
  WorkerStreamErrorMessage,
  WorkerStreamRequest,
  WorkerTaskPayloadMap,
  WorkerTaskResultMap,
} from "./background.worker.types";

type PendingTask = {
  resolve: (value: any) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};
type PendingStreamTask = {
  resolve: () => void;
  reject: (reason?: unknown) => void;
  onBatch: (batch: SqlStatement[]) => Promise<void> | void;
  timeoutId: number;
  timeoutMs: number;
};

let workerInstance: Worker | null = null;
const pendingTasks = new Map<string, PendingTask>();
const pendingStreamTasks = new Map<string, PendingStreamTask>();

const resetStreamTimeout = (id: string, streamTask: PendingStreamTask) => {
  window.clearTimeout(streamTask.timeoutId);
  streamTask.timeoutId = window.setTimeout(() => {
    pendingStreamTasks.delete(id);
    streamTask.reject(new Error("Background worker stream task timed out"));
  }, streamTask.timeoutMs);
};

const getWorker = (): Worker => {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new Worker(new URL("./background.worker.ts", import.meta.url));

  workerInstance.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
    const response = event.data;
    if ("ok" in response) {
      const pending = pendingTasks.get(response.id);
      if (!pending) {
        return;
      }
      window.clearTimeout(pending.timeoutId);
      pendingTasks.delete(response.id);
      if (!response.ok) {
        pending.reject(new Error(response.error));
        return;
      }
      pending.resolve(response.result);
      return;
    }

    const pendingStream = pendingStreamTasks.get(response.id);
    if (!pendingStream) {
      return;
    }
    if (response.type === "BATCH_READY") {
      resetStreamTimeout(response.id, pendingStream);
      Promise.resolve(pendingStream.onBatch((response as WorkerBatchReadyMessage).batch))
        .then(() => {
          const ack: WorkerAckMessage = {
            id: response.id,
            type: "ACK",
          };
          workerInstance?.postMessage(ack);
        })
        .catch((error) => {
          window.clearTimeout(pendingStream.timeoutId);
          pendingStreamTasks.delete(response.id);
          pendingStream.reject(error);
        });
      return;
    }
    if (response.type === "DONE") {
      window.clearTimeout(pendingStream.timeoutId);
      pendingStreamTasks.delete(response.id);
      pendingStream.resolve();
      return;
    }
    if (response.type === "ERROR") {
      window.clearTimeout(pendingStream.timeoutId);
      pendingStreamTasks.delete(response.id);
      pendingStream.reject(new Error((response as WorkerStreamErrorMessage).error));
      return;
    }
  };
  workerInstance.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || "Background worker error");
    for (const [, pending] of pendingTasks) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(error);
    }
    pendingTasks.clear();
    for (const [, pending] of pendingStreamTasks) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(error);
    }
    pendingStreamTasks.clear();
  };
  return workerInstance;
};

export const runBackgroundWorkerTask = <
  T extends BackgroundWorkerTask,
>(
  type: T,
  payload: WorkerTaskPayloadMap[T],
  timeoutMs: number = 120000,
): Promise<WorkerTaskResultMap[T]> => {
  const worker = getWorker();
  const id = uuidv4();
  const request: WorkerRequest<T> = { id, type, payload };
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingTasks.delete(id);
      reject(new Error(`Background worker task timed out: ${type}`));
    }, timeoutMs);
    pendingTasks.set(id, { resolve, reject, timeoutId });
    worker.postMessage(request);
  }) as Promise<WorkerTaskResultMap[T]>;
};

export const runBackgroundWorkerStreamingSync = (
  payload: StreamSyncBatchesPayload,
  onBatch: (batch: SqlStatement[]) => Promise<void> | void,
  timeoutMs: number = 180000,
): Promise<void> => {
  const worker = getWorker();
  const id = uuidv4();
  const request: WorkerStreamRequest = {
    id,
    type: "STREAM_SYNC_BATCHES",
    payload,
  };
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingStreamTasks.delete(id);
      reject(new Error("Background worker stream task timed out"));
    }, timeoutMs);
    pendingStreamTasks.set(id, {
      resolve,
      reject,
      onBatch,
      timeoutId,
      timeoutMs,
    });
    worker.postMessage(request);
  });
};
