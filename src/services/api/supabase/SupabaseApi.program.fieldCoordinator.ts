import { EnumType, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { getQueuedOpenVisitId } from '../../offline/fcTouchPointOfflineQueue';
import { SupabaseApiProgramClassManagement } from './SupabaseApi.program.classManagement';
import type {
  TeacherAssignmentCountMap,
  TeacherAssignmentCountPair,
} from '../serviceapi/ServiceApi.fieldActivities';
import type { FcUserFormSaveResult } from '../serviceapi/ServiceApi.types';
import {
  createNoteForSchool as createFcTouchPointNote,
  getNotesBySchoolId as getFcTouchPointNotesBySchoolId,
  saveFcUserForm as saveFcTouchPointUserForm,
  type CreatedFcNote,
} from '../../offline/fctouchpoints/fcTouchPointNotes';

export interface SupabaseApiProgramFieldCoordinator {
  [key: string]: unknown;
}

export class SupabaseApiProgramFieldCoordinator extends SupabaseApiProgramClassManagement {
  async getFilteredFcQuestions(
    type: EnumType<'fc_support_level'> | null,
    targetType: EnumType<'fc_engagement_target'>,
  ): Promise<TableTypes<'fc_question'>[] | []> {
    if (!this.supabase) {
      return [];
    }

    let query = this.supabase
      .from(TABLES.FcQuestion)
      .select('*')
      .eq('target_type', targetType)
      .eq('is_deleted', false)
      .eq('status', 'active');

    if (type !== null) {
      query = query.eq('type', type);
    } else {
      query = query.is('type', null);
    }

    const { data, error } = await query.order('sort_order', {
      ascending: true,
    });

    if (error) {
      logger.error('Error fetching FC Questions:', error);
      return [];
    }

    return data;
  }
  async saveFcUserForm(payload: {
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
  }): Promise<FcUserFormSaveResult> {
    return saveFcTouchPointUserForm.call(this, payload);
  }

  async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
    const queuedVisitId = await getQueuedOpenVisitId(userId, schoolId);
    if (queuedVisitId) {
      return queuedVisitId;
    }

    if (!this.supabase) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from(TABLES.FcSchoolVisit)
      .select('id')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .filter('is_deleted', 'eq', false)
      .filter('check_out_at', 'is', null)
      .gte('check_in_at', `${todayISO}T00:00:00.000Z`)
      .maybeSingle();

    if (error) return null;

    // No valid visit found
    if (!data) return null;

    return data.id;
  }

  async getActivitiesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'fc_user_forms'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('fc_user_forms')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .not('contact_user_id', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching user forms:', error);
      return [];
    }

    return data ?? [];
  }

  async getSchoolVisitById(
    visitIds: string[],
  ): Promise<TableTypes<'fc_school_visit'>[]> {
    if (!this.supabase || visitIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('fc_school_visit')
      .select('*')
      .in('id', visitIds) // ✅ pass array directly
      .eq('is_deleted', false)
      .order('check_in_at', { ascending: true });

    if (error) {
      logger.error('Error fetching visit:', error);
      return [];
    }

    return data ?? [];
  }

  async getActivitiesFilterOptions() {
    try {
      if (!this.supabase) return null;

      const [
        { data: forms, error: formsError },
        { data: visits, error: visitsError },
      ] = await Promise.all([
        this.supabase
          .from('fc_user_forms')
          .select('contact_target, support_level')
          .eq('is_deleted', false),
        this.supabase
          .from('fc_school_visit')
          .select('type')
          .eq('is_deleted', false),
      ]);

      if (formsError) throw formsError;
      if (visitsError) throw visitsError;

      const contactTypes = [
        ...new Set(forms.map((f) => f.contact_target).filter(Boolean)),
      ];
      const performance = [
        ...new Set(forms.map((f) => f.support_level).filter(Boolean)),
      ];
      const visitType = [
        ...new Set(visits.map((visit) => visit.type).filter(Boolean)),
      ];

      return {
        contactType: contactTypes,
        performance: performance,
        visitType,
      };
    } catch (error) {
      logger.error('Error in getActivitiesFilterOptions:', error);
      throw error;
    }
  }

  async getRecentAssignmentCountsByTeachers(
    pairs: TeacherAssignmentCountPair[],
  ): Promise<TeacherAssignmentCountMap> {
    const normalizedPairs = Array.from(
      new Map(
        pairs
          .map((pair) => ({
            teacherId: String(pair.teacherId ?? '').trim(),
            classId: String(pair.classId ?? '').trim(),
          }))
          .filter((pair) => pair.teacherId && pair.classId)
          .map((pair) => [`${pair.teacherId}:${pair.classId}`, pair]),
      ).values(),
    );
    const counts: TeacherAssignmentCountMap = {};
    normalizedPairs.forEach((pair) => {
      counts[`${pair.teacherId}:${pair.classId}`] = 0;
    });

    if (!this.supabase || normalizedPairs.length === 0) return counts;

    const teacherIds = Array.from(
      new Set(normalizedPairs.map((pair) => pair.teacherId)),
    );
    const classIds = Array.from(
      new Set(normalizedPairs.map((pair) => pair.classId)),
    );
    const requestedPairKeys = new Set(Object.keys(counts));
    const batchIdsByPair = new Map<string, Set<string | null>>();
    const SEVEN_DAYS_AGO = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('created_by, class_id, batch_id')
      .in('created_by', teacherIds)
      .in('class_id', classIds)
      .eq('is_deleted', false)
      .gte('created_at', SEVEN_DAYS_AGO);

    if (error) {
      logger.error('Error fetching assignment counts:', error);
      return Object.fromEntries(
        normalizedPairs.map((pair) => [
          `${pair.teacherId}:${pair.classId}`,
          null,
        ]),
      );
    }

    (data ?? []).forEach((row) => {
      const teacherId = String(row.created_by ?? '').trim();
      const classId = String(row.class_id ?? '').trim();
      const pairKey = `${teacherId}:${classId}`;
      if (!requestedPairKeys.has(pairKey)) return;
      if (!batchIdsByPair.has(pairKey)) {
        batchIdsByPair.set(pairKey, new Set());
      }
      batchIdsByPair.get(pairKey)?.add(row.batch_id ?? null);
    });

    batchIdsByPair.forEach((batchIds, pairKey) => {
      counts[pairKey] = batchIds.size;
    });

    return counts;
  }

  async getActiveTeachersCountForProgram7d(
    programId: string,
    schoolIds?: string[],
    gradeIds?: string[],
  ): Promise<number | null> {
    if (!this.supabase || !programId) return null;

    let query = this.supabase
      .from(TABLES.SchoolMetrics)
      .select('active_teachers')
      .eq('program_id', programId)
      .eq('metric_window', '7d')
      .eq('is_deleted', false);

    if (schoolIds && schoolIds.length > 0) {
      query = query.in('school_id', schoolIds);
    }

    if (gradeIds && gradeIds.length > 0) {
      query = query.in('grade_id', gradeIds);
    } else {
      query = query.is('grade_id', null);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(
        'Error fetching 7d active teachers from school metrics for program:',
        error,
      );
      return null;
    }

    return (data ?? []).reduce(
      (total, row) => total + (Number(row.active_teachers) || 0),
      0,
    );
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<CreatedFcNote | null> {
    return createFcTouchPointNote.call(this, params);
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit = 10,
    offset = 0,
    sortBy: 'createdAt' | 'createdBy' = 'createdAt',
  ): Promise<{ data: CreatedFcNote[]; totalCount: number }> {
    return getFcTouchPointNotesBySchoolId.call(
      this,
      schoolId,
      limit,
      offset,
      sortBy,
    );
  }
}
