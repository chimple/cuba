import logger from '../utility/logger';
import { buildBulkUploadPayload } from './background.worker.bulkUpload';
import { prepareBinaryFromBase64 } from './background.worker.binary';
import {
  downloadRemoteAudio,
  downloadStickerBookSvg,
} from './background.worker.downloads';
import { buildGrowthBookAttributes } from './background.worker.growthbook';
import { planHotUpdateFiles } from './background.worker.hotUpdate';
import {
  buildStatementsForRows,
  buildSyncBatches,
  safeTableName,
} from './background.worker.sqlite';
import { buildXlsxFile, parseXlsxSheets } from './background.worker.xlsx';
import {
  WorkerAckMessage,
  BackgroundWorkerTask,
  StreamSyncBatchesPayload,
  SqlStatement,
  WorkerBatchReadyMessage,
  WorkerDoneMessage,
  WorkerRequest,
  WorkerResponse,
  WorkerStreamErrorMessage,
  WorkerStreamRequest,
} from './background.worker.types';

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope;
const pendingAckResolvers = new Map<string, () => void>();

const handlers: {
  [K in BackgroundWorkerTask]: (
    payload: WorkerRequest<K>['payload'],
  ) => Promise<unknown> | unknown;
} = {
  PREPARE_SYNC_BATCHES: (payload) => buildSyncBatches(payload),
  PREPARE_BINARY_FROM_BASE64: (payload) => prepareBinaryFromBase64(payload),
  PLAN_HOT_UPDATE_FILES: (payload) => planHotUpdateFiles(payload),
  PREPARE_GROWTHBOOK_ATTRIBUTES: (payload) =>
    buildGrowthBookAttributes(payload),
  PREPARE_BULK_UPLOAD_PAYLOAD: (payload) => buildBulkUploadPayload(payload),
  PARSE_XLSX_SHEETS: (payload) => parseXlsxSheets(payload),
  BUILD_XLSX_FILE: (payload) => buildXlsxFile(payload),
  DOWNLOAD_STICKER_BOOK_SVG: (payload) => downloadStickerBookSvg(payload),
  DOWNLOAD_REMOTE_AUDIO: (payload) => downloadRemoteAudio(payload),
};

const waitForAck = (id: string): Promise<void> =>
  new Promise((resolve) => {
    pendingAckResolvers.set(id, resolve);
  });

const emitBatchReady = (id: string, batch: SqlStatement[]) => {
  const message: WorkerBatchReadyMessage = {
    id,
    type: 'BATCH_READY',
    batch,
  };
  workerScope.postMessage(message);
};

const streamSyncBatches = async (request: WorkerStreamRequest) => {
  const payload: StreamSyncBatchesPayload = request.payload;
  const rowsPerChunk = Math.max(payload.rowsPerChunk ?? 200, 1);
  const {
    tables,
    tableColumns,
    defaultBatchSize,
    userTableBatchSize,
    userTableName,
  } = payload;

  for (const [tableName, rows] of Object.entries(tables)) {
    const resolvedTableName = safeTableName(tableName);
    const existingColumns = tableColumns[resolvedTableName] ?? [];
    if (!rows?.length || !existingColumns.length) continue;

    const batchSize =
      resolvedTableName === userTableName
        ? Math.max(userTableBatchSize, 1)
        : Math.max(defaultBatchSize, 1);

    for (let i = 0; i < rows.length; i += rowsPerChunk) {
      const rowChunk = rows.slice(i, i + rowsPerChunk);
      const { statements } = buildStatementsForRows(
        resolvedTableName,
        rowChunk,
        existingColumns,
      );
      if (!statements.length) continue;

      for (let j = 0; j < statements.length; j += batchSize) {
        const batch = statements.slice(j, j + batchSize);
        emitBatchReady(request.id, batch);
        await waitForAck(request.id);
      }
    }
  }
};

workerScope.onmessage = async (
  event: MessageEvent<WorkerRequest | WorkerStreamRequest | WorkerAckMessage>,
) => {
  const request = event.data;
  if (request.type === 'ACK') {
    const resolver = pendingAckResolvers.get(request.id);
    if (resolver) {
      pendingAckResolvers.delete(request.id);
      resolver();
    }
    return;
  }
  try {
    if (request.type === 'STREAM_SYNC_BATCHES') {
      await streamSyncBatches(request);
      const doneMessage: WorkerDoneMessage = {
        id: request.id,
        type: 'DONE',
      };
      workerScope.postMessage(doneMessage);
      return;
    }
    const handler = handlers[request.type];
    if (!handler) {
      throw new Error(`Unsupported worker task: ${request.type}`);
    }
    const result = await handler(request.payload as never);
    if (
      request.type === 'PREPARE_BINARY_FROM_BASE64' &&
      result &&
      typeof result === 'object' &&
      'arrayBuffer' in result
    ) {
      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        type: request.type,
        result: result as never,
      };
      workerScope.postMessage(response, [
        (result as { arrayBuffer: ArrayBuffer }).arrayBuffer,
      ]);
      return;
    }
    if (
      request.type === 'BUILD_XLSX_FILE' &&
      result &&
      typeof result === 'object' &&
      'fileBuffer' in result
    ) {
      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        type: request.type,
        result: result as never,
      };
      workerScope.postMessage(response, [
        (result as { fileBuffer: ArrayBuffer }).fileBuffer,
      ]);
      return;
    }
    const response: WorkerResponse = {
      id: request.id,
      ok: true,
      type: request.type,
      result: result as never,
    };
    workerScope.postMessage(response);
  } catch (error) {
    if (request.type === 'STREAM_SYNC_BATCHES') {
      const response: WorkerStreamErrorMessage = {
        id: request.id,
        type: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
      };
      workerScope.postMessage(response);
      pendingAckResolvers.delete(request.id);
      return;
    }
    const response: WorkerResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    workerScope.postMessage(response);
    logger.error(`[BG-WORKER] failed`, {
      id: request.id,
      type: request.type,
      error: response.error,
      ts: Date.now(),
    });
  }
};
