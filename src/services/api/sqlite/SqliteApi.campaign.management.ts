import {
  RESULT_STATUS,
  AssignmentSource,
  TabType,
} from '../../../common/constants';
import { CampaignSetupOptions } from '../ServiceApi';
import { SqliteApiCampaignRewards } from './SqliteApi.campaign.rewards';
import { PaginatedResponse } from '../../../interface/modelInterfaces';
import {
  CampaignCancellationDetails,
  CampaignListingItem,
  CampaignListingParams,
} from '../ServiceApi';
import {
  CampaignAudienceOptions,
  CampaignAudiencePayload,
  CampaignAudienceSummary,
  CampaignAudienceSummaryParams,
  CampaignSavedAudienceGroup,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
} from '../ServiceApi';
import {
  CampaignAssignmentFilters,
  CampaignAssignmentOptions,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentsResponse,
  CampaignOption,
} from '../ServiceApi';
import {
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  UpdateCampaignMessagingRowPayload,
} from '../ServiceApi';
import {
  CampaignAssignmentsReportParams,
  CampaignAssignmentsReportResponse,
  CampaignDashboardMetric,
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
  CampaignSchoolPerformanceReportParams,
  CampaignSchoolPerformanceReportResponse,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignWhatsappLabelData,
} from '../ServiceApi';
import type { CampaignNotificationPayload } from '../ServiceApi';
import type { CampaignActiveChange, CampaignGoalProgress } from '../ServiceApi';
import logger from '../../../utility/logger';

export class SqliteApiCampaignManagement extends SqliteApiCampaignRewards {
  [key: string]: any;

  async getActiveCampaigns(
    studentId: string,
    lastFetchTimestamp?: string | null,
  ): Promise<CampaignActiveChange[]> {
    return await this._serverApi.getActiveCampaigns(
      studentId,
      lastFetchTimestamp,
    );
  }

  async getActiveCampaignGoalProgress(
    studentId = this.currentStudent?.id,
    courseId?: string,
    assignmentIds: string[] = [],
  ): Promise<CampaignGoalProgress | null> {
    if (!studentId || !courseId || !assignmentIds.length) return null;
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const assignmentPlaceholders = assignmentIds.map(() => '?').join(', ');
    try {
      const result = await this.executeQuery(
        `WITH current_course AS (
           SELECT id FROM course
           WHERE id = ? AND COALESCE(is_deleted, 0) = 0
         )
         SELECT a.campaign_id,
           COUNT(DISTINCT a.id) AS total,
           COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.id END) AS current
         FROM assignment a
         JOIN current_course course ON a.course_id = course.id
         LEFT JOIN result r
           ON r.assignment_id = a.id AND r.student_id = ? AND r.is_deleted = 0
          AND COALESCE(r.status, '') <> ?
         WHERE a.campaign_id IS NOT NULL
           AND a.source = ? AND COALESCE(a.is_deleted, 0) = 0
           AND a.id IN (${assignmentPlaceholders})
           AND a.starts_at <= ? AND (a.ends_at IS NULL OR a.ends_at >= ?)
           AND (
             (a.is_class_wise = 1 AND EXISTS (
               SELECT 1 FROM class_user cu
               WHERE cu.class_id = a.class_id AND cu.user_id = ? AND cu.is_deleted = 0
             ))
             OR EXISTS (
               SELECT 1 FROM assignment_user au
               WHERE au.assignment_id = a.id AND au.user_id = ? AND au.is_deleted = 0
             )
           )
         GROUP BY a.campaign_id
         ORDER BY MIN(COALESCE(a.ends_at, '9999-12-31T23:59:59.999Z')), a.campaign_id
         LIMIT 1`,
        [
          courseId,
          studentId,
          RESULT_STATUS.SYSTEM_EXIT,
          AssignmentSource.CAMPAIGN,
          ...assignmentIds,
          now,
          now,
          studentId,
          studentId,
        ],
      );
      const row = result?.values?.[0] as
        | {
            campaign_id: string;
            current: number | string;
            total: number | string;
          }
        | undefined;
      if (!row) return null;
      const current = Number(row.current);
      const total = Number(row.total);
      return Number.isFinite(current) && Number.isFinite(total) && total > 0
        ? { campaignId: row.campaign_id, current, total }
        : null;
    } catch (error) {
      logger.warn('Local assignment progress unavailable', error);
      return null;
    }
  }

  async upsertCampaignStudentReward(payload: {
    campaignId: string;
    studentId: string;
    rankAchieved: number | null;
    status: 'won' | 'missed' | 'in_progress';
    evaluatedAt?: string;
  }): Promise<void> {
    return await this._serverApi.upsertCampaignStudentReward(payload);
  }

  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    return await this._serverApi.getProgramFilterOptions();
  }

  async getPrograms(params: {
    currentUserId?: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }) {
    return await this._serverApi.getPrograms(params);
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    return await this._serverApi.getProgramManagers();
  }

  async getCampaignSetupOptions(): Promise<CampaignSetupOptions> {
    return await this._serverApi.getCampaignSetupOptions();
  }

  async getCampaignNotificationLabels(): Promise<string[]> {
    return await this._serverApi.getCampaignNotificationLabels();
  }

  async uploadPushNotificationImage(file: File): Promise<string> {
    return await this._serverApi.uploadPushNotificationImage(file);
  }

  async sendCampaignNotification(
    payload: CampaignNotificationPayload,
  ): Promise<string> {
    return await this._serverApi.sendCampaignNotification(payload);
  }

  async getCampaignListing(
    params: CampaignListingParams,
  ): Promise<PaginatedResponse<CampaignListingItem>> {
    return await this._serverApi.getCampaignListing(params);
  }

  async cancelCampaign(campaignId: string, reason: string): Promise<void> {
    return await this._serverApi.cancelCampaign(campaignId, reason);
  }

  async getCampaignCancellationDetails(
    campaignId: string,
  ): Promise<CampaignCancellationDetails | null> {
    return await this._serverApi.getCampaignCancellationDetails(campaignId);
  }

  async getCampaignAudienceOptions(
    programId: string,
    programModel?: string,
  ): Promise<CampaignAudienceOptions> {
    return await this._serverApi.getCampaignAudienceOptions(
      programId,
      programModel,
    );
  }

  async getCampaignAudienceSummary(
    params: CampaignAudienceSummaryParams,
  ): Promise<CampaignAudienceSummary> {
    return await this._serverApi.getCampaignAudienceSummary(params);
  }

  async createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup> {
    return await this._serverApi.createCampaignAudienceGroup(payload);
  }

  async createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult> {
    return await this._serverApi.createCampaignSetup(payload);
  }

  async launchCampaign(payload: LaunchCampaignPayload): Promise<void> {
    return await this._serverApi.launchCampaign(payload);
  }

  async getCampaignAssignmentOptions(
    params: CampaignAssignmentOptionsParams,
  ): Promise<CampaignAssignmentOptions> {
    return await this._serverApi.getCampaignAssignmentOptions(params);
  }

  async getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse> {
    return await this._serverApi.getCampaignAssignments(campaignId, filters);
  }

  async getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]> {
    return await this._serverApi.getCampaignSubjectsByCampaignId(campaignId);
  }

  async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<CampaignOption[]> {
    return await this._serverApi.getCampaignGradesForSchools(schoolIds);
  }

  async getCampaignMessaging(
    campaignId: string,
    params?: CampaignMessagingQueryParams,
  ): Promise<CampaignMessagingResponse> {
    return await this._serverApi.getCampaignMessaging(campaignId, params);
  }

  async updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean> {
    return await this._serverApi.updateCampaignMessaging(rows);
  }

  async getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>> {
    return await this._serverApi.getCampaignListingMetrics(campaignIds);
  }

  async deleteCampaignAssignments(campaignId: string): Promise<void> {
    return await this._serverApi.deleteCampaignAssignments(campaignId);
  }

  async getCampaignRewardsReport(
    campaignId: string,
    params?: CampaignRewardsReportParams,
  ): Promise<CampaignRewardsReportResponse> {
    return await this._serverApi.getCampaignRewardsReport(campaignId, params);
  }

  async getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData> {
    return await this._serverApi.getCampaignWhatsappLabelData(campaignId);
  }

  async getCampaignMessageReport(
    campaignId: string,
    params?: CampaignMessageReportParams,
  ): Promise<CampaignMessageReportResponse> {
    return await this._serverApi.getCampaignMessageReport(campaignId, params);
  }

  async getCampaignAssignmentsReport(
    campaignId: string,
    params?: CampaignAssignmentsReportParams,
  ): Promise<CampaignAssignmentsReportResponse> {
    return await this._serverApi.getCampaignAssignmentsReport(
      campaignId,
      params,
    );
  }

  async getCampaignSchoolPerformanceReport(
    campaignId: string,
    params?: CampaignSchoolPerformanceReportParams,
  ): Promise<CampaignSchoolPerformanceReportResponse> {
    return await this._serverApi.getCampaignSchoolPerformanceReport(
      campaignId,
      params,
    );
  }
}
