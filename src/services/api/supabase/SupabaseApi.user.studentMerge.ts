import { EnumType, RequestTypes, STATUS } from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiUserStudentLists } from './SupabaseApi.user.studentLists';
export interface SupabaseApiUserStudentMerge {
  [key: string]: any;
}
export class SupabaseApiUserStudentMerge extends SupabaseApiUserStudentLists {
  async mergeStudentRequest(
    existingStudentId: string,
    newStudentId: string,
    requestId?: string,
    respondedBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized.');
    }

    const AUTO_REJECT_REASON_TYPE = 'Verification Failed';
    const AUTO_REJECT_REASON_DESCRIPTION =
      'Auto-rejected because a duplicate student request was merged and approved.';
    const now = new Date().toISOString();

    // 1. Get destination student (record to keep)
    const { data: newStudentData, error: newStudentError } = await this.supabase
      .from('user')
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (*)
      )
    `,
      )
      .eq('id', newStudentId)
      .eq('is_deleted', false)
      .single();

    if (newStudentError || !newStudentData) {
      throw new Error('New student not found');
    }

    const newParents = (newStudentData.parent_links || []).map(
      (link: any) => link.parent,
    );

    // 2. Get source student (record to merge and delete)
    const { data: existingStudentData, error: existingStudentError } =
      await this.supabase
        .from('user')
        .select(
          `
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (*)
        )
      `,
        )
        .eq('id', existingStudentId)
        .eq('is_deleted', false)
        .single();
    if (existingStudentError || !existingStudentData) {
      throw new Error('Existing student not found');
    }

    const existingParents = (existingStudentData.parent_links || []).map(
      (link: any) => link.parent,
    );

    // 3. Transfer results
    const { data: results } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', existingStudentId)
      .eq('is_deleted', false);

    if (results && results.length > 0) {
      const { error: resultTransferError } = await this.supabase
        .from('result')
        .update({
          student_id: newStudentId,
          updated_at: now,
        })
        .eq('student_id', existingStudentId)
        .eq('is_deleted', false);

      if (resultTransferError) {
        throw new Error(
          `Failed to transfer results: ${resultTransferError.message}`,
        );
      }
    }

    // 4. Update active FC interactions to point to the merged student.
    const fcFormsUpdateResult = await this.updateFcUserFormsContactUserId(
      existingStudentId,
      newStudentId,
    );
    if (!fcFormsUpdateResult.success) {
      throw new Error(fcFormsUpdateResult.message);
    }

    // 5. Merge parents
    const allParents = [...existingParents, ...newParents];
    const uniqueParents: any[] = [];

    for (const parent of allParents) {
      const alreadyExists = uniqueParents.some((p) => {
        const phoneMatch = p.phone && parent.phone && p.phone === parent.phone;
        const emailMatch = p.email && parent.email && p.email === parent.email;
        return phoneMatch || emailMatch;
      });

      if (!alreadyExists) {
        uniqueParents.push(parent);
      }
    }

    for (const parent of uniqueParents) {
      const { data: existingLink } = await this.supabase
        .from('parent_user')
        .select('id')
        .eq('student_id', newStudentId)
        .eq('parent_id', parent.id)
        .maybeSingle();

      if (!existingLink) {
        const { error: parentInsertError } = await this.supabase
          .from('parent_user')
          .insert({
            student_id: newStudentId,
            parent_id: parent.id,
            is_deleted: false,
            updated_at: now,
          });
        if (parentInsertError) {
          throw new Error(
            `Failed to merge parent link: ${parentInsertError.message}`,
          );
        }
      }
    }

    // 6. Merge learning pathway before soft deleting source student.
    const pathwayMergeResult = await this.mergeUserPathway(
      existingStudentId,
      newStudentId,
    );
    if (!pathwayMergeResult.success) {
      throw new Error(
        pathwayMergeResult.message || 'Failed to merge learning pathway.',
      );
    }

    // 7. Merge stars from users table

    const { data: oldUser, error: oldError } = await this.supabase
      .from('user')
      .select('stars')
      .eq('id', existingStudentId)
      .eq('is_deleted', false)
      .single();

    const { data: newUser, error: newError } = await this.supabase
      .from('user')
      .select('stars')
      .eq('id', newStudentId)
      .eq('is_deleted', false)
      .single();

    if (oldError || newError) {
      throw new Error('Failed to fetch student stars.');
    }

    const oldStars = oldUser?.stars ?? 0;
    const newStars = newUser?.stars ?? 0;
    const totalStars = oldStars + newStars;

    const { error: starUpdateError } = await this.supabase
      .from('user')
      .update({
        stars: totalStars,
        updated_at: now,
      })
      .eq('id', newStudentId);

    if (starUpdateError) {
      throw new Error(
        `Failed to update merged stars: ${starUpdateError.message}`,
      );
    }

    // 🔥 FIX: Force class_user update so other devices sync it
    const { error: classUserSyncError } = await this.supabase
      .from('class_user')
      .update({ updated_at: now })
      .eq('user_id', newStudentId)
      .eq('is_deleted', false);
    if (classUserSyncError) {
      logger.warn(
        'class_user sync touch failed after merge:',
        classUserSyncError,
      );
    }

    // 8. Soft delete source student records
    const { error: classUserDeleteError } = await this.supabase
      .from('class_user')
      .update({ is_deleted: true, updated_at: now })
      .eq('user_id', existingStudentId);
    if (classUserDeleteError) {
      throw new Error(
        `Failed to soft delete source class_user rows: ${classUserDeleteError.message}`,
      );
    }

    const { error: parentUserDeleteError } = await this.supabase
      .from('parent_user')
      .update({ is_deleted: true, updated_at: now })
      .eq('student_id', existingStudentId);
    if (parentUserDeleteError) {
      throw new Error(
        `Failed to soft delete source parent_user rows: ${parentUserDeleteError.message}`,
      );
    }

    const { error: sourceUserDeleteError } = await this.supabase
      .from('user')
      .update({ is_deleted: true, updated_at: now })
      .eq('id', existingStudentId);
    if (sourceUserDeleteError) {
      throw new Error(
        `Failed to soft delete source user: ${sourceUserDeleteError.message}`,
      );
    }

    // 9. Update related requests for merged profiles.
    type MergeRequestStatusRow = {
      id: string;
      request_id: string | null;
      requested_by: string | null;
      school_id: string | null;
      class_id: string | null;
      request_type: EnumType<'ops_request_type'> | null;
      created_at?: string | null;
    };

    let resolvedRespondedBy: string | null = respondedBy ?? null;
    if (!resolvedRespondedBy) {
      try {
        const currentUser =
          await ServiceConfig.getI().authHandler.getCurrentUser();
        resolvedRespondedBy = currentUser?.id ?? null;
      } catch (error) {
        logger.warn(
          'Unable to resolve current user while updating merge request statuses:',
          error,
        );
      }
    }

    let approvedRequestRow: MergeRequestStatusRow | null = null;
    if (requestId) {
      const { data: updatedRequest, error: requestUpdateError } =
        await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.APPROVED,
            updated_at: now,
            responded_by: resolvedRespondedBy,
          })
          .eq('request_id', requestId)
          .eq('is_deleted', false)
          .select(
            'id, request_id, requested_by, school_id, class_id, request_type',
          )
          .maybeSingle();

      if (requestUpdateError) {
        throw new Error(
          `Failed to update merge request: ${requestUpdateError.message}`,
        );
      }
      if (!updatedRequest) {
        throw new Error('Merge request not found while updating approval.');
      }
      approvedRequestRow = updatedRequest as MergeRequestStatusRow;
    } else {
      const { data: pendingMergeRequests, error: pendingMergeRequestsError } =
        await this.supabase
          .from('ops_requests')
          .select(
            'id, request_id, requested_by, school_id, class_id, request_type, created_at',
          )
          .eq('is_deleted', false)
          .eq('request_status', STATUS.REQUESTED)
          .eq('request_type', RequestTypes.STUDENT)
          .in('requested_by', [existingStudentId, newStudentId])
          .order('created_at', { ascending: false });

      if (pendingMergeRequestsError) {
        throw new Error(
          `Failed to fetch pending merge requests: ${pendingMergeRequestsError.message}`,
        );
      }

      const pendingRows = (pendingMergeRequests ??
        []) as MergeRequestStatusRow[];
      const pendingRequestForKeptProfile =
        pendingRows.find((row) => row.requested_by === newStudentId) ?? null;

      if (pendingRequestForKeptProfile) {
        const { error: approveKeptProfileRequestError } = await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.APPROVED,
            responded_by: resolvedRespondedBy,
            updated_at: now,
          })
          .eq('id', pendingRequestForKeptProfile.id)
          .eq('is_deleted', false);

        if (approveKeptProfileRequestError) {
          throw new Error(
            `Failed to approve kept profile request after merge: ${approveKeptProfileRequestError.message}`,
          );
        }

        approvedRequestRow = pendingRequestForKeptProfile;
      } else {
        const { error: rejectMergedAwayRequestError } = await this.supabase
          .from('ops_requests')
          .update({
            request_status: STATUS.REJECTED,
            rejected_reason_type: AUTO_REJECT_REASON_TYPE,
            rejected_reason_description: AUTO_REJECT_REASON_DESCRIPTION,
            responded_by: resolvedRespondedBy,
            updated_at: now,
          })
          .eq('is_deleted', false)
          .eq('request_status', STATUS.REQUESTED)
          .eq('request_type', RequestTypes.STUDENT)
          .eq('requested_by', existingStudentId);

        if (rejectMergedAwayRequestError) {
          throw new Error(
            `Failed to reject merged-away profile requests: ${rejectMergedAwayRequestError.message}`,
          );
        }
      }
    }

    if (
      approvedRequestRow?.request_type === RequestTypes.STUDENT &&
      approvedRequestRow?.requested_by
    ) {
      const duplicateRequestedByIds = Array.from(
        new Set(
          [approvedRequestRow.requested_by, existingStudentId, newStudentId]
            .map((value) => value?.trim())
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.length > 0,
            ),
        ),
      );

      if (duplicateRequestedByIds.length === 0) {
        throw new Error(
          'Missing duplicate request user ids while rejecting sibling requests.',
        );
      }

      let siblingRequestsUpdate = this.supabase
        .from('ops_requests')
        .update({
          request_status: STATUS.REJECTED,
          rejected_reason_type: AUTO_REJECT_REASON_TYPE,
          rejected_reason_description: AUTO_REJECT_REASON_DESCRIPTION,
          responded_by: resolvedRespondedBy,
          updated_at: now,
        })
        .eq('is_deleted', false)
        .eq('request_status', STATUS.REQUESTED)
        .eq('request_type', RequestTypes.STUDENT)
        .in('requested_by', duplicateRequestedByIds)
        .neq('id', approvedRequestRow.id);

      if (approvedRequestRow.school_id) {
        siblingRequestsUpdate = siblingRequestsUpdate.eq(
          'school_id',
          approvedRequestRow.school_id,
        );
      } else {
        siblingRequestsUpdate = siblingRequestsUpdate.is('school_id', null);
      }

      if (approvedRequestRow.class_id) {
        siblingRequestsUpdate = siblingRequestsUpdate.eq(
          'class_id',
          approvedRequestRow.class_id,
        );
      } else {
        siblingRequestsUpdate = siblingRequestsUpdate.is('class_id', null);
      }

      const { error: siblingRequestsError } = await siblingRequestsUpdate;
      if (siblingRequestsError) {
        throw new Error(
          `Failed to reject duplicate pending requests after merge: ${siblingRequestsError.message}`,
        );
      }
    }

    return {
      success: true,
      message: 'Students merged successfully',
    };
  }
}
