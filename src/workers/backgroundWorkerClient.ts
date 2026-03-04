import { v4 as uuidv4 } from "uuid";
import {
  BackgroundWorkerTask,
  WorkerRequest,
  WorkerResponse,
  WorkerTaskPayloadMap,
  WorkerTaskResultMap,
} from "./background.worker.types";

const MAIN_THREAD_SIGNATURE = "[MAIN-THREAD]";

type PendingTask = {
  resolve: (value: any) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};

let workerInstance: Worker | null = null;
const pendingTasks = new Map<string, PendingTask>();

const getWorker = (): Worker => {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new Worker(new URL("./background.worker.ts", import.meta.url));

  workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;

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
  };
  workerInstance.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || "Background worker error");
    for (const [, pending] of pendingTasks) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(error);
    }
    pendingTasks.clear();
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
