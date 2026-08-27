import { TABLES } from '../../../common/constants';
import { ServiceConfig } from '../../ServiceConfig';
import {
  getPendingFcTouchPointQueue,
  getQueuedVisitSnapshot,
  markFcTouchPointFailed,
  markFcTouchPointSynced,
} from '../fcTouchPointOfflineQueue';
import { clearSavedOpenVisitSnapshot } from '../fcTouchPointOfflineQueue.storage';
import type { SupabaseApiCoreSync } from '../../api/supabase/SupabaseApi.core.sync';
import {
  deleteOfflineMediaFiles,
  uploadOfflineMediaFiles,
} from './fcTouchPointOfflineMedia';

const getPostgrestErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

export async function syncPendingFcTouchPoints(
  this: SupabaseApiCoreSync,
): Promise<void> {
  if (!this.supabase) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
  if (!currentUser) return;

  const pendingQueue = (await getPendingFcTouchPointQueue()).filter(
    (entry) => entry.userId === currentUser.id,
  );
  if (pendingQueue.length === 0) return;

  for (const entry of pendingQueue) {
    try {
      if (entry.kind === 'school_visit') {
        if (entry.phase === 'check_in') {
          const visitId = entry.visitId ?? entry.id;
          const insertPayload = {
            id: visitId,
            school_id: entry.schoolId,
            user_id: entry.userId,
            check_in_at: entry.occurredAt,
            check_in_lat: entry.payload.lat,
            check_in_lng: entry.payload.lng,
            check_out_at: null,
            check_out_lat: null,
            check_out_lng: null,
            type: entry.payload.visitType ?? null,
            is_deleted: false,
            distance_from_school:
              entry.payload.distanceFromSchool == null
                ? null
                : String(entry.payload.distanceFromSchool),
            number_of_parents: null,
          };

          const { data, error } = await this.supabase
            .from(TABLES.FcSchoolVisit)
            .insert(insertPayload)
            .select()
            .single();

          if (error) {
            const errorCode = getPostgrestErrorCode(error) ?? '';
            if (errorCode === '23505') {
              const { data: existing } = await this.supabase
                .from(TABLES.FcSchoolVisit)
                .select('*')
                .eq('id', visitId)
                .maybeSingle();
              if (existing) {
                await markFcTouchPointSynced(entry.id);
                continue;
              }
            }
            throw error;
          }

          if (data) {
            await markFcTouchPointSynced(entry.id);
          }
          continue;
        }

        const visitId =
          entry.visitId ??
          (await getQueuedVisitSnapshot(entry.userId, entry.schoolId))?.id;
        if (!visitId) {
          throw new Error('Missing visit id for queued check-out');
        }

        const snapshot =
          (await getQueuedVisitSnapshot(entry.userId, entry.schoolId)) ?? null;
        const nextNumberOfParents =
          snapshot?.type === 'community_visit'
            ? entry.payload.numberOfParents == null
              ? snapshot.number_of_parents
              : entry.payload.numberOfParents
            : null;

        const { data, error } = await this.supabase
          .from(TABLES.FcSchoolVisit)
          .update({
            check_out_at: entry.occurredAt,
            check_out_lat: entry.payload.lat,
            check_out_lng: entry.payload.lng,
            number_of_parents: nextNumberOfParents,
            updated_at: entry.occurredAt,
            distance_from_school:
              entry.payload.distanceFromSchool == null
                ? (snapshot?.distance_from_school ?? null)
                : String(entry.payload.distanceFromSchool),
          })
          .eq('id', visitId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          await markFcTouchPointSynced(entry.id);
          await clearSavedOpenVisitSnapshot(entry.userId, entry.schoolId);
        }
        continue;
      }

      const resolvedMediaLinks =
        entry.payload.offlineMediaFiles &&
        entry.payload.offlineMediaFiles.length > 0
          ? await uploadOfflineMediaFiles({
              schoolId: entry.schoolId,
              refs: entry.payload.offlineMediaFiles,
              uploadFn: (file) =>
                this.uploadSchoolVisitMediaFile({
                  schoolId: entry.schoolId,
                  file,
                }),
            })
          : (entry.payload.mediaLinks ?? null);

      const { data, error } = await this.supabase
        .from(TABLES.FcUserForms)
        .insert({
          id: entry.id,
          visit_id: entry.payload.visitId ?? null,
          user_id: entry.userId,
          school_id: entry.schoolId,
          class_id: entry.payload.classId ?? null,
          contact_user_id: entry.payload.contactUserId ?? null,
          contact_target: entry.payload.contactTarget,
          contact_method: entry.payload.contactMethod,
          call_status: entry.payload.callStatus ?? null,
          support_level: entry.payload.supportLevel ?? null,
          question_response: JSON.stringify(entry.payload.questionResponse),
          tech_issues_reported: entry.payload.techIssuesReported,
          comment: entry.payload.comment ?? null,
          tech_issue_comment: entry.payload.techIssueComment ?? null,
          media_links:
            resolvedMediaLinks && resolvedMediaLinks.length > 0
              ? JSON.stringify(resolvedMediaLinks)
              : null,
          created_at: entry.occurredAt,
          updated_at: entry.occurredAt,
        })
        .select()
        .single();

      if (error) {
        const errorCode = getPostgrestErrorCode(error) ?? '';
        if (errorCode === '23505') {
          const { data: existing } = await this.supabase
            .from(TABLES.FcUserForms)
            .select('*')
            .eq('id', entry.id)
            .maybeSingle();
          if (existing) {
            if (
              entry.payload.offlineMediaFiles &&
              entry.payload.offlineMediaFiles.length > 0
            ) {
              await deleteOfflineMediaFiles(entry.payload.offlineMediaFiles);
            }
            await markFcTouchPointSynced(entry.id);
            continue;
          }
        }
        throw error;
      }

      if (data) {
        if (
          entry.payload.offlineMediaFiles &&
          entry.payload.offlineMediaFiles.length > 0
        ) {
          await deleteOfflineMediaFiles(entry.payload.offlineMediaFiles);
        }
        await markFcTouchPointSynced(entry.id);
      }
    } catch (error) {
      await markFcTouchPointFailed(entry.id, error);
      return;
    }
  }
}
