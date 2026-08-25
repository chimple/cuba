import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { SchoolVisitType, TableTypes } from '../../common/constants';

export type QueueStatus = 'pending' | 'failed';

export type QueueRow = {
  id: string;
  kind: string;
  status: QueueStatus;
  attempts: number;
  occurred_at: string;
  user_id: string;
  school_id: string;
  visit_id: string | null;
  phase: string | null;
  payload_json: string;
  last_error: string | null;
};

export type OpenVisitCacheRow = {
  user_id: string;
  school_id: string;
  visit_id: string;
  visit_type: SchoolVisitType | null;
  distance_from_school: string | null;
  number_of_parents: number | null;
  check_in_at: string;
  check_in_lat: number;
  check_in_lng: number;
  updated_at: string;
};

const QUEUE_TABLE = 'fc_touch_point_offline_queue';
const OPEN_VISIT_TABLE = 'fc_touch_point_open_visit_cache';

let queueInitPromise: Promise<void> | null = null;
let openVisitInitPromise: Promise<void> | null = null;

export const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
};

const getValuesFromResult = (result: DBSQLiteValues | undefined): unknown[] => {
  const values = result?.values;
  return Array.isArray(values) ? values : [];
};

const getSqliteApi = async () => {
  const { SqliteApi } = await import('../api/SqliteApi');
  return SqliteApi.getInstance();
};

const sqliteQuery = async (statement: string, values: unknown[] = []) => {
  const sqlite = await getSqliteApi();
  return sqlite.executeQuery(statement, values);
};

const ensureQueueTable = async () => {
  if (!queueInitPromise) {
    queueInitPromise = (async () => {
      await sqliteQuery(
        `CREATE TABLE IF NOT EXISTS ${QUEUE_TABLE} (
          id TEXT NOT NULL PRIMARY KEY,
          kind TEXT NOT NULL,
          status TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          occurred_at TEXT NOT NULL,
          user_id TEXT NOT NULL,
          school_id TEXT NOT NULL,
          visit_id TEXT NULL,
          phase TEXT NULL,
          payload_json TEXT NOT NULL,
          last_error TEXT NULL
        )`,
      );
      await sqliteQuery(
        `CREATE INDEX IF NOT EXISTS idx_${QUEUE_TABLE}_status_occurred
         ON ${QUEUE_TABLE}(status, occurred_at)`,
      );
    })();
  }

  await queueInitPromise;
};

const ensureOpenVisitTable = async () => {
  if (!openVisitInitPromise) {
    openVisitInitPromise = (async () => {
      await sqliteQuery(
        `CREATE TABLE IF NOT EXISTS ${OPEN_VISIT_TABLE} (
          user_id TEXT NOT NULL,
          school_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          visit_type TEXT NULL,
          distance_from_school TEXT NULL,
          number_of_parents INTEGER NULL,
          check_in_at TEXT NOT NULL,
          check_in_lat REAL NOT NULL,
          check_in_lng REAL NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, school_id)
        )`,
      );
    })();
  }

  await openVisitInitPromise;
};

const openVisitRowToSnapshot = (
  row: OpenVisitCacheRow,
): TableTypes<'fc_school_visit'> => ({
  id: row.visit_id,
  school_id: row.school_id,
  user_id: row.user_id,
  check_in_at: row.check_in_at,
  check_in_lat: row.check_in_lat,
  check_in_lng: row.check_in_lng,
  check_out_at: null,
  check_out_lat: null,
  check_out_lng: null,
  created_at: row.check_in_at,
  updated_at: row.updated_at,
  distance_check_out: null,
  distance_from_school: row.distance_from_school,
  notes: null,
  number_of_parents: row.number_of_parents,
  is_deleted: false,
  type: row.visit_type,
});

export const readQueueRows = async (): Promise<QueueRow[]> => {
  await ensureQueueTable();
  const result = await sqliteQuery(
    `SELECT id, kind, status, attempts, occurred_at, user_id, school_id, visit_id, phase, payload_json, last_error
     FROM ${QUEUE_TABLE}
     ORDER BY occurred_at ASC, id ASC`,
  );
  return getValuesFromResult(result as DBSQLiteValues).filter(
    (row): row is QueueRow => Boolean(row),
  );
};

export const readQueueRowById = async (
  id: string,
): Promise<QueueRow | null> => {
  await ensureQueueTable();
  const result = await sqliteQuery(
    `SELECT id, kind, status, attempts, occurred_at, user_id, school_id, visit_id, phase, payload_json, last_error
     FROM ${QUEUE_TABLE}
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  const row = getValuesFromResult(result as DBSQLiteValues)[0] as
    | QueueRow
    | undefined;
  return row ?? null;
};

export const writeQueueRow = async (row: {
  id: string;
  kind: string;
  status: QueueStatus;
  attempts: number;
  occurredAt: string;
  userId: string;
  schoolId: string;
  visitId: string | null;
  phase: string | null;
  payload: unknown;
  lastError?: string | null;
}) => {
  await ensureQueueTable();
  await sqliteQuery(
    `INSERT OR REPLACE INTO ${QUEUE_TABLE}
      (id, kind, status, attempts, occurred_at, user_id, school_id, visit_id, phase, payload_json, last_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.kind,
      row.status,
      row.attempts,
      row.occurredAt,
      row.userId,
      row.schoolId,
      row.visitId,
      row.phase,
      JSON.stringify(row.payload),
      row.lastError ?? null,
    ],
  );
};

export const deleteQueueRow = async (id: string) => {
  await ensureQueueTable();
  await sqliteQuery(`DELETE FROM ${QUEUE_TABLE} WHERE id = ?`, [id]);
};

export const updateQueueRow = async (
  id: string,
  updater: (row: QueueRow) => QueueRow | null,
) => {
  const current = await readQueueRowById(id);
  if (!current) return;
  const next = updater(current);
  if (!next) {
    await deleteQueueRow(id);
    return;
  }

  await writeQueueRow({
    id: next.id,
    kind: next.kind,
    status: next.status,
    attempts: next.attempts,
    occurredAt: next.occurred_at,
    userId: next.user_id,
    schoolId: next.school_id,
    visitId: next.visit_id,
    phase: next.phase,
    payload: JSON.parse(next.payload_json),
    lastError: next.last_error ?? null,
  });
};

export const saveCurrentOpenVisitSnapshot = async (params: {
  userId: string;
  schoolId: string;
  visitId: string;
  visitType?: SchoolVisitType | null;
  distanceFromSchool?: number | string | null;
  numberOfParents?: number | null;
  checkInAt: string;
  checkInLat: number;
  checkInLng: number;
}) => {
  await ensureOpenVisitTable();
  await sqliteQuery(
    `INSERT OR REPLACE INTO ${OPEN_VISIT_TABLE}
      (user_id, school_id, visit_id, visit_type, distance_from_school, number_of_parents, check_in_at, check_in_lat, check_in_lng, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId,
      params.schoolId,
      params.visitId,
      params.visitType ?? null,
      params.distanceFromSchool == null
        ? null
        : String(params.distanceFromSchool),
      params.numberOfParents ?? null,
      params.checkInAt,
      params.checkInLat,
      params.checkInLng,
      new Date().toISOString(),
    ],
  );
};

export const getSavedOpenVisitSnapshot = async (
  userId: string,
  schoolId: string,
): Promise<TableTypes<'fc_school_visit'> | null> => {
  await ensureOpenVisitTable();
  const result = await sqliteQuery(
    `SELECT user_id, school_id, visit_id, visit_type, distance_from_school, number_of_parents, check_in_at, check_in_lat, check_in_lng, updated_at
     FROM ${OPEN_VISIT_TABLE}
     WHERE user_id = ? AND school_id = ?
     LIMIT 1`,
    [userId, schoolId],
  );
  const row = getValuesFromResult(result as DBSQLiteValues)[0] as
    | OpenVisitCacheRow
    | undefined;
  return row ? openVisitRowToSnapshot(row) : null;
};

export const clearSavedOpenVisitSnapshot = async (
  userId: string,
  schoolId: string,
) => {
  await ensureOpenVisitTable();
  await sqliteQuery(
    `DELETE FROM ${OPEN_VISIT_TABLE} WHERE user_id = ? AND school_id = ?`,
    [userId, schoolId],
  );
};
