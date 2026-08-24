import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';
import logger from '../../../utility/logger';
import {
  CampaignAudienceOptions,
  CampaignAudiencePayload,
  CampaignAudienceSummary,
  CampaignAudienceSummaryParams,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
} from '../ServiceApi';
import { type CampaignSchoolRow } from './SupabaseApi.campaign.helpers';
import { SupabaseApiCampaignListing } from './SupabaseApi.campaign.listing';

export const CAMPAIGN_ASSIGNMENT_TARGETS_PER_FUNCTION_REQUEST = 500;
export const CAMPAIGN_ASSIGNMENT_FUNCTION_CONCURRENCY = 4;

type CampaignAssignmentDefinition =
  LaunchCampaignPayload['assignments'][number];

const chunkCampaignAssignmentTargets = (
  assignments: LaunchCampaignPayload['assignments'],
): CampaignAssignmentDefinition[][] => {
  const targets = assignments.flatMap((assignment) =>
    assignment.schoolIds.map((schoolId) => ({
      ...assignment,
      schoolIds: [schoolId],
    })),
  );
  const chunks: CampaignAssignmentDefinition[][] = [];
  for (
    let index = 0;
    index < targets.length;
    index += CAMPAIGN_ASSIGNMENT_TARGETS_PER_FUNCTION_REQUEST
  ) {
    chunks.push(
      targets.slice(
        index,
        index + CAMPAIGN_ASSIGNMENT_TARGETS_PER_FUNCTION_REQUEST,
      ),
    );
  }
  return chunks;
};

export interface SupabaseApiCampaignAudience {
  [key: string]: any;
}
export class SupabaseApiCampaignAudience extends SupabaseApiCampaignListing {
  private normalizeProgramModel(model?: string) {
    switch (model?.trim()) {
      case 'At School':
      case 'at_school':
        return 'at_school';
      case 'At Home':
      case 'at_home':
        return 'at_home';
      case 'Hybrid':
      case 'hybrid':
        return 'hybrid';
      default:
        return '';
    }
  }

  async getCampaignAudienceOptions(
    programId: string,
    programModel?: string,
  ): Promise<CampaignAudienceOptions> {
    if (!this.supabase || !programId) {
      return { blocks: [], schools: [], grades: [] };
    }

    const normalizedProgramModel = this.normalizeProgramModel(programModel);

    let schoolQuery = this.supabase
      .from('school')
      .select('id, name, group3')
      .eq('program_id', programId)
      .eq('is_deleted', false);

    if (normalizedProgramModel) {
      schoolQuery = schoolQuery.eq('model', normalizedProgramModel);
    }

    const { data: schoolRows, error: schoolError } = await schoolQuery.order(
      'name',
      { ascending: true },
    );

    if (schoolError) {
      logger.error('Error fetching campaign audience schools:', schoolError);
      return { blocks: [], schools: [], grades: [] };
    }

    const schools: CampaignSchoolOption[] = (
      (schoolRows ?? []) as CampaignSchoolRow[]
    )
      .filter((school) => school.id && school.name)
      .map((school) => ({
        id: String(school.id),
        name: String(school.name),
        block: String(school.group3 || 'Unassigned'),
      }));

    const blocks = Array.from(
      new Set(schools.map((school) => school.block).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    const grades = await this.getCampaignAudienceOptionGradesForSchools(
      schools.map((school) => school.id),
    );

    return { blocks, schools, grades };
  }

  async getCampaignAudienceSummary({
    schoolIds,
    gradeIds,
  }: CampaignAudienceSummaryParams): Promise<CampaignAudienceSummary> {
    if (!this.supabase || schoolIds.length === 0 || gradeIds.length === 0) {
      return { totalStudents: 0, grades: [] };
    }

    const { data, error } = await this.supabase.rpc(
      'get_campaign_audience_summary',
      {
        p_school_ids: schoolIds,
        p_grade_ids: gradeIds,
      },
    );

    if (error) {
      logger.error('Error fetching campaign audience summary:', error);
      return { totalStudents: 0, grades: [] };
    }

    return data ?? { totalStudents: 0, grades: [] };
  }

  async createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup> {
    const targetAudienceId = await this.insertCampaignTargetAudience(payload);
    return {
      id: targetAudienceId,
      name: payload.name || 'Saved audience group',
      programId: payload.programId,
      isAllSchools: payload.isAllSchools,
      isAllGrades: payload.isAllGrades,
      schoolIds: payload.isAllSchools ? [] : payload.schoolIds,
      gradeIds: payload.isAllGrades ? [] : payload.gradeIds,
    };
  }

  async createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const createdAudienceForCampaign = !payload.savedAudienceGroupId;
    const targetAudienceId =
      payload.savedAudienceGroupId ||
      (await this.insertCampaignTargetAudience(payload));

    const campaignInsert = {
      program_id: payload.programId,
      target_audience_id: targetAudienceId,
      name: payload.campaignName,
      objective: payload.objective,
      target_type: payload.targetType ?? null,
      target_value: payload.targetValue ?? null,
      manager_id: payload.managerId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      frequency: payload.frequency,
      rewards: payload.rewards ? JSON.stringify(payload.rewards) : null,
    };

    const { data, error } = await this.supabase
      .from('campaign')
      .insert(campaignInsert)
      .select('id')
      .single();

    if (error) {
      logger.error('Error creating campaign setup:', error);
      if (createdAudienceForCampaign) {
        await this.deleteCampaignTargetAudience(targetAudienceId);
      }
      throw error;
    }

    return {
      campaignId: String(data.id),
      targetAudienceId,
    };
  }

  async launchCampaign(payload: LaunchCampaignPayload): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    const supabase = this.supabase;
    if (!payload.campaignId) {
      throw new Error('Campaign id is required.');
    }
    if (!payload.currentUserId) {
      throw new Error('Current user id is required.');
    }
    if (!payload.rewards?.type || !payload.rewards?.rules?.length) {
      throw new Error('Campaign rewards are required.');
    }
    const requiresAssignments =
      payload.objective !== CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY;

    if (requiresAssignments && payload.assignments.length === 0) {
      throw new Error('Campaign assignments are required.');
    }
    if (payload.messagingRows.length === 0) {
      throw new Error('Campaign communication is required.');
    }

    if (requiresAssignments) {
      if (
        payload.assignments.some(
          (assignment) =>
            !assignment.gradeId || assignment.schoolIds.length === 0,
        )
      ) {
        throw new Error('Campaign assignment schools and grades are required.');
      }

      const assignmentChunks = chunkCampaignAssignmentTargets(
        payload.assignments,
      );
      const invokeAssignmentFunction = (body: Record<string, unknown>) =>
        supabase.functions.invoke('create-campaign-assignments', {
          body: { campaignId: payload.campaignId, ...body },
        });

      const { error: resetError } = await invokeAssignmentFunction({
        action: 'reset',
      });
      if (resetError) {
        logger.error('Error resetting campaign assignments:', resetError);
        throw resetError;
      }

      const insertedCounts = Array<number>(assignmentChunks.length).fill(0);
      const workerCount = Math.min(
        CAMPAIGN_ASSIGNMENT_FUNCTION_CONCURRENCY,
        assignmentChunks.length,
      );
      const workerResults = await Promise.allSettled(
        Array.from({ length: workerCount }, async (_, workerIndex) => {
          for (
            let chunkIndex = workerIndex;
            chunkIndex < assignmentChunks.length;
            chunkIndex += workerCount
          ) {
            const { data, error } = await invokeAssignmentFunction({
              action: 'insert',
              assignments: assignmentChunks[chunkIndex],
            });
            if (error) throw error;
            insertedCounts[chunkIndex] = Number(
              (data as { insertedCount?: number } | null)?.insertedCount ?? 0,
            );
          }
        }),
      );
      const failedWorker = workerResults.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );
      if (failedWorker) {
        const { error: cleanupError } = await invokeAssignmentFunction({
          action: 'cleanup',
        });
        if (cleanupError) {
          logger.error(
            'Failed to clean up incomplete campaign assignments:',
            cleanupError,
          );
        }
        logger.error(
          'Error creating campaign assignments:',
          failedWorker.reason,
        );
        throw failedWorker.reason;
      }

      const insertedCount = insertedCounts.reduce(
        (total, count) => total + count,
        0,
      );
      if (!insertedCount) {
        throw new Error(
          'No classes found for the selected campaign assignments.',
        );
      }
    }

    const messagingRows = payload.messagingRows.map((row) => ({
      campaign_id: payload.campaignId,
      message_time: row.messageTime,
      poll_time: row.pollTime,
      message: row.message,
      media_link: row.mediaLink,
      poll: row.poll,
      message_status: 'pending',
      poll_status: 'pending',
      is_deleted: false,
    }));

    const { error: messagingInsertError } = await supabase
      .from('campaign_messaging')
      .insert(messagingRows);

    if (messagingInsertError) {
      logger.error('Error inserting campaign messaging:', messagingInsertError);
      throw messagingInsertError;
    }
  }
}
