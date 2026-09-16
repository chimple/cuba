import { Preferences } from '@capacitor/preferences';
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

const QUEUE_KEY = 'fc_touch_point_offline_queue';
const OPEN_VISITS_KEY = 'fc_touch_point_open_visit_cache';
let storageOperation: Promise<void> = Promise.resolve();

const withStorageLock = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previous = storageOperation;
  let release!: () => void;
  storageOperation = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
};

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  const { value } = await Preferences.get({ key });
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
const writeJson = async <T>(key: string, value: T) =>
  Preferences.set({ key, value: JSON.stringify(value) });

export const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
};

const readAllQueueRows = () => readJson<QueueRow[]>(QUEUE_KEY, []);
const readAllOpenVisits = () =>
  readJson<OpenVisitCacheRow[]>(OPEN_VISITS_KEY, []);

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

export const readQueueRows = async (): Promise<QueueRow[]> =>
  readAllQueueRows();
export const readQueueRowById = async (id: string): Promise<QueueRow | null> =>
  (await readAllQueueRows()).find((row) => row.id === id) ?? null;

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
}) =>
  withStorageLock(async () => {
    const rows = await readAllQueueRows();
    const next: QueueRow = {
      id: row.id,
      kind: row.kind,
      status: row.status,
      attempts: row.attempts,
      occurred_at: row.occurredAt,
      user_id: row.userId,
      school_id: row.schoolId,
      visit_id: row.visitId,
      phase: row.phase,
      payload_json: JSON.stringify(row.payload),
      last_error: row.lastError ?? null,
    };
    const index = rows.findIndex((current) => current.id === row.id);
    if (index >= 0) rows[index] = next;
    else rows.push(next);
    await writeJson(QUEUE_KEY, rows);
  });

export const deleteQueueRow = async (id: string) =>
  withStorageLock(async () => {
    const rows = await readAllQueueRows();
    await writeJson(
      QUEUE_KEY,
      rows.filter((row) => row.id !== id),
    );
  });

export const updateQueueRow = async (
  id: string,
  updater: (row: QueueRow) => QueueRow | null,
) =>
  withStorageLock(async () => {
    const rows = await readAllQueueRows();
    const current = rows.find((row) => row.id === id);
    if (!current) return;
    const next = updater(current);
    const remaining = rows.filter((row) => row.id !== id);
    if (next) remaining.push(next);
    await writeJson(QUEUE_KEY, remaining);
  });

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
}) =>
  withStorageLock(async () => {
    const rows = await readAllOpenVisits();
    const next: OpenVisitCacheRow = {
      user_id: params.userId,
      school_id: params.schoolId,
      visit_id: params.visitId,
      visit_type: params.visitType ?? null,
      distance_from_school:
        params.distanceFromSchool == null
          ? null
          : String(params.distanceFromSchool),
      number_of_parents: params.numberOfParents ?? null,
      check_in_at: params.checkInAt,
      check_in_lat: params.checkInLat,
      check_in_lng: params.checkInLng,
      updated_at: new Date().toISOString(),
    };
    const remaining = rows.filter(
      (row) =>
        !(row.user_id === params.userId && row.school_id === params.schoolId),
    );
    remaining.push(next);
    await writeJson(OPEN_VISITS_KEY, remaining);
  });

export const getSavedOpenVisitSnapshot = async (
  userId: string,
  schoolId: string,
): Promise<TableTypes<'fc_school_visit'> | null> => {
  const row = (await readAllOpenVisits()).find(
    (current) => current.user_id === userId && current.school_id === schoolId,
  );
  return row ? openVisitRowToSnapshot(row) : null;
};

export const clearSavedOpenVisitSnapshot = async (
  userId: string,
  schoolId: string,
) =>
  withStorageLock(async () => {
    const rows = await readAllOpenVisits();
    await writeJson(
      OPEN_VISITS_KEY,
      rows.filter(
        (row) => !(row.user_id === userId && row.school_id === schoolId),
      ),
    );
  });
