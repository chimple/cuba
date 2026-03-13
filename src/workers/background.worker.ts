import {
  WorkerAckMessage,
  BackgroundWorkerTask,
  BuildXlsxFilePayload,
  ChecksumFile,
  GrowthBookAttributesPayload,
  ParseXlsxSheetsPayload,
  PlanHotUpdatePayload,
  PrepareBinaryFromBase64Payload,
  PrepareSyncBatchesPayload,
  StreamSyncBatchesPayload,
  SqlStatement,
  WorkerBatchReadyMessage,
  WorkerDoneMessage,
  WorkerRequest,
  WorkerResponse,
  WorkerStreamErrorMessage,
  WorkerStreamRequest,
} from "./background.worker.types";

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope;
let xlsxModulePromise: Promise<typeof import("xlsx-js-style")> | null = null;
const getXlsx = async (): Promise<typeof import("xlsx-js-style")> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import("xlsx-js-style");
  }
  return xlsxModulePromise;
};
const pendingAckResolvers = new Map<string, () => void>();
const safeTableName = (tableName: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name received in worker: ${tableName}`);
  }
  return tableName;
};
const buildStatementsForRows = (
  tableName: string,
  rows: Record<string, unknown>[],
  existingColumns: string[],
): SqlStatement[] => {
  const resolvedTableName = safeTableName(tableName);
  const statementsForTable: SqlStatement[] = [];
  for (const row of rows) {
    const fieldNames = Object.keys(row).filter((key) =>
      existingColumns.includes(key),
    );
    if (!fieldNames.length) {
      continue;
    }
    const placeholders = fieldNames.map(() => "?").join(", ");
    const values = fieldNames.map((name) => row[name]);
    const updateColumns = fieldNames.filter((name) => name !== "id");
    const updateSetClause = updateColumns
      .map((name) => `${name} = excluded.${name}`)
      .join(", ");

    const onConflictClause = updateSetClause
      ? `ON CONFLICT(id) DO UPDATE SET ${updateSetClause} WHERE excluded.updated_at > ${resolvedTableName}.updated_at`
      : "ON CONFLICT(id) DO NOTHING";

    statementsForTable.push({
      statement: `
          INSERT INTO ${resolvedTableName} (${fieldNames.join(", ")})
          VALUES (${placeholders})
          ${onConflictClause};
        `,
      values,
    });
  }
  return statementsForTable;
};

const buildSyncBatches = (
  payload: PrepareSyncBatchesPayload,
): {
  tableBatches: Record<string, SqlStatement[][]>;
  rowCountByTable: Record<string, number>;
  payloadSizeBytes: number;
} => {
  const { tables, tableColumns, defaultBatchSize, userTableBatchSize, userTableName } =
    payload;
  const tableBatches: Record<string, SqlStatement[][]> = {};
  const rowCountByTable: Record<string, number> = {};

  for (const [tableName, rows] of Object.entries(tables)) {
    const resolvedTableName = safeTableName(tableName);
    const existingColumns = tableColumns[resolvedTableName] ?? [];
    if (!rows?.length || !existingColumns.length) {
      continue;
    }

    const statementsForTable = buildStatementsForRows(
      resolvedTableName,
      rows,
      existingColumns,
    );
    if (!statementsForTable.length) {
      continue;
    }

    const batchSize =
      resolvedTableName === userTableName
        ? Math.max(userTableBatchSize, 1)
        : Math.max(defaultBatchSize, 1);
    const chunked: SqlStatement[][] = [];
    for (let i = 0; i < statementsForTable.length; i += batchSize) {
      chunked.push(statementsForTable.slice(i, i + batchSize));
    }

    tableBatches[resolvedTableName] = chunked;
    rowCountByTable[resolvedTableName] = statementsForTable.length;
  }

  const payloadSizeBytes = payload.includePayloadSizeBytes
    ? new TextEncoder().encode(JSON.stringify(tables)).length
    : 0;

  return {
    tableBatches,
    rowCountByTable,
    payloadSizeBytes,
  };
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const prepareBinaryFromBase64 = async (
  payload: PrepareBinaryFromBase64Payload,
): Promise<{
  byteLength: number;
  sha256Hex: string;
  arrayBuffer: ArrayBuffer;
}> => {
  const binary = atob(payload.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const algorithm = payload.algorithm ?? "SHA-256";
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
  return {
    byteLength: bytes.byteLength,
    sha256Hex: toHex(hashBuffer),
    arrayBuffer: bytes.buffer,
  };
};

const fileKey = (file: ChecksumFile): string => `${file.path}@@${file.hash}`;

const planHotUpdateFiles = (payload: PlanHotUpdatePayload) => {
  const activeSet = new Set(payload.activeFiles.map(fileKey));
  const copyFromPreviousPaths: string[] = [];
  const downloadFromServerPaths: string[] = [];

  for (const serverFile of payload.serverFiles) {
    if (activeSet.has(fileKey(serverFile))) {
      copyFromPreviousPaths.push(serverFile.path);
    } else {
      downloadFromServerPaths.push(serverFile.path);
    }
  }

  return { copyFromPreviousPaths, downloadFromServerPaths };
};

const buildGrowthBookAttributes = (payload: GrowthBookAttributesPayload) => {
  const attributes = payload.attributes ?? {};
  const {
    studentDetails,
    schools,
    school_name,
    classes,
    liveQuizCount = 0,
    assignmentCount = 0,
    last_assignment_played_at,
    total_assignments_played = 0,
    leaderboard_position_weekly = 0,
    leaderboard_position_monthly = 0,
    leaderboard_position_all = 0,
    count_of_assignment_played = 0,
    count_of_lessons_played = 0,
    pending_course_counts = {},
    pending_subject_counts = {},
    learning_path_completed = {},
    total_learning_path_completed = 0,
    manufacturer,
    model,
    operating_system,
    os_version,
    platform,
    device_language,
    count_of_children = 0,
    teacher_class_id,
    teacher_school_state,
    teacher_school_district,
    teacher_school_block,
    teacher_school_id,
    teacher_school_list,
    teacher_class_ids,
    roleMap = {},
    courseCounts = {},
  } = attributes;

  const totalAssignments = count_of_assignment_played + assignmentCount;
  const percentageOfAssignmentPlayed =
    totalAssignments > 0
      ? (count_of_assignment_played / totalAssignments) * 100
      : 0;

  return {
    id: studentDetails?.id,
    age: studentDetails?.age,
    curriculum_id: studentDetails?.curriculum_id,
    grade_id: studentDetails?.grade_id,
    gender: studentDetails?.gender,
    parent_id: studentDetails?.parent_id,
    student_id: studentDetails?.id,
    subject_id: studentDetails?.subject_id,
    stars: studentDetails?.stars || 0,
    last_login_at: studentDetails?.last_sign_in_at,
    login_method: studentDetails?.login_method,
    school_ids: schools,
    school_name,
    class_ids: classes,
    language: payload.language || "en",
    pending_live_quiz: liveQuizCount,
    pending_assignments: assignmentCount,
    last_assignment_played_at,
    total_assignments_played,
    leaderboard_position_weekly,
    leaderboard_position_monthly,
    leaderboard_position_all,
    count_of_assignment_played,
    count_of_lessons_played,
    percentage_of_assignment_played: percentageOfAssignmentPlayed,
    ...pending_course_counts,
    ...pending_subject_counts,
    ...learning_path_completed,
    total_learning_path_completed,
    manufacturer,
    model,
    operating_system,
    os_version,
    platform,
    device_language,
    count_of_children,
    teacher_class_id,
    teacher_school_id,
    teacher_school_state,
    teacher_school_district,
    teacher_school_block,
    teacher_school_list,
    teacher_class_ids,
    ...roleMap,
    ...courseCounts,
  };
};

const getSchoolKey = (row: any): string =>
  row["SCHOOL ID"]?.toString().trim() || row["SCHOOL NAME"]?.toString().trim();

const buildBulkUploadPayload = (payload: {
  schoolData: any[];
  classData: any[];
  teacherData: any[];
  studentData: any[];
}) => {
  const { schoolData = [], classData = [], teacherData = [], studentData = [] } =
    payload;
  const map = new Map<string, any>();

  const ensureSchoolEntry = (row: any) => {
    const key = getSchoolKey(row);
    if (!map.has(key)) {
      map.set(key, {
        school: {
          id: row["SCHOOL ID"]?.toString().trim(),
          name: row["SCHOOL NAME"]?.toString().trim(),
          state: row["STATE"]?.toString().trim() || "",
          district: row["DISTRICT"]?.toString().trim() || "",
          block: row["BLOCK"]?.toString().trim() || "",
          cluster: row["CLUSTER"]?.toString().trim() || "",
          instruction_language:
            row["SCHOOL INSTRUCTION LANGUAGE"]?.toString().trim() || "",
          student_login_type: row["STUDENT LOGIN TYPE"]?.toString().trim() || "",
          academic_years: row["SCHOOL ACADEMIC YEAR"]
            ? [row["SCHOOL ACADEMIC YEAR"]?.toString().trim()]
            : [],
        },
        principal:
          row["PRINCIPAL NAME"] || row["PRINCIPAL PHONE NUMBER OR EMAIL ID"]
            ? {
                name: row["PRINCIPAL NAME"]?.toString().trim() || "",
                contact:
                  row["PRINCIPAL PHONE NUMBER OR EMAIL ID"]?.toString().trim() ||
                  "",
                role: "principal",
              }
            : null,
        school_coordinator:
          row["SCHOOL COORDINATOR NAME"] ||
          row["SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"]
            ? {
                name: row["SCHOOL COORDINATOR NAME"]?.toString().trim() || "",
                contact:
                  row["SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"]
                    ?.toString()
                    .trim() || "",
                role: "coordinator",
              }
            : null,
        programs: [],
        program_users: [],
        classes: [],
      });
    }
    return key;
  };

  for (const row of schoolData) {
    const key = ensureSchoolEntry(row);
    if (row["PROGRAM NAME"]) {
      map.get(key).programs.push({
        name: row["PROGRAM NAME"].toString().trim(),
        model: row["PROGRAM MODEL"]?.toString().trim() || "",
      });
      map.get(key).program_users.push(
        {
          contact:
            row["PROGRAM MANAGER EMAIL OR PHONE NUMBER"]?.toString().trim() || "",
          role: "program_manager",
        },
        {
          contact:
            row["FIELD COORDINATOR EMAIL OR PHONE NUMBER"]?.toString().trim() ||
            "",
          role: "field_coordinator",
        },
      );
    }
  }

  for (const row of classData) {
    const key = ensureSchoolEntry(row);
    map.get(key).classes.push({
      grade: row["GRADE"]?.toString().trim() || "",
      section: row["CLASS SECTION"]?.toString().trim() || "",
      student_count: row["STUDENTS COUNT IN CLASS"]?.toString().trim() || "",
      subjects: [
        {
          grade_level: row["SUBJECT GRADE"]?.toString().trim() || "",
          curricul: row["CURRICULUM"]?.toString().trim() || "",
          sub: row["SUBJECT"]?.toString().trim() || "",
        },
      ],
      teachers: [],
      students: [],
    });
  }

  for (const row of teacherData) {
    const key = ensureSchoolEntry(row);
    const grade = row["GRADE"]?.toString().trim();
    const section = row["CLASS SECTION"]?.toString().trim() || "";
    const teacher = {
      name: row["TEACHER NAME"]?.toString().trim() || "",
      contact: row["TEACHER PHONE NUMBER OR EMAIL"]?.toString().trim() || "",
    };
    const school = map.get(key);
    let cls = school.classes.find(
      (c: any) => c.grade === grade && c.section === section,
    );
    if (!cls) {
      cls = {
        grade,
        section,
        student_count: "",
        subjects: [],
        teachers: [],
        students: [],
      };
      school.classes.push(cls);
    }
    cls.teachers.push(teacher);
  }

  for (const row of studentData) {
    const key = ensureSchoolEntry(row);
    const grade = row["GRADE"]?.toString().trim();
    const section = row["CLASS SECTION"]?.toString().trim() || "";
    const student = {
      id: row["STUDENT ID"]?.toString().trim() || "",
      name: row["STUDENT NAME"]?.toString().trim() || "",
      gender: row["GENDER"]?.toString().trim() || "",
      age: row["AGE"]?.toString().trim() || "",
      grade: grade || "",
      parent_contact:
        row["PARENT PHONE NUMBER OR LOGIN ID"]?.toString().trim() || "",
    };
    const school = map.get(key);
    let cls = school.classes.find(
      (c: any) => c.grade === grade && c.section === section,
    );
    if (!cls) {
      cls = {
        grade,
        section,
        student_count: "",
        subjects: [],
        teachers: [],
        students: [],
      };
      school.classes.push(cls);
    }
    cls.students.push(student);
  }

  return Array.from(map.values());
};

const parseXlsxSheets = async (
  payload: ParseXlsxSheetsPayload,
): Promise<{
  sheetNames: string[];
  sheets: Record<string, Record<string, any>[]>;
}> => {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(payload.fileBuffer, { type: "array" });
  const sheets: Record<string, Record<string, any>[]> = {};
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    }) as Record<string, any>[];
  }
  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
};

const toArrayBuffer = (value: unknown): ArrayBuffer => {
  if (value instanceof ArrayBuffer) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  }
  if (typeof value === "string") {
    const encoded = new TextEncoder().encode(value);
    const copy = new Uint8Array(encoded.byteLength);
    copy.set(encoded);
    return copy.buffer;
  }
  throw new Error("Unsupported XLSX write output type");
};

const buildXlsxFile = async (
  payload: BuildXlsxFilePayload,
): Promise<{
  fileBuffer: ArrayBuffer;
}> => {
  const XLSX = await getXlsx();
  const workbook = XLSX.utils.book_new();
  for (const sheetName of payload.sheetNames) {
    const rows = payload.sheets[sheetName] ?? [];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }
  const output = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  return {
    fileBuffer: toArrayBuffer(output),
  };
};

const handlers: {
  [K in BackgroundWorkerTask]: (
    payload: WorkerRequest<K>["payload"],
  ) => Promise<unknown> | unknown;
} = {
  PREPARE_SYNC_BATCHES: (payload) => buildSyncBatches(payload),
  PREPARE_BINARY_FROM_BASE64: (payload) => prepareBinaryFromBase64(payload),
  PLAN_HOT_UPDATE_FILES: (payload) => planHotUpdateFiles(payload),
  PREPARE_GROWTHBOOK_ATTRIBUTES: (payload) => buildGrowthBookAttributes(payload),
  PREPARE_BULK_UPLOAD_PAYLOAD: (payload) => buildBulkUploadPayload(payload),
  PARSE_XLSX_SHEETS: (payload) => parseXlsxSheets(payload),
  BUILD_XLSX_FILE: (payload) => buildXlsxFile(payload),
};

const waitForAck = (id: string): Promise<void> =>
  new Promise((resolve) => {
    pendingAckResolvers.set(id, resolve);
  });

const emitBatchReady = (id: string, batch: SqlStatement[]) => {
  const message: WorkerBatchReadyMessage = {
    id,
    type: "BATCH_READY",
    batch,
  };
  workerScope.postMessage(message);
};

const streamSyncBatches = async (request: WorkerStreamRequest) => {
  const payload: StreamSyncBatchesPayload = request.payload;
  const rowsPerChunk = Math.max(payload.rowsPerChunk ?? 200, 1);
  const { tables, tableColumns, defaultBatchSize, userTableBatchSize, userTableName } =
    payload;

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
      const statements = buildStatementsForRows(
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
  if (request.type === "ACK") {
    const resolver = pendingAckResolvers.get(request.id);
    if (resolver) {
      pendingAckResolvers.delete(request.id);
      resolver();
    }
    return;
  }
  try {
    if (request.type === "STREAM_SYNC_BATCHES") {
      await streamSyncBatches(request);
      const doneMessage: WorkerDoneMessage = {
        id: request.id,
        type: "DONE",
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
      request.type === "PREPARE_BINARY_FROM_BASE64" &&
      result &&
      typeof result === "object" &&
      "arrayBuffer" in result
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
      request.type === "BUILD_XLSX_FILE" &&
      result &&
      typeof result === "object" &&
      "fileBuffer" in result
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
    if (request.type === "STREAM_SYNC_BATCHES") {
      const response: WorkerStreamErrorMessage = {
        id: request.id,
        type: "ERROR",
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
    console.error(`[BG-WORKER] failed`, {
      id: request.id,
      type: request.type,
      error: response.error,
      ts: Date.now(),
    });
  }
};
