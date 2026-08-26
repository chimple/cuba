import { EnumType, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import {
  isLikelyOfflineError,
  markFcTouchPointFailed,
  markFcTouchPointSynced,
  queueFcUserForm,
  requestFcTouchPointSync,
} from '../fcTouchPointOfflineQueue';
import type { SupabaseApiProgramFieldCoordinator } from '../../api/supabase/SupabaseApi.program.fieldCoordinator';
import type { FcUserFormSaveResult } from '../../api/serviceapi/ServiceApi.types';
import {
  deleteOfflineMediaFiles,
  type OfflineMediaFileRef,
  uploadOfflineMediaFiles,
} from './fcTouchPointOfflineMedia';

export type CreatedFcNote = {
  id: string;
  visitId: string | null;
  schoolId: string;
  classId: string | null;
  className: string | null;
  content: string;
  text: string;
  createdAt: string;
  createdBy: {
    userId: string;
    name: string;
    role: string | null;
  };
  media_links?: string | null;
};

type FcNoteQueryRow = {
  id: string;
  comment: string | null;
  class_id: string | null;
  visit_id: string | null;
  created_at: string;
  media_links: string | null;
  class?: {
    name?: string | null;
  } | null;
  user?: {
    id?: string | null;
    name?: string | null;
    special_users?: Array<{ role?: string | null }> | null;
  } | null;
};

const getPostgrestErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

export async function saveFcUserForm(
  this: SupabaseApiProgramFieldCoordinator,
  payload: {
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
  },
): Promise<FcUserFormSaveResult> {
  const queueEntry = await queueFcUserForm(payload);
  const occurredAt = queueEntry.occurredAt;
  const queuedResult = {
    id: queueEntry.id,
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
    created_at: occurredAt,
    updated_at: occurredAt,
    is_deleted: false,
  } as TableTypes<'fc_user_forms'>;

  if (!this.supabase) {
    return { data: queuedResult, error: null };
  }

  try {
    let resolvedMediaLinks = payload.mediaLinks ?? null;
    if (
      (!resolvedMediaLinks || resolvedMediaLinks.length === 0) &&
      payload.offlineMediaFiles &&
      payload.offlineMediaFiles.length > 0
    ) {
      resolvedMediaLinks = await uploadOfflineMediaFiles({
        schoolId: payload.schoolId,
        refs: payload.offlineMediaFiles,
        uploadFn: (file) =>
          this.uploadSchoolVisitMediaFile({
            schoolId: payload.schoolId,
            file,
          }),
      });
    }

    const { data, error } = await this.supabase
      .from(TABLES.FcUserForms)
      .insert({
        id: queueEntry.id,
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
          resolvedMediaLinks && resolvedMediaLinks.length > 0
            ? JSON.stringify(resolvedMediaLinks)
            : null,
        created_at: occurredAt,
        updated_at: occurredAt,
      })
      .select()
      .single();

    if (error) {
      const errorCode = getPostgrestErrorCode(error) ?? '';
      if (errorCode === '23505') {
        const { data: existing } = await this.supabase
          .from(TABLES.FcUserForms)
          .select('*')
          .eq('id', queueEntry.id)
          .maybeSingle();
        if (existing) {
          if (
            payload.offlineMediaFiles &&
            payload.offlineMediaFiles.length > 0
          ) {
            await deleteOfflineMediaFiles(payload.offlineMediaFiles);
          }
          await markFcTouchPointSynced(queueEntry.id);
          return { data: existing, error: null };
        }
      }
      throw error;
    }

    await markFcTouchPointSynced(queueEntry.id);
    if (payload.offlineMediaFiles && payload.offlineMediaFiles.length > 0) {
      await deleteOfflineMediaFiles(payload.offlineMediaFiles);
    }
    return { data, error: null };
  } catch (error) {
    await markFcTouchPointFailed(queueEntry.id, error);
    requestFcTouchPointSync();

    if (isLikelyOfflineError(error)) {
      return { data: queuedResult, error: null };
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function createNoteForSchool(
  this: SupabaseApiProgramFieldCoordinator,
  params: {
    schoolId: string;
    classId?: string | null;
    content: string;
    mediaLinks?: string[] | null;
  },
): Promise<CreatedFcNote | null> {
  if (!this.supabase) {
    logger.error('Supabase client not initialized.');
    return null;
  }

  const { schoolId, classId = null, content, mediaLinks = null } = params;
  const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
  const currentUserId = currentUser?.id;

  if (!currentUserId) {
    throw new Error('No authenticated user found for createNoteForSchool');
  }

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

  const insertPayload = {
    visit_id: visitId,
    user_id: currentUserId,
    school_id: schoolId,
    class_id: classId,
    comment: content,
    is_deleted: false,
    media_links:
      mediaLinks && mediaLinks.length > 0 ? JSON.stringify(mediaLinks) : null,
    contact_target: 'school' as EnumType<'fc_engagement_target'>,
    contact_method: 'in_person' as EnumType<'fc_contact_method'>,
    call_status: null,
    support_level: null,
    question_response: null,
    tech_issues_reported: false,
    tech_issue_comment: null,
  };

  const insertRes = await this.supabase
    .from('fc_user_forms')
    .insert([insertPayload])
    .select('*')
    .single();

  if (insertRes.error) {
    logger.error('Insert error:', insertRes.error);
    throw insertRes.error;
  }

  const created = insertRes.data;
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

  return {
    id: created.id,
    visitId: created.visit_id,
    schoolId: created.school_id,
    classId: created.class_id,
    className,
    content: created.comment ?? '',
    text: created.comment ?? '',
    createdAt: created.created_at,
    createdBy: {
      userId: currentUserId,
      name: userRes.data?.name ?? 'Unknown',
      role: roleRes.data?.[0]?.role ?? null,
    },
  };
}

export async function getNotesBySchoolId(
  this: SupabaseApiProgramFieldCoordinator,
  schoolId: string,
  limit = 10,
  offset = 0,
  sortBy: 'createdAt' | 'createdBy' = 'createdAt',
): Promise<{ data: CreatedFcNote[]; totalCount: number }> {
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

    const rows = (notesRes.data ?? []) as FcNoteQueryRow[];
    const totalCount = notesRes.count ?? 0;

    const mapped = rows.map(
      (r): CreatedFcNote => ({
        id: r.id,
        content: r.comment ?? '',
        text: r.comment ?? '',
        schoolId,
        classId: r.class_id,
        className: r.class?.name ?? null,
        visitId: r.visit_id,
        createdAt: r.created_at,
        createdBy: {
          userId: r.user?.id ?? '',
          name: r.user?.name ?? 'Unknown',
          role: r.user?.special_users?.[0]?.role ?? null,
        },
        media_links: r.media_links ?? null,
      }),
    );

    return { data: mapped, totalCount };
  } catch (e) {
    logger.error('getNotesBySchoolId error:', e);
    return { data: [], totalCount: 0 };
  }
}
