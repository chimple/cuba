import { EnumType, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiProgramClassManagement } from './SupabaseApi.program.classManagement';

export interface SupabaseApiProgramFieldCoordinator {
  [key: string]: any;
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
  }) {
    if (!this.supabase) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from(TABLES.FcUserForms)
      .insert({
        visit_id: payload.visitId ?? null,
        user_id: payload.userId,
        school_id: payload.schoolId,
        class_id: payload.classId ?? null,
        contact_user_id: payload.contactUserId ?? null,
        contact_target: payload.contactTarget,
        contact_method: payload.contactMethod,
        call_status: payload.callStatus ?? null,
        support_level: payload.supportLevel ?? null,
        question_response: JSON.stringify(payload.questionResponse),
        tech_issues_reported: payload.techIssuesReported,
        comment: payload.comment ?? null,
        tech_issue_comment: payload.techIssueComment ?? null,
        media_links:
          payload.mediaLinks && payload.mediaLinks.length > 0
            ? JSON.stringify(payload.mediaLinks)
            : null,
      })
      .select()
      .single();

    return { data, error };
  }
  async getTodayVisitId(
    userId: string,
    schoolId: string,
  ): Promise<string | null> {
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

      const { data, error } = await this.supabase
        .from('fc_user_forms')
        .select('contact_target, support_level')
        .eq('is_deleted', false);

      if (error) throw error;

      const forms = data || [];

      const contactTypes = [
        ...new Set(forms.map((f) => f.contact_target).filter(Boolean)),
      ];
      const performance = [
        ...new Set(forms.map((f) => f.support_level).filter(Boolean)),
      ];

      return {
        contactType: contactTypes,
        performance: performance,
      };
    } catch (error) {
      logger.error('Error in getActivitiesFilterOptions:', error);
      throw error;
    }
  }

  async getRecentAssignmentCountByTeacher(
    teacherId: string,
    classId: string,
  ): Promise<number | null> {
    if (!this.supabase) return null;

    const SEVEN_DAYS_AGO = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('batch_id')
      .eq('created_by', teacherId)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .gte('created_at', SEVEN_DAYS_AGO);

    if (error) {
      logger.error('Error fetching assignments:', error);
      return null;
    }

    if (!data || data.length === 0) return 0;

    return new Set(data.map((row) => row.batch_id)).size;
  }

  async createNoteForSchool(params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  }): Promise<any> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return null;
    }

    const { schoolId, classId = null, content, mediaLinks = null } = params;

    // ---- GET CURRENT USER ----
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const currentUserId = currentUser?.id;

    if (!currentUserId) {
      throw new Error('No authenticated user found for createNoteForSchool');
    }

    // ---- TODAY TIME WINDOW ----
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    ).toISOString();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    ).toISOString();

    let visitId: string | null = null;

    // ---- 1) FIND TODAY'S OPEN VISIT ----
    const visitQuery = await this.supabase
      .from('fc_school_visit')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .gte('check_in_at', startOfDay)
      .lt('check_in_at', endOfDay)
      .is('check_out_at', null)
      .limit(1);

    if (!visitQuery.error && visitQuery.data?.length > 0) {
      visitId = visitQuery.data[0].id;
    }

    // ---- REQUIRED FIELDS FOR INSERT ----
    const insertPayload = {
      visit_id: visitId,
      user_id: currentUserId,
      school_id: schoolId,
      class_id: classId,
      comment: content,
      is_deleted: false,
      media_links:
        mediaLinks && mediaLinks.length > 0 ? JSON.stringify(mediaLinks) : null,

      // Required NOT NULL:
      contact_target: 'school' as any,
      contact_method: 'in_person' as any,

      // Optional:
      call_status: null,
      support_level: null,
      question_response: null,
      tech_issues_reported: false,
      tech_issue_comment: null,
    };

    // ---- 2) INSERT ROW ----
    const insertRes = await this.supabase
      .from('fc_user_forms')
      .insert([insertPayload]) // MUST be an array
      .select('*')
      .single();

    if (insertRes.error) {
      logger.error('Insert error:', insertRes.error);
      throw insertRes.error;
    }

    const created = insertRes.data;

    // ---- 3) FETCH USER NAME & ROLE ----
    const userRes = await this.supabase
      .from('user')
      .select('name')
      .eq('id', currentUserId)
      .eq('is_deleted', false)
      .single();

    const roleRes = await this.supabase
      .from('special_users')
      .select('role')
      .eq('user_id', currentUserId)
      .eq('is_deleted', false)
      .limit(1);

    // ---- 4) FETCH CLASS NAME ----
    let className: string | null = null;
    if (classId) {
      const cls = await this.supabase
        .from('class')
        .select('name')
        .eq('id', classId)
        .eq('is_deleted', false)
        .single();
      className = !cls.error && cls.data ? cls.data.name : null;
    }

    // ---- 5) RETURN STRUCTURED UI OBJECT ----
    return {
      id: created.id,
      visitId: created.visit_id,
      schoolId: created.school_id,
      classId: created.class_id,
      className,
      content: created.comment,
      createdAt: created.created_at,
      createdBy: {
        userId: currentUserId,
        name: userRes.data?.name ?? 'Unknown',
        role: roleRes.data?.[0]?.role ?? null,
      },
    };
  }

  async getNotesBySchoolId(
    schoolId: string,
    limit = 10,
    offset = 0,
    sortBy: 'createdAt' | 'createdBy' = 'createdAt',
  ): Promise<{ data: any[]; totalCount: number }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized.');
      return { data: [], totalCount: 0 };
    }

    try {
      let notesQ = this.supabase
        .from('fc_user_forms')
        .select(
          `
          id,
          comment,
          class_id,
          visit_id,
          created_at,
          media_links,

          class:class_id (
            id,
            name
          ),

          user:user!fc_user_forms_user_id_fkey (
            id,
            name,
            special_users (
              role
            )
          )
        `,
          { count: 'exact' },
        )
        .eq('school_id', schoolId)
        .is('contact_user_id', null)
        .eq('is_deleted', false);

      if (sortBy === 'createdAt') {
        notesQ = notesQ
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
      }

      if (sortBy === 'createdBy') {
        notesQ = notesQ.order('name', {
          foreignTable: 'user',
          ascending: true,
        });
      }

      const notesRes = await notesQ.range(offset, offset + limit - 1);

      if (notesRes.error) {
        logger.error('[API] Supabase error:', notesRes.error);
        return { data: [], totalCount: 0 };
      }

      const rows = notesRes.data ?? [];
      const totalCount = notesRes.count ?? 0;

      const mapped = rows.map((r: any) => ({
        id: r.id,
        content: r.comment,
        classId: r.class_id,
        className: r.class?.name ?? null,
        visitId: r.visit_id,
        createdAt: r.created_at,
        createdBy: {
          name: r.user?.name ?? 'Unknown',
          role: r.user?.special_users?.[0]?.role ?? null,
        },
        media_links: r.media_links ?? null,
      }));

      return { data: mapped, totalCount };
    } catch (e) {
      logger.error('getNotesBySchoolId error:', e);
      return { data: [], totalCount: 0 };
    }
  }
}
