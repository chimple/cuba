import {
  AssignmentSource,
  RESULT_STATUS,
  TabType,
} from '../../../common/constants';

import { PaginatedResponse } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SqliteApiAssignmentAssessments } from './SqliteApi.assignment.assessments';
import {
  CampaignSetupOptions,
  CampaignCancellationDetails,
  CampaignListingItem,
  CampaignListingParams,
  CampaignAudienceOptions,
  CampaignAudiencePayload,
  CampaignAudienceSummary,
  CampaignAudienceSummaryParams,
  CampaignSavedAudienceGroup,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
  CampaignAssignmentFilters,
  CampaignAssignmentOptions,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentsResponse,
  CampaignOption,
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  UpdateCampaignMessagingRowPayload,
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
  CampaignNotificationPayload,
  CampaignActiveChange,
  CampaignGoalProgress,
} from '../ServiceApi';
import {
  getEligibleCampaignIds,
  hasEligibleCampaignIds,
  saveEligibleCampaignIds,
} from './campaignRewardEligibility';
import {
  evaluateCampaignReward,
  type LocalCampaignRow,
} from './campaignRewardEvaluation';
import {
  getCampaignCertificateIndicator,
  markCampaignCertificatesSeen,
} from './campaignRewardCertificates';
const CAMPAIGN_LAST_FETCH_PREFIX = 'campaignLastFetch:';
const CAMPAIGN_SYNC_INTERVAL_MS = 30 * 60 * 1000;
export class SqliteApiCampaignManagement extends SqliteApiAssignmentAssessments {
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
      logger.warn(
        `Campaign local assignment progress unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
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

  async getCampaignNotifications() {
    return await this._serverApi.getCampaignNotifications();
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

  async syncCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return;
    await this.ensureInitialized();
    const storageKey = `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}`;
    const lastFetch = localStorage.getItem(storageKey);
    const lastFetchMs = lastFetch ? Date.parse(lastFetch) : 0;
    if (!lastFetchMs || Date.now() - lastFetchMs >= CAMPAIGN_SYNC_INTERVAL_MS) {
      let changes: CampaignActiveChange[] | undefined;
      try {
        changes = await this.getActiveCampaigns(studentId, lastFetch);
      } catch {}
      if (changes) {
        const eligibleCampaignIds = getEligibleCampaignIds(studentId);
        for (const change of changes) {
          if (change.change_type === 'delete') {
            eligibleCampaignIds.delete(change.campaign_id);
            continue;
          }
          eligibleCampaignIds.add(change.campaign_id);
          await this.executeQuery(
            `INSERT OR REPLACE INTO local_campaigns
              (id, name, rules_json, start_date, end_date, status, objective, target_type, target_value, updated_at, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              change.campaign_id,
              change.campaign_name,
              JSON.stringify(change.rules_json ?? {}),
              change.start_date,
              change.end_date,
              change.campaign_status ?? 'active',
              change.objective ?? null,
              change.target_type ?? null,
              change.target_value ?? null,
              change.updated_at ??
                change.created_at ??
                new Date().toISOString(),
            ],
          );
        }
        saveEligibleCampaignIds(studentId, eligibleCampaignIds);
        localStorage.setItem(storageKey, new Date().toISOString());
      }
    }
    await this.hydrateCampaignRewards(studentId);
    await this.syncCampaignCertificatePopupSeen(studentId);
  }
  async hydrateCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return;
    await this.ensureInitialized();
    const result = await this.executeQuery(
      'SELECT * FROM local_campaigns WHERE is_deleted = 0',
    );
    const eligibleCampaignIds = getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleCampaignIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, true);
    }
  }
  async evaluateCampaignRewardsAfterLesson(
    studentId = this.currentStudent?.id,
  ) {
    if (!studentId) return;
    if (!hasEligibleCampaignIds(studentId)) {
      await this.syncCampaignRewards(studentId);
    }
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const result = await this.executeQuery(
      `SELECT * FROM local_campaigns
       WHERE is_deleted = 0 AND status = 'active'
         AND date(start_date) <= date(?)
         AND date(end_date) >= date(?)`,
      [now, now],
    );
    const eligibleCampaignIds = getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleCampaignIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, false);
    }
  }
  async getCachedCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return [];
    await this.ensureInitialized();
    const result = await this.executeQuery(
      `SELECT r.*, c.name AS campaign_name, c.objective, c.target_value,
              c.start_date, c.end_date
       FROM user_campaign_rewards r
       LEFT JOIN local_campaigns c ON c.id = r.campaign_id
       WHERE r.student_id = ? AND r.is_deleted = 0
       ORDER BY r.evaluated_at DESC`,
      [studentId],
    );
    return result?.values ?? [];
  }
  async getCampaignCertificateIndicator(studentId: string): Promise<{
    hasUnseenCertificate: boolean;
    campaignId?: string;
  }> {
    await this.ensureInitialized();
    return getCampaignCertificateIndicator(
      (statement, values) => this.executeQuery(statement, values),
      studentId,
    );
  }

  async markCampaignCertificatesSeen(studentId: string): Promise<void> {
    await this.ensureInitialized();
    await markCampaignCertificatesSeen(
      (statement, values) => this.executeQuery(statement, values),
      studentId,
    );
  }

  async markCampaignCertificatePopupSeen(
    campaignId: string,
    studentId: string,
  ): Promise<void> {
    await this.ensureInitialized();
    await this.executeQuery(
      `UPDATE user_campaign_rewards
       SET is_certificate_popup_seen = 1, updated_at = ?
       WHERE campaign_id = ? AND student_id = ?`,
      [new Date().toISOString(), campaignId, studentId],
    );
    try {
      await this._serverApi.markCampaignCertificatePopupSeen(
        campaignId,
        studentId,
      );
    } catch (error) {
      logger.warn('Campaign certificate popup seen update deferred', error);
    }
  }

  async getCampaignCertificatePopupSeen(
    campaignId: string,
    studentId: string,
  ): Promise<boolean> {
    return await this._serverApi.getCampaignCertificatePopupSeen(
      campaignId,
      studentId,
    );
  }

  private async syncCampaignCertificatePopupSeen(
    studentId: string,
  ): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const result = await this.executeQuery(
      `SELECT campaign_id FROM user_campaign_rewards
       WHERE student_id = ? AND is_certificate_popup_seen = 1`,
      [studentId],
    );
    for (const reward of result?.values ?? []) {
      const campaignId = reward.campaign_id;
      if (typeof campaignId !== 'string') continue;
      try {
        await this._serverApi.markCampaignCertificatePopupSeen(
          campaignId,
          studentId,
        );
      } catch (error) {
        logger.warn('Campaign certificate popup seen sync deferred', error);
        return;
      }
    }
  }

  private async evaluateCampaignReward(
    campaign: LocalCampaignRow,
    studentId: string,
    showCertificate: boolean,
  ): Promise<void> {
    await evaluateCampaignReward(
      {
        executeQuery: (statement, values) =>
          this.executeQuery(statement, values),
        upsertReward: (reward) =>
          this._serverApi.upsertCampaignStudentReward(reward),
        getCampaignCertificatePopupSeen: (campaignId, currentStudentId) =>
          this._serverApi.getCampaignCertificatePopupSeen(
            campaignId,
            currentStudentId,
          ),
        getStudent: (id) => this.getUserByDocId(id),
        getLanguage: (id) => this.getLanguageWithId(id),
        studentName: this.currentStudent?.name ?? '',
        schoolId: this.currentSchool?.id,
      },
      campaign,
      studentId,
      showCertificate,
    );
  }
}
