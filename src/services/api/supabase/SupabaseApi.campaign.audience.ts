import { CAMPAIGN_OBJECTIVE, TABLES } from '../../../common/constants';
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
import {
  chunkArray,
  type CampaignSchoolRow,
} from './SupabaseApi.campaign.helpers';
import { SupabaseApiCampaignListing } from './SupabaseApi.campaign.listing';

export interface SupabaseApiCampaignAudience {
  [key: string]: any;
}
export class SupabaseApiCampaignAudience extends SupabaseApiCampaignListing {
  async getCampaignAudienceOptions(
    programId: string,
  ): Promise<CampaignAudienceOptions> {
    if (!this.supabase || !programId) {
      return { blocks: [], schools: [], grades: [] };
    }

    const { data: schoolRows, error: schoolError } = await this.supabase
      .from('school')
      .select('id, name, group3')
      .eq('program_id', programId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

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
      const schoolIds = Array.from(
        new Set(
          payload.assignments.flatMap((assignment) => assignment.schoolIds),
        ),
      );
      const gradeIds = Array.from(
        new Set(payload.assignments.map((assignment) => assignment.gradeId)),
      );

      if (schoolIds.length === 0 || gradeIds.length === 0) {
        throw new Error('Campaign assignment schools and grades are required.');
      }

      const { data: classRowsData, error: classRowsError } = await this.supabase
        .from(TABLES.Class)
        .select('id, school_id, grade_id')
        .in('school_id', schoolIds)
        .in('grade_id', gradeIds)
        .eq('is_deleted', false);

      if (classRowsError) {
        logger.error(
          'Error resolving campaign assignment classes:',
          classRowsError,
        );
        throw classRowsError;
      }

      const classRows = (classRowsData ?? []) as Array<{
        id: string;
        school_id: string;
        grade_id: string;
      }>;

      const classesBySchoolAndGrade = new Map<
        string,
        Array<{ id: string; school_id: string; grade_id: string }>
      >();
      classRows.forEach((classRow) => {
        const key = `${classRow.school_id}:${classRow.grade_id}`;
        if (!classesBySchoolAndGrade.has(key)) {
          classesBySchoolAndGrade.set(key, []);
        }
        classesBySchoolAndGrade.get(key)?.push(classRow);
      });

      const missingAssignmentTargets = new Set<string>();
      const assignmentRows = payload.assignments.flatMap((assignment) =>
        assignment.schoolIds.flatMap((schoolId) => {
          const classes =
            classesBySchoolAndGrade.get(`${schoolId}:${assignment.gradeId}`) ??
            [];
          if (classes.length === 0) {
            missingAssignmentTargets.add(`${schoolId}:${assignment.gradeId}`);
          }
          return classes.map((classRow) => ({
            campaign_id: payload.campaignId,
            batch_id: payload.campaignId,
            class_id: classRow.id,
            school_id: classRow.school_id,
            lesson_id: assignment.lessonId,
            chapter_id: assignment.chapterId,
            course_id: assignment.courseId,
            starts_at: assignment.startsAt,
            ends_at: assignment.endsAt,
            type: assignment.type,
            source: assignment.source,
            set_number: assignment.setNumber,
            is_class_wise: true,
            created_by: payload.currentUserId,
            is_deleted: false,
          }));
        }),
      );

      if (missingAssignmentTargets.size > 0) {
        logger.warn(
          'Skipping campaign assignments for school/grade pairs without classes:',
          Array.from(missingAssignmentTargets).map((target) => {
            const [schoolId, gradeId] = target.split(':');
            return { schoolId, gradeId };
          }),
        );
      }

      if (assignmentRows.length === 0) {
        throw new Error(
          'No classes found for the selected campaign assignments.',
        );
      }

      for (const assignmentBatch of chunkArray(assignmentRows, 500)) {
        const { error } = await this.supabase
          .from(TABLES.Assignment)
          .insert(assignmentBatch);

        if (error) {
          logger.error('Error inserting campaign assignments:', error);
          throw error;
        }
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

    const { error: messagingInsertError } = await this.supabase
      .from('campaign_messaging')
      .insert(messagingRows);

    if (messagingInsertError) {
      logger.error('Error inserting campaign messaging:', messagingInsertError);
      throw messagingInsertError;
    }
  }
}
