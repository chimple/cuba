import {
  SchoolVisitAction,
  SchoolVisitType,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import {
  getQueuedVisitSnapshot,
  isLikelyOfflineError,
  markFcTouchPointFailed,
  markFcTouchPointSynced,
  queueFcSchoolVisit,
  requestFcTouchPointSync,
} from '../fcTouchPointOfflineQueue';
import { clearSavedOpenVisitSnapshot } from '../fcTouchPointOfflineQueue.storage';
import type { SupabaseApiAssignmentAssessments } from '../../api/supabase/SupabaseApi.assignment.assessments';

const getPostgrestErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

const getLatestOpenVisit = async (
  context: SupabaseApiAssignmentAssessments,
  schoolId: string,
  userId: string,
) => {
  if (!context.supabase) return null;

  const { data, error } = await context.supabase
    .from('fc_school_visit')
    .select('id, type, distance_from_school, number_of_parents')
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .is('check_out_at', null)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('SupabaseApi: Failed to find open visit for checkout:', error);
    return null;
  }

  return data;
};

export async function recordSchoolVisit(
  this: SupabaseApiAssignmentAssessments,
  schoolId: string,
  lat: number,
  lng: number,
  action: SchoolVisitAction,
  visitType?: SchoolVisitType,
  distanceFromSchool?: number,
  numberOfParents?: number,
): Promise<TableTypes<'fc_school_visit'> | null> {
  let queueEntry: Awaited<ReturnType<typeof queueFcSchoolVisit>> | null = null;
  try {
    if (!this.supabase) {
      logger.error('Supabase client not initialized');
      return null;
    }

    const user = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!user) {
      logger.error('SupabaseApi: User not logged in');
      throw 'User is not Logged in';
    }

    const now = new Date().toISOString();
    queueEntry = await queueFcSchoolVisit({
      schoolId,
      userId: user.id,
      action,
      lat,
      lng,
      visitType,
      distanceFromSchool,
      numberOfParents,
      occurredAt: now,
    });
    const localSnapshot = await getQueuedVisitSnapshot(user.id, schoolId);

    if (action === SchoolVisitAction.CheckIn) {
      const newVisit = {
        id: queueEntry.visitId ?? queueEntry.id,
        school_id: schoolId,
        user_id: user.id,
        check_in_at: now,
        check_in_lat: lat,
        check_in_lng: lng,
        type: visitType,
        is_deleted: false,
        distance_from_school:
          distanceFromSchool == null ? null : String(distanceFromSchool),
        number_of_parents: null,
      };

      const { data, error } = await this.supabase
        .from('fc_school_visit')
        .insert(newVisit)
        .select()
        .single();

      if (error) {
        const errorCode = getPostgrestErrorCode(error) ?? '';
        if (errorCode === '23505') {
          const { data: existing } = await this.supabase
            .from('fc_school_visit')
            .select('*')
            .eq('id', newVisit.id)
            .maybeSingle();
          if (existing) {
            await markFcTouchPointSynced(queueEntry.id);
            return existing;
          }
        }
        logger.error('SupabaseApi: Insert Error:', error);
        throw error;
      }
      await markFcTouchPointSynced(queueEntry.id);
      return data;
    }

    const openVisit = await getLatestOpenVisit(this, schoolId, user.id);
    let backendSnapshot = localSnapshot;
    if (openVisit) {
      backendSnapshot = {
        id: openVisit.id,
        school_id: schoolId,
        user_id: user.id,
        check_in_at: now,
        check_in_lat: lat,
        check_in_lng: lng,
        check_out_at: null,
        check_out_lat: null,
        check_out_lng: null,
        created_at: now,
        updated_at: now,
        distance_check_out: null,
        distance_from_school: openVisit.distance_from_school ?? null,
        notes: null,
        number_of_parents: openVisit.number_of_parents ?? null,
        is_deleted: false,
        type: openVisit.type ?? null,
      };
    }

    const visitId = queueEntry.visitId ?? backendSnapshot?.id;
    if (!visitId) {
      logger.warn('SupabaseApi: No local visit found to check out from.');
      return backendSnapshot;
    }

    const nextNumberOfParents =
      backendSnapshot?.type === SchoolVisitType.Community
        ? numberOfParents == null
          ? backendSnapshot.number_of_parents
          : numberOfParents
        : null;

    let { data, error } = await this.supabase
      .from('fc_school_visit')
      .update({
        check_out_at: now,
        check_out_lat: lat,
        check_out_lng: lng,
        number_of_parents: nextNumberOfParents,
        updated_at: now,
        distance_from_school:
          distanceFromSchool == null
            ? (backendSnapshot?.distance_from_school ?? null)
            : String(distanceFromSchool),
      })
      .eq('id', visitId)
      .select()
      .single();

    if ((getPostgrestErrorCode(error) ?? '') === 'PGRST116') {
      const freshOpenVisit = await getLatestOpenVisit(this, schoolId, user.id);
      if (freshOpenVisit?.id && freshOpenVisit.id !== visitId) {
        ({ data, error } = await this.supabase
          .from('fc_school_visit')
          .update({
            check_out_at: now,
            check_out_lat: lat,
            check_out_lng: lng,
            number_of_parents:
              (freshOpenVisit.type ?? null) === SchoolVisitType.Community
                ? (numberOfParents ?? freshOpenVisit.number_of_parents ?? null)
                : null,
            updated_at: now,
            distance_from_school:
              distanceFromSchool == null
                ? (freshOpenVisit.distance_from_school ?? null)
                : String(distanceFromSchool),
          })
          .eq('id', freshOpenVisit.id)
          .select()
          .single());
      }
    }

    if (error) {
      logger.error('SupabaseApi: Update Error:', error);
      throw error;
    }
    await markFcTouchPointSynced(queueEntry.id);
    await clearSavedOpenVisitSnapshot(user.id, schoolId);
    return data;
  } catch (error) {
    logger.error(
      'SupabaseApi: Unexpected error recording school visit:',
      error,
    );
    if (!this.supabase || !queueEntry) {
      return null;
    }

    const queuedSnapshot = await getQueuedVisitSnapshot(
      queueEntry.userId,
      schoolId,
    );
    await markFcTouchPointFailed(queueEntry.id, error);
    requestFcTouchPointSync();
    if (isLikelyOfflineError(error) && queuedSnapshot) {
      return queuedSnapshot;
    }
    return null;
  }
}
