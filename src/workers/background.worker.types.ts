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
};

export type PrepareSyncBatchesResult = {
  tableBatches: Record<string, SqlStatement[][]>;
  rowCountByTable: Record<string, number>;
  payloadSizeBytes: number;
};

export type PrepareBinaryFromBase64Payload = {
  base64: string;
  algorithm?: "SHA-256";
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

export type WorkerTaskPayloadMap = {
  PREPARE_SYNC_BATCHES: PrepareSyncBatchesPayload;
  PREPARE_BINARY_FROM_BASE64: PrepareBinaryFromBase64Payload;
  PLAN_HOT_UPDATE_FILES: PlanHotUpdatePayload;
  PREPARE_GROWTHBOOK_ATTRIBUTES: GrowthBookAttributesPayload;
  PREPARE_BULK_UPLOAD_PAYLOAD: PrepareBulkUploadPayloadPayload;
  PARSE_XLSX_SHEETS: ParseXlsxSheetsPayload;
  BUILD_XLSX_FILE: BuildXlsxFilePayload;
};

export type WorkerTaskResultMap = {
  PREPARE_SYNC_BATCHES: PrepareSyncBatchesResult;
  PREPARE_BINARY_FROM_BASE64: PrepareBinaryFromBase64Result;
  PLAN_HOT_UPDATE_FILES: PlanHotUpdateResult;
  PREPARE_GROWTHBOOK_ATTRIBUTES: GrowthBookAttributesResult;
  PREPARE_BULK_UPLOAD_PAYLOAD: PrepareBulkUploadPayloadResult;
  PARSE_XLSX_SHEETS: ParseXlsxSheetsResult;
  BUILD_XLSX_FILE: BuildXlsxFileResult;
};

export type BackgroundWorkerTask = keyof WorkerTaskPayloadMap;

export type WorkerRequest<T extends BackgroundWorkerTask = BackgroundWorkerTask> = {
  id: string;
  type: T;
  payload: WorkerTaskPayloadMap[T];
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
