import { TABLES } from '../../../common/constants';
import {
  buildCampaignMessageReport,
  type CampaignMessagingProviderSource,
} from '../../../ops-console/components/campaignsOverview/CampaignReports_Messages/CampaignMessageReport.helpers';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import {
  CampaignAssignmentsReportParams,
  CampaignAssignmentsReportResponse,
  CampaignDashboardMetric,
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
  CampaignSchoolPerformanceReportParams,
  CampaignSchoolPerformanceReportResponse,
  CampaignSchoolPerformanceReportRow,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignWhatsappLabelData,
} from '../ServiceApi';
import {
  CAMPAIGN_REACH_METRIC_WINDOW,
  chunkArray,
  fetchCampaignProviderData,
  firstOrSelf,
  type CampaignClassGradeRow,
  type CampaignGradeRow,
  type CampaignSchoolCourseGradeRow,
  type CampaignWhatsappGroupTarget,
} from './SupabaseApi.campaign.helpers';
import { SupabaseApiCampaignMessaging } from './SupabaseApi.campaign.messaging';

export interface SupabaseApiCampaignReports {}

/**
 * Campaign school metrics are persisted with the campaign id in metric_window
 * so both 7-day and campaign-day views can resolve from the same row set later.
 */
const buildCampaignSchoolMetricWindow = (
  campaignId: string,
  _metricWindow: '7d' | 'campaign_days',
) => campaignId;

export class SupabaseApiCampaignReports extends SupabaseApiCampaignMessaging {
  async getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>> {
    if (!this.supabase || campaignIds.length === 0) {
      return new Map();
    }

    try {
      const { data: metricsData, error: metricsError } =
        await this.supabase.rpc('get_campaign_dashboard_metrics', {
          p_campaign_ids: campaignIds,
        });

      if (metricsError) {
        logger.error(
          'Error fetching campaign dashboard metrics for listing:',
          metricsError,
        );
        return new Map();
      }

      return new Map(
        ((metricsData ?? []) as CampaignDashboardMetric[]).map((metric) => [
          metric.campaign_id,
          metric,
        ]),
      );
    } catch (metricsError) {
      logger.error(
        'Unexpected error fetching campaign dashboard metrics for listing:',
        metricsError,
      );
      return new Map();
    }
  }

  async deleteCampaignAssignments(campaignId: string): Promise<void> {
    if (!this.supabase || !campaignId) {
      return;
    }

    const nowIso = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLES.Assignment)
      .update({
        is_deleted: true,
        ends_at: nowIso,
        updated_at: nowIso,
      })
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false)
      .gte('starts_at', nowIso);

    if (error) {
      logger.error('Error deleting campaign assignments:', error);
      throw error;
    }
  }

  async getCampaignRewardsReport(
    campaignId: string,
    params: CampaignRewardsReportParams = {},
  ): Promise<CampaignRewardsReportResponse> {
    if (!this.supabase || !campaignId) {
      return { rows: [], total: 0 };
    }

    const sortColumnByKey: Record<
      NonNullable<CampaignRewardsReportParams['orderBy']>,
      string
    > = {
      studentName: 'student_name',
      school: 'school_name',
      className: 'class_name',
      completionPercent: 'completion_percentage',
      rewardRank: 'rank',
      rewardLabel: 'rank',
    };
    const orderBy = params.orderBy ?? 'completionPercent';
    const sortColumn = sortColumnByKey[orderBy] ?? 'completion_percentage';
    const ascending = params.order === 'asc';

    let query = this.supabase
      .from(TABLES.CampaignStudentPerformance)
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false);

    if (params.schoolName && params.schoolName !== 'All Schools') {
      query = query.eq('school_name', params.schoolName);
    }

    if (params.className && params.className !== 'All Classes') {
      query = query.eq('class_name', params.className);
    }

    const { data, error, count } = await query
      .order(sortColumn, { ascending, nullsFirst: false })
      .order('rank', { ascending: true, nullsFirst: false })
      .order('completion_percentage', { ascending: false })
      .order('student_name', { ascending: true });

    if (error) {
      logger.error('Error fetching campaign rewards report:', {
        campaignId,
        params,
        error,
      });
      return { rows: [], total: 0 };
    }

    return {
      rows: data ?? [],
      total: count ?? data?.length ?? 0,
    };
  }

  async getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData> {
    if (!this.supabase || !campaignId.trim()) {
      return { chats: [], total: 0, label: '', providerErrors: 0 };
    }
    const context = await this.getCampaignWhatsappReportContext(
      campaignId.trim(),
    );
    return (
      await fetchCampaignProviderData(campaignId.trim(), context.groupTargets)
    ).labelData;
  }

  async getCampaignMessageReport(
    campaignId: string,
    params: CampaignMessageReportParams = {},
  ): Promise<CampaignMessageReportResponse> {
    if (!this.supabase || !campaignId.trim()) {
      throw new Error('A campaign ID is required for the message report.');
    }
    if (params.fromDate && params.toDate && params.fromDate > params.toDate) {
      throw new Error('From Date cannot be later than To Date.');
    }

    const normalizedCampaignId = campaignId.trim();
    const context =
      await this.getCampaignWhatsappReportContext(normalizedCampaignId);
    const [providerData, metricsResult, messagingResult] = await Promise.all([
      fetchCampaignProviderData(normalizedCampaignId, context.groupTargets),
      this.supabase
        .from(TABLES.SchoolMetrics)
        .select('parents_in_group')
        .in('school_id', context.schoolIds)
        .eq('metric_window', CAMPAIGN_REACH_METRIC_WINDOW)
        .eq('is_deleted', false),
      this.supabase
        .from('campaign_messaging')
        .select('id, message, message_time, poll, poll_time')
        .eq('campaign_id', normalizedCampaignId)
        .eq('is_deleted', false),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (messagingResult.error) throw messagingResult.error;

    const whatsappGroups = context.groupTargets.length;
    const totalMembersReachable = (metricsResult.data ?? []).reduce(
      (total, row) => total + (row.parents_in_group ?? 0),
      0,
    );
    const messagingRows: CampaignMessagingProviderSource[] = (
      messagingResult.data ?? []
    ).map((row) => ({
      id: row.id,
      message: row.message,
      messageTime: row.message_time,
      poll: row.poll,
      pollTime: row.poll_time,
    }));

    return buildCampaignMessageReport(
      providerData,
      messagingRows,
      whatsappGroups,
      totalMembersReachable,
      params,
    );
  }

  public async getCampaignWhatsappReportContext(campaignId: string): Promise<{
    groupTargets: CampaignWhatsappGroupTarget[];
    schoolIds: string[];
  }> {
    if (!this.supabase) return { groupTargets: [], schoolIds: [] };
    const { data: campaign, error: campaignError } = await this.supabase
      .from('campaign')
      .select('program_id, target_audience_id')
      .eq('id', campaignId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign?.program_id || !campaign.target_audience_id) {
      throw new Error('Campaign audience is not configured.');
    }

    const { data: audience, error: audienceError } = await this.supabase
      .from('campaign_target_audience')
      .select('is_all_schools, is_all_grades')
      .eq('id', campaign.target_audience_id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (audienceError) throw audienceError;
    if (!audience) throw new Error('Campaign audience is not configured.');
    const isAllSchools = audience.is_all_schools ?? true;
    const isAllGrades = audience.is_all_grades ?? false;

    let selectedSchoolIds: string[] = [];
    if (!isAllSchools) {
      const { data, error } = await this.supabase
        .from('campaign_target_audience_school')
        .select('school_id')
        .eq('target_audience_id', campaign.target_audience_id)
        .eq('is_deleted', false);
      if (error) throw error;
      selectedSchoolIds = (data ?? []).flatMap(({ school_id }) =>
        school_id ? [school_id] : [],
      );
    }

    let schoolsQuery = this.supabase
      .from('school')
      .select('id, whatsapp_bot_number')
      .eq('program_id', campaign.program_id)
      .eq('is_deleted', false);
    if (!isAllSchools) {
      if (selectedSchoolIds.length === 0) {
        return { groupTargets: [], schoolIds: [] };
      }
      schoolsQuery = schoolsQuery.in('id', selectedSchoolIds);
    }
    const { data: schools, error: schoolsError } = await schoolsQuery;
    if (schoolsError) throw schoolsError;

    const schoolIds = (schools ?? []).map(({ id }) => id);
    if (schoolIds.length === 0) return { groupTargets: [], schoolIds: [] };

    let selectedGradeIds: string[] = [];
    if (!isAllGrades) {
      const { data, error } = await this.supabase
        .from('campaign_target_audience_grade')
        .select('grade_id')
        .eq('target_audience_id', campaign.target_audience_id)
        .eq('is_deleted', false);
      if (error) throw error;
      selectedGradeIds = (data ?? []).flatMap(({ grade_id }) =>
        grade_id ? [grade_id] : [],
      );
      if (selectedGradeIds.length === 0) {
        return { groupTargets: [], schoolIds };
      }
    }

    let classesQuery = this.supabase
      .from('class')
      .select('group_id, name, school_id')
      .in('school_id', schoolIds)
      .eq('is_deleted', false)
      .or('status.is.null,status.neq.migrated')
      .not('group_id', 'is', null);
    if (!isAllGrades) {
      classesQuery = classesQuery.in('grade_id', selectedGradeIds);
    }
    const { data: classes, error: classesError } = await classesQuery;
    if (classesError) throw classesError;

    const botNumberBySchoolId = new Map(
      (schools ?? []).flatMap(({ id, whatsapp_bot_number }) => {
        const botNumber = whatsapp_bot_number?.trim();
        return botNumber ? [[id, botNumber] as const] : [];
      }),
    );
    const groupTargets = Array.from(
      new Map(
        (classes ?? []).flatMap(({ group_id, name, school_id }) => {
          const groupId = group_id?.trim();
          const botNumber = botNumberBySchoolId.get(school_id);
          return groupId && botNumber
            ? [[groupId, { botNumber, groupId, name }] as const]
            : [];
        }),
      ).values(),
    );

    return {
      groupTargets,
      schoolIds,
    };
  }

  async getCampaignAssignmentsReport(
    campaignId: string,
    params: CampaignAssignmentsReportParams = {},
  ): Promise<CampaignAssignmentsReportResponse> {
    const emptyResponse: CampaignAssignmentsReportResponse = {
      summary: {
        totalAssignments: 0,
        assignedStudents: params.totalStudents ?? 0,
        activeStudents: 0,
        averageAssignmentsCompletion: 0,
      },
      rows: [],
    };

    if (!this.supabase || !campaignId) {
      return emptyResponse;
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_campaign_assignments_report',
        {
          p_campaign_id: campaignId,
          p_total_students: params.totalStudents ?? 0,
        },
      );

      if (error) {
        logger.error('Error fetching campaign assignments report rpc:', {
          campaignId,
          params,
          error,
        });
        return emptyResponse;
      }

      const payload =
        data as Database['public']['Functions']['get_campaign_assignments_report']['Returns'];

      return {
        summary: {
          totalAssignments: payload?.summary?.totalAssignments ?? 0,
          assignedStudents:
            payload?.summary?.assignedStudents ?? params.totalStudents ?? 0,
          activeStudents: payload?.summary?.activeStudents ?? 0,
          averageAssignmentsCompletion:
            payload?.summary?.averageAssignmentsCompletion ?? 0,
        },
        rows: payload?.rows ?? [],
      };
    } catch (error) {
      logger.error('Exception fetching campaign assignments report rpc:', {
        campaignId,
        params,
        error,
      });
      return emptyResponse;
    }
  }

  /**
   * Reads the stored campaign school metrics row and returns only the fields
   * needed by the report UI. Presentation math stays outside the API layer.
   */
  async getCampaignSchoolPerformanceReport(
    campaignId: string,
    params: CampaignSchoolPerformanceReportParams = {},
  ): Promise<CampaignSchoolPerformanceReportResponse> {
    const emptyResponse: CampaignSchoolPerformanceReportResponse = { rows: [] };

    if (!this.supabase || !campaignId.trim()) {
      return emptyResponse;
    }

    const metricWindow = params.metricWindow ?? '7d';

    try {
      const { data, error } = await this.supabase
        .from(TABLES.SchoolMetrics)
        .select('*')
        .eq(
          'metric_window',
          buildCampaignSchoolMetricWindow(campaignId.trim(), metricWindow),
        )
        .eq('is_deleted', false)
        .order('school_name', { ascending: true });

      if (error) {
        logger.error('Error fetching campaign school performance report:', {
          campaignId,
          metricWindow,
          error,
        });
        return emptyResponse;
      }

      const rows = (data ?? []).map<CampaignSchoolPerformanceReportRow>(
        (row) => {
          return {
            schoolId: row.school_id ?? '',
            schoolName: row.school_name ?? '',
            udise: row.udise ?? null,
            block: row.block ?? null,
            activeStudents: row.active_students ?? 0,
            activatedStudents: row.activated_students ?? 0,
            activeStudentsHomework: row.active_students_homework ?? 0,
            activeStudentsLearningPathway:
              row.active_students_learning_pathway ?? 0,
            avgTimeSpent: Number(row.avg_time_spent ?? 0),
            avgActivitiesCompleted: Number(row.avg_activities_completed ?? 0),
          };
        },
      );

      return { rows };
    } catch (error) {
      logger.error(
        'Exception fetching campaign school performance report:',
        error,
      );
      return emptyResponse;
    }
  }

  private async fetchDistinctClassGradesForSchools(
    schoolIds: string[],
  ): Promise<{ id: string; name: string }[]> {
    if (!this.supabase || schoolIds.length === 0) return [];

    const { data: gradeRows, error: gradeError } = await this.supabase
      .from('grade')
      .select('id, name, sort_index, class!inner()')
      .in('class.school_id', schoolIds)
      .eq('class.is_deleted', false)
      .eq('is_deleted', false);

    if (gradeError) {
      logger.error('Error fetching school grades for campaign:', gradeError);
    }

    return ((gradeRows ?? []) as CampaignGradeRow[])
      .filter((grade) => grade.id && grade.name)
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.name).localeCompare(String(b.name)),
      )
      .map((grade) => ({
        id: String(grade.id),
        name: String(grade.name),
      }));
  }

  private async getCampaignAudienceOptionGradesForSchools(
    schoolIds: string[],
  ): Promise<{ id: string; name: string }[]> {
    if (!this.supabase || schoolIds.length === 0) return [];

    const gradeMap = new Map<
      string,
      { id: string; name: string; sort: number }
    >();

    const { data: classRows, error: classError } = await this.supabase
      .from('class')
      .select('grade_id, grade:grade_id(id, name, sort_index)')
      .in('school_id', schoolIds)
      .eq('is_deleted', false)
      .not('grade_id', 'is', null);

    if (classError) {
      logger.error('Error fetching class grades for campaign:', classError);
    }

    ((classRows ?? []) as CampaignClassGradeRow[]).forEach((row) => {
      const grade = firstOrSelf(row.grade);
      if (!grade?.id || !grade?.name) return;
      gradeMap.set(String(grade.id), {
        id: String(grade.id),
        name: String(grade.name),
        sort: Number(grade.sort_index ?? 9999),
      });
    });

    for (const schoolIdBatch of chunkArray(schoolIds, 500)) {
      const { data: schoolCourseRows, error: schoolCourseError } =
        await this.supabase
          .from('school_course')
          .select(
            'course:course_id(grade_id, grade:grade_id(id, name, sort_index))',
          )
          .in('school_id', schoolIdBatch)
          .eq('is_deleted', false);

      if (schoolCourseError) {
        logger.error(
          'Error fetching school course grades for campaign:',
          schoolCourseError,
        );
        continue;
      }

      ((schoolCourseRows ?? []) as CampaignSchoolCourseGradeRow[]).forEach(
        (row) => {
          const course = firstOrSelf(row.course);
          const grade = firstOrSelf(course?.grade);
          if (!grade?.id || !grade?.name) return;
          gradeMap.set(String(grade.id), {
            id: String(grade.id),
            name: String(grade.name),
            sort: Number(grade.sort_index ?? 9999),
          });
        },
      );
    }

    return Array.from(gradeMap.values())
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
      .map(({ id, name }) => ({ id, name }));
  }
}
