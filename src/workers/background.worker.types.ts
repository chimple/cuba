export type SyncRow = Record<string, unknown>;

export type SqlStatement = {
  statement: string;
  values: unknown[];
};

export type PrepareSyncBatchesPayload = {
  tables: Record<string, SyncRow[]>;
  tableColumns: Record<string, string[]>;
  defaultBatchSize: number;
  userTableName: string;
  userTableBatchSize: number;
  includePayloadSizeBytes?: boolean;
};

export type PrepareSyncBatchesResult = {
  tableBatches: Record<string, SqlStatement[][]>;
  rowCountByTable: Record<string, number>;
  payloadSizeBytes: number;
};

export type PrepareBinaryFromBase64Payload = {
  base64: string;
  algorithm?: 'SHA-256';
};

export type PrepareBinaryFromBase64Result = {
  byteLength: number;
  sha256Hex: string;
  arrayBuffer: ArrayBuffer;
};

export type ChecksumFile = {
  path: string;
  hash: string;
};

export type PlanHotUpdatePayload = {
  activeFiles: ChecksumFile[];
  serverFiles: ChecksumFile[];
};

export type PlanHotUpdateResult = {
  copyFromPreviousPaths: string[];
  downloadFromServerPaths: string[];
};

export type GrowthBookAttributesPayload = {
  attributes: Record<string, any>;
  language: string;
};

export type GrowthBookAttributesResult = Record<string, any>;

export type PrepareBulkUploadPayloadPayload = {
  schoolData: any[];
  classData: any[];
  teacherData: any[];
  studentData: any[];
};

export type PrepareBulkUploadPayloadResult = any[];

export type ParseXlsxSheetsPayload = {
  fileBuffer: ArrayBuffer;
};

export type ParseXlsxSheetsResult = {
  sheetNames: string[];
  sheets: Record<string, Record<string, any>[]>;
};

export type BuildXlsxFilePayload = {
  sheetNames: string[];
  sheets: Record<string, Record<string, any>[]>;
};

export type BuildXlsxFileResult = {
  fileBuffer: ArrayBuffer;
};

export type DownloadStickerBookSvgPayload = {
  url: string;
};

export type DownloadStickerBookSvgResult = {
  svgText: string;
};

export type StreamSyncBatchesPayload = {
  tables: Record<string, SyncRow[]>;
  tableColumns: Record<string, string[]>;
  defaultBatchSize: number;
  userTableName: string;
  userTableBatchSize: number;
  rowsPerChunk?: number;
};

export type WorkerTaskPayloadMap = {
  PREPARE_SYNC_BATCHES: PrepareSyncBatchesPayload;
  PREPARE_BINARY_FROM_BASE64: PrepareBinaryFromBase64Payload;
  PLAN_HOT_UPDATE_FILES: PlanHotUpdatePayload;
  PREPARE_GROWTHBOOK_ATTRIBUTES: GrowthBookAttributesPayload;
  PREPARE_BULK_UPLOAD_PAYLOAD: PrepareBulkUploadPayloadPayload;
  PARSE_XLSX_SHEETS: ParseXlsxSheetsPayload;
  BUILD_XLSX_FILE: BuildXlsxFilePayload;
  DOWNLOAD_STICKER_BOOK_SVG: DownloadStickerBookSvgPayload;
};

export type WorkerTaskResultMap = {
  PREPARE_SYNC_BATCHES: PrepareSyncBatchesResult;
  PREPARE_BINARY_FROM_BASE64: PrepareBinaryFromBase64Result;
  PLAN_HOT_UPDATE_FILES: PlanHotUpdateResult;
  PREPARE_GROWTHBOOK_ATTRIBUTES: GrowthBookAttributesResult;
  PREPARE_BULK_UPLOAD_PAYLOAD: PrepareBulkUploadPayloadResult;
  PARSE_XLSX_SHEETS: ParseXlsxSheetsResult;
  BUILD_XLSX_FILE: BuildXlsxFileResult;
  DOWNLOAD_STICKER_BOOK_SVG: DownloadStickerBookSvgResult;
};

export type BackgroundWorkerTask = keyof WorkerTaskPayloadMap;

export type WorkerStreamTask = 'STREAM_SYNC_BATCHES';

export type WorkerRequest<
  T extends BackgroundWorkerTask = BackgroundWorkerTask,
> = {
  id: string;
  type: T;
  payload: WorkerTaskPayloadMap[T];
};

export type WorkerStreamRequest = {
  id: string;
  type: WorkerStreamTask;
  payload: StreamSyncBatchesPayload;
};

export type WorkerAckMessage = {
  id: string;
  type: 'ACK';
};

export type WorkerBatchReadyMessage = {
  id: string;
  type: 'BATCH_READY';
  batch: SqlStatement[];
};

export type WorkerDoneMessage = {
  id: string;
  type: 'DONE';
};

export type WorkerStreamErrorMessage = {
  id: string;
  type: 'ERROR';
  error: string;
};

export type WorkerSuccessResponse<
  T extends BackgroundWorkerTask = BackgroundWorkerTask,
> = {
  id: string;
  ok: true;
  type: T;
  result: WorkerTaskResultMap[T];
};

export type WorkerErrorResponse = {
  id: string;
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
export type WorkerStreamEventMessage =
  | WorkerBatchReadyMessage
  | WorkerDoneMessage
  | WorkerStreamErrorMessage;
export type WorkerIncomingMessage = WorkerResponse | WorkerStreamEventMessage;
