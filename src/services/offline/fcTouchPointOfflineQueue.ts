import { v4 as uuidv4 } from 'uuid';
import {
  EnumType,
  SchoolVisitAction,
  SchoolVisitType,
  TableTypes,
} from '../../common/constants';
import {
  deleteQueueRow,
  getSavedOpenVisitSnapshot,
  normalizeErrorMessage,
  QueueStatus,
  type QueueRow,
  readQueueRows,
  saveCurrentOpenVisitSnapshot,
  updateQueueRow,
  writeQueueRow,
} from './fcTouchPointOfflineQueue.storage';
import type { OfflineMediaFileRef } from './fctouchpoints/fcTouchPointOfflineMedia';

type SyncRunner = () => Promise<void>;

type FcUserFormQueuePayload = {
  visitId?: string | null;
  userId: string;
  schoolId: string;
  classId?: string | null;
  contactUserId?: string | null;
  contactTarget: EnumType<'fc_engagement_target'>;
  contactMethod: EnumType<'fc_contact_method'>;
  callStatus?: EnumType<'fc_call_result'> | null;
  supportLevel?: EnumType<'fc_support_level'> | null;
  questionResponse: Record<string, string>;
  techIssuesReported: boolean;
  comment?: string | null;
  techIssueComment?: string | null;
  mediaLinks?: string[] | null;
  offlineMediaFiles?: OfflineMediaFileRef[] | null;
};

type SchoolVisitQueuePayload = {
  schoolId: string;
  userId: string;
  action: SchoolVisitAction;
  lat: number;
  lng: number;
  visitType?: SchoolVisitType;
  distanceFromSchool?: number;
  numberOfParents?: number;
};

type SchoolVisitQueueEntry = {
  id: string;
  kind: 'school_visit';
  status: QueueStatus;
  attempts: number;
  occurredAt: string;
  userId: string;
  schoolId: string;
  visitId: string | null;
  phase: 'check_in' | 'check_out';
  payload: SchoolVisitQueuePayload;
  lastError?: string | null;
};

type FcUserFormQueueEntry = {
  id: string;
  kind: 'fc_user_form';
  status: QueueStatus;
  attempts: number;
  occurredAt: string;
  userId: string;
  schoolId: string;
  payload: FcUserFormQueuePayload;
  lastError?: string | null;
};

type QueueEntry = SchoolVisitQueueEntry | FcUserFormQueueEntry;

let syncRunner: SyncRunner | null = null;
let syncScheduled = false;
let syncRunning = false;
let listenersRegistered = false;

const hasWindow = (): boolean => typeof window !== 'undefined';

const parseQueueEntry = (row: QueueRow): QueueEntry | null => {
  try {
    const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    if (row.kind === 'school_visit') {
      return {
        id: row.id,
        kind: 'school_visit',
        status: row.status,
        attempts: Number(row.attempts) || 0,
        occurredAt: row.occurred_at,
        userId: row.user_id,
        schoolId: row.school_id,
        visitId: row.visit_id,
        phase: row.phase === 'check_out' ? 'check_out' : 'check_in',
        payload: payload as SchoolVisitQueuePayload,
        lastError: row.last_error ?? null,
      };
    }

    return {
      id: row.id,
      kind: 'fc_user_form',
      status: row.status,
      attempts: Number(row.attempts) || 0,
      occurredAt: row.occurred_at,
      userId: row.user_id,
      schoolId: row.school_id,
      payload: payload as FcUserFormQueuePayload,
      lastError: row.last_error ?? null,
    };
  } catch {
    return null;
  }
};

const replayVisitSnapshot = (
  entries: QueueEntry[],
  userId: string,
  schoolId: string,
): TableTypes<'fc_school_visit'> | null => {
  const visitEntries = entries
    .filter(
      (entry): entry is SchoolVisitQueueEntry =>
        entry.kind === 'school_visit' &&
        entry.userId === userId &&
        entry.schoolId === schoolId,
    )
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  let snapshot: TableTypes<'fc_school_visit'> | null = null;

  for (const entry of visitEntries) {
    if (entry.phase === 'check_in') {
      snapshot = {
        id: entry.visitId ?? entry.id,
        school_id: entry.schoolId,
        user_id: entry.userId,
        check_in_at: entry.occurredAt,
        check_in_lat: entry.payload.lat,
        check_in_lng: entry.payload.lng,
        check_out_at: null,
        check_out_lat: null,
        check_out_lng: null,
        created_at: entry.occurredAt,
        updated_at: entry.occurredAt,
        distance_check_out: null,
        distance_from_school:
          entry.payload.distanceFromSchool == null
            ? null
            : String(entry.payload.distanceFromSchool),
        notes: null,
        number_of_parents: null,
        is_deleted: false,
        type: entry.payload.visitType ?? null,
      };
      continue;
    }

    if (snapshot) {
      snapshot = {
        ...snapshot,
        check_out_at: entry.occurredAt,
        check_out_lat: entry.payload.lat,
        check_out_lng: entry.payload.lng,
        number_of_parents:
          snapshot.type === SchoolVisitType.Community
            ? entry.payload.numberOfParents == null
              ? snapshot.number_of_parents
              : entry.payload.numberOfParents
            : null,
        distance_from_school:
          entry.payload.distanceFromSchool == null
            ? snapshot.distance_from_school
            : String(entry.payload.distanceFromSchool),
        updated_at: entry.occurredAt,
      };
    }
  }

  return snapshot;
};

export const isLikelyOfflineError = (error: unknown): boolean => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  const rawMessage = normalizeErrorMessage(error).toLowerCase();
  return (
    rawMessage.includes('fetch') ||
    rawMessage.includes('network') ||
    rawMessage.includes('offline') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('load failed')
  );
};

export const queueFcSchoolVisit = async (params: {
  schoolId: string;
  userId: string;
  action: SchoolVisitAction;
  lat: number;
  lng: number;
  visitType?: SchoolVisitType;
  distanceFromSchool?: number;
  numberOfParents?: number;
  clientActionId?: string;
  occurredAt?: string;
}): Promise<SchoolVisitQueueEntry> => {
  const occurredAt = params.occurredAt ?? new Date().toISOString();
  const id = params.clientActionId ?? uuidv4();
  const entries = await getPendingFcTouchPointQueue();
  const snapshot = replayVisitSnapshot(entries, params.userId, params.schoolId);
  const phase =
    params.action === SchoolVisitAction.CheckIn ? 'check_in' : 'check_out';
  const visitId =
    phase === 'check_in' ? id : (snapshot?.id ?? params.clientActionId ?? null);

  const entry: SchoolVisitQueueEntry = {
    id,
    kind: 'school_visit',
    status: 'pending',
    attempts: 0,
    occurredAt,
    userId: params.userId,
    schoolId: params.schoolId,
    visitId,
    phase,
    payload: {
      schoolId: params.schoolId,
      userId: params.userId,
      action: params.action,
      lat: params.lat,
      lng: params.lng,
      visitType: params.visitType,
      distanceFromSchool: params.distanceFromSchool,
      numberOfParents: params.numberOfParents,
    },
  };

  await writeQueueRow({
    id: entry.id,
    kind: entry.kind,
    status: entry.status,
    attempts: entry.attempts,
    occurredAt: entry.occurredAt,
    userId: entry.userId,
    schoolId: entry.schoolId,
    visitId: entry.visitId,
    phase: entry.phase,
    payload: entry.payload,
    lastError: null,
  });

  if (phase === 'check_in') {
    await saveCurrentOpenVisitSnapshot({
      userId: entry.userId,
      schoolId: entry.schoolId,
      visitId: entry.visitId ?? entry.id,
      visitType: params.visitType ?? null,
      distanceFromSchool: params.distanceFromSchool ?? null,
      numberOfParents: params.numberOfParents ?? null,
      checkInAt: occurredAt,
      checkInLat: params.lat,
      checkInLng: params.lng,
    });
  }

  return entry;
};

export const queueFcUserForm = async (params: {
  visitId?: string | null;
  userId: string;
  schoolId: string;
  classId?: string | null;
  contactUserId?: string | null;
  contactTarget: EnumType<'fc_engagement_target'>;
  contactMethod: EnumType<'fc_contact_method'>;
  callStatus?: EnumType<'fc_call_result'> | null;
  supportLevel?: EnumType<'fc_support_level'> | null;
  questionResponse: Record<string, string>;
  techIssuesReported: boolean;
  comment?: string | null;
  techIssueComment?: string | null;
  mediaLinks?: string[] | null;
  offlineMediaFiles?: OfflineMediaFileRef[] | null;
  clientActionId?: string;
  occurredAt?: string;
}): Promise<FcUserFormQueueEntry> => {
  const occurredAt = params.occurredAt ?? new Date().toISOString();
  const id = params.clientActionId ?? uuidv4();
  const entry: FcUserFormQueueEntry = {
    id,
    kind: 'fc_user_form',
    status: 'pending',
    attempts: 0,
    occurredAt,
    userId: params.userId,
    schoolId: params.schoolId,
    payload: {
      visitId: params.visitId ?? null,
      userId: params.userId,
      schoolId: params.schoolId,
      classId: params.classId ?? null,
      contactUserId: params.contactUserId ?? null,
      contactTarget: params.contactTarget,
      contactMethod: params.contactMethod,
      callStatus: params.callStatus ?? null,
      supportLevel: params.supportLevel ?? null,
      questionResponse: params.questionResponse,
      techIssuesReported: params.techIssuesReported,
      comment: params.comment ?? null,
      techIssueComment: params.techIssueComment ?? null,
      mediaLinks: params.mediaLinks ?? null,
      offlineMediaFiles: params.offlineMediaFiles ?? null,
    },
  };

  await writeQueueRow({
    id: entry.id,
    kind: entry.kind,
    status: entry.status,
    attempts: entry.attempts,
    occurredAt: entry.occurredAt,
    userId: entry.userId,
    schoolId: entry.schoolId,
    visitId: null,
    phase: null,
    payload: entry.payload,
    lastError: null,
  });

  return entry;
};

export const getPendingFcTouchPointQueue = async (): Promise<QueueEntry[]> => {
  const rows = await readQueueRows();
  return rows
    .map(parseQueueEntry)
    .filter((entry): entry is QueueEntry => Boolean(entry))
    .filter((entry) => entry.status === 'pending' || entry.status === 'failed');
};

export const markFcTouchPointSynced = async (id: string) => {
  await deleteQueueRow(id);
};

export const markFcTouchPointPending = async (id: string) => {
  await updateQueueRow(id, (row) => {
    return {
      ...row,
      status: 'pending',
      attempts: Number(row.attempts) + 1,
      last_error: null,
    };
  });
};

export const markFcTouchPointFailed = async (id: string, error: unknown) => {
  const message = normalizeErrorMessage(error);
  await updateQueueRow(id, (row) => {
    return {
      ...row,
      status: 'failed',
      attempts: Number(row.attempts) + 1,
      last_error: message,
    };
  });
};

export const getQueuedVisitSnapshot = async (
  userId: string,
  schoolId: string,
): Promise<TableTypes<'fc_school_visit'> | null> => {
  const entries = await getPendingFcTouchPointQueue();
  const pendingSnapshot = replayVisitSnapshot(entries, userId, schoolId);
  if (pendingSnapshot) return pendingSnapshot;
  return getSavedOpenVisitSnapshot(userId, schoolId);
};

export const getQueuedOpenVisitId = async (
  userId: string,
  schoolId: string,
): Promise<string | null> => {
  const snapshot = await getQueuedVisitSnapshot(userId, schoolId);
  if (!snapshot || snapshot.check_out_at) return null;
  return snapshot.id;
};

export const hasPendingFcTouchPointQueue = async (): Promise<boolean> => {
  const queue = await getPendingFcTouchPointQueue();
  return queue.length > 0;
};

const runScheduledSync = async () => {
  if (!syncRunner || syncRunning) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  syncRunning = true;
  try {
    await syncRunner();
  } finally {
    syncRunning = false;
    if (syncScheduled) {
      syncScheduled = false;
      void runScheduledSync();
    }
  }
};

const scheduleSync = () => {
  if (!syncRunner || !hasWindow()) return;
  syncScheduled = true;
  if (syncRunning) return;

  window.setTimeout(() => {
    void runScheduledSync();
  }, 0);
};

const registerBrowserListeners = () => {
  if (listenersRegistered || !hasWindow()) return;
  listenersRegistered = true;

  window.addEventListener('online', scheduleSync);
  window.addEventListener('focus', scheduleSync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleSync();
    }
  });
};

export const registerFcTouchPointSyncRunner = (
  runner: SyncRunner,
  options?: { scheduleImmediately?: boolean },
) => {
  syncRunner = runner;
  registerBrowserListeners();
  if (options?.scheduleImmediately) {
    scheduleSync();
  }
};

export const requestFcTouchPointSync = () => {
  registerBrowserListeners();
  scheduleSync();
};
