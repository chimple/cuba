import {
  RESULT_STATUS,
  AssignmentSource,
  TabType,
} from '../../../common/constants';
import { CampaignSetupOptions } from '../ServiceApi';
import { SqliteApiAssignmentAssessments } from './SqliteApi.assignment.assessments';
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
import { showCampaignCertificate } from '../../../components/campaignCertificate';
import type { CampaignCertificateRank } from '../../../components/campaignCertificate';
import {
  getEligibleCampaignIds,
  hasEligibleCampaignIds,
  saveEligibleCampaignIds,
} from './campaignRewardEligibility';

const CAMPAIGN_LAST_FETCH_PREFIX = 'campaignLastFetch:';
const CAMPAIGN_SYNC_INTERVAL_MS = 30 * 60 * 1000;
const CAMPAIGN_REWARD_LOG_KEYWORD = '[CAMPAIGN_REWARD]';

type LocalCampaignRow = {
  id: string;
  name: string;
  rules_json: string;
  start_date: string;
  end_date: string;
  status: string;
  objective?: string | null;
  target_type?: string | null;
  target_value?: number | null;
  updated_at: string;
  is_deleted: number;
};

type CampaignRewardRule = { rank: 1 | 2 | 3; min: number; reward?: string };

const parseCampaignRules = (value: string): CampaignRewardRule[] => {
  try {
    const parsed = JSON.parse(value) as { rules?: CampaignRewardRule[] };
    return Array.isArray(parsed?.rules) ? parsed.rules : [];
  } catch {
    return [];
  }
};

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
        `${CAMPAIGN_REWARD_LOG_KEYWORD} local assignment progress unavailable ${error instanceof Error ? error.message : String(error)}`,
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

  async syncCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const storageKey = `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}`;
    const lastFetch = localStorage.getItem(storageKey);
    const lastFetchMs = lastFetch ? Date.parse(lastFetch) : 0;
    logger.warn(
      `${CAMPAIGN_REWARD_LOG_KEYWORD} sync started ${JSON.stringify({ studentId, lastFetch })}`,
    );
    if (!lastFetchMs || Date.now() - lastFetchMs >= CAMPAIGN_SYNC_INTERVAL_MS) {
      const changes = await this.getActiveCampaigns(studentId, lastFetch);
      const eligibleCampaignIds = getEligibleCampaignIds(studentId);
      logger.warn(
        `${CAMPAIGN_REWARD_LOG_KEYWORD} changes received ${JSON.stringify({ studentId, count: changes?.length ?? 0 })}`,
      );
      for (const change of changes ?? []) {
        if (change.change_type === 'delete') {
          eligibleCampaignIds.delete(change.campaign_id);
          logger.warn(
            `${CAMPAIGN_REWARD_LOG_KEYWORD} campaign marked deleted ${JSON.stringify({ studentId, campaignId: change.campaign_id })}`,
          );
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
            change.updated_at ?? change.created_at ?? new Date().toISOString(),
          ],
        );
        logger.warn(
          `${CAMPAIGN_REWARD_LOG_KEYWORD} campaign stored locally ${JSON.stringify({ studentId, campaignId: change.campaign_id, status: change.campaign_status })}`,
        );
      }
      saveEligibleCampaignIds(studentId, eligibleCampaignIds);
      localStorage.setItem(storageKey, new Date().toISOString());
    }

    await this.hydrateCampaignRewards(studentId);
    logger.warn(
      `${CAMPAIGN_REWARD_LOG_KEYWORD} sync completed ${JSON.stringify({ studentId })}`,
    );
  }

  async hydrateCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const result = await this.executeQuery(
      'SELECT * FROM local_campaigns WHERE is_deleted = 0',
    );
    const eligibleCampaignIds = getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleCampaignIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, false);
    }
  }

  async evaluateCampaignRewardsAfterLesson(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    // A child profile can be selected after app startup. Fetch its campaign
    // set once before evaluation so another child's cached campaigns are not used.
    if (!hasEligibleCampaignIds(studentId)) {
      await this.syncCampaignRewards(studentId);
    }
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const result = await this.executeQuery(
      `SELECT * FROM local_campaigns
       WHERE is_deleted = 0 AND status = 'active'
         AND start_date <= ? AND end_date >= ?`,
      [now, now],
    );
    const eligibleCampaignIds = getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleCampaignIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, true);
    }
  }

  async getCachedCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return [];
    await this.ensureInitialized();
    const result = await this.executeQuery(
      `SELECT * FROM user_campaign_rewards
       WHERE student_id = ? AND is_deleted = 0
       ORDER BY evaluated_at DESC`,
      [studentId],
    );
    return result?.values ?? [];
  }

  private async evaluateCampaignReward(
    campaign: LocalCampaignRow,
    studentId: string,
    showCertificate: boolean,
  ): Promise<void> {
    const now = new Date();
    const metricsResult = await this.executeQuery(
      `SELECT
         COUNT(DISTINCT a.lesson_id) AS total_lessons,
         COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.lesson_id END) AS completed_lessons
       FROM assignment a
       LEFT JOIN result r
         ON r.assignment_id = a.id
        AND r.student_id = ?
        AND r.is_deleted = 0
        AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
       WHERE a.campaign_id = ? AND a.is_deleted = 0`,
      [studentId, campaign.id],
    );
    const metrics = metricsResult?.values?.[0] ?? {};
    let totalLessons = Number(metrics.total_lessons ?? 0);
    let completedLessons = Number(metrics.completed_lessons ?? 0);

    if (totalLessons === 0) {
      const resultMetrics = await this.executeQuery(
        `SELECT
           COUNT(DISTINCT r.lesson_id) AS total_lessons,
           COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN r.lesson_id END) AS completed_lessons
         FROM result r
         WHERE r.student_id = ?
           AND r.is_deleted = 0
           AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
           AND r.created_at >= ? AND r.created_at <= ?`,
        [studentId, campaign.start_date, campaign.end_date],
      );
      const fallbackMetrics = resultMetrics?.values?.[0] ?? {};
      totalLessons = Number(fallbackMetrics.total_lessons ?? 0);
      completedLessons = Number(fallbackMetrics.completed_lessons ?? 0);
    }
    const completionPercent = totalLessons
      ? (completedLessons / totalLessons) * 100
      : 0;
    const completion =
      campaign.target_type === 'number_of_lessons'
        ? completedLessons
        : completionPercent;
    const rules = parseCampaignRules(campaign.rules_json).sort(
      (a, b) => b.min - a.min,
    );
    const winningRule = rules.find((rule) => completion >= Number(rule.min));
    const status = winningRule
      ? 'won'
      : now > new Date(campaign.end_date)
        ? 'missed'
        : 'in_progress';
    const rank = winningRule?.rank ?? null;
    logger.warn(
      `${CAMPAIGN_REWARD_LOG_KEYWORD} campaign evaluated ${JSON.stringify({ campaignId: campaign.id, studentId, totalLessons, completedLessons, completion, rank, status })}`,
    );
    const evaluatedAt = now.toISOString();
    const existingResult = await this.executeQuery(
      `SELECT status, rank_achieved FROM user_campaign_rewards
       WHERE campaign_id = ? AND student_id = ? LIMIT 1`,
      [campaign.id, studentId],
    );
    const existing = existingResult?.values?.[0] as
      | { status?: string; rank_achieved?: number | null }
      | undefined;
    const certificateShownKey = `campaignCertificateShown:${studentId}:${campaign.id}:${rank}`;
    const shouldEmitCertificate =
      showCertificate &&
      status === 'won' &&
      !localStorage.getItem(certificateShownKey);

    await this.executeQuery(
      `INSERT OR REPLACE INTO user_campaign_rewards
        (campaign_id, student_id, rank_achieved, status, evaluated_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [campaign.id, studentId, rank, status, evaluatedAt, evaluatedAt],
    );

    if (existing?.status !== status || existing?.rank_achieved !== rank) {
      try {
        await this._serverApi.upsertCampaignStudentReward({
          campaignId: campaign.id,
          studentId,
          rankAchieved: rank,
          status,
          evaluatedAt,
        });
      } catch (error) {
        logger.error(
          `${CAMPAIGN_REWARD_LOG_KEYWORD} reward sync deferred; keeping local result ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (shouldEmitCertificate) {
      logger.warn(
        `${CAMPAIGN_REWARD_LOG_KEYWORD} certificate event emitted ${JSON.stringify({ campaignId: campaign.id, studentId, rank })}`,
      );
      localStorage.setItem(certificateShownKey, evaluatedAt);
      showCampaignCertificate({
        campaignId: campaign.id,
        campaignName: campaign.name,
        studentName: this.currentStudent?.name ?? '',
        schoolId: this.currentSchool?.id,
        rank: rank as CampaignCertificateRank,
        awardedAt: evaluatedAt,
        isNewlyEarned: true,
        studentId,
      });
    }
  }
}
