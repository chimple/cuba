import {
  CAMPAIGN_REWARD_LOG_KEYWORD,
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
import logger from '../../../utility/logger';
import { showCampaignCertificate } from '../../../components/campaignCertificate';
import type { CampaignCertificateRank } from '../../../components/campaignCertificate';

// Keep campaign configuration fetches lightweight by limiting them to once per day.
const CAMPAIGN_LAST_FETCH_PREFIX = 'campaignLastFetch:';
const CAMPAIGN_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

type LocalCampaignRow = {
  id: string;
  name: string;
  rules_json: string;
  start_date: string;
  end_date: string;
  status: string;
  updated_at: string;
  is_deleted: number;
};

type CampaignRewardRule = { rank: 1 | 2 | 3; min: number; reward?: string };

// Parse the stored campaign rules defensively so malformed admin data cannot break lesson completion.
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

  /** Delegates incremental campaign configuration fetching to Supabase. */
  async getActiveCampaigns(
    studentId: string,
    lastFetchTimestamp?: string | null,
  ) {
    return await this._serverApi.getActiveCampaigns(
      studentId,
      lastFetchTimestamp,
    );
  }

  /** Delegates reward outcome persistence to Supabase while retaining local evaluation. */
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

  // Pull campaign changes, persist them locally, then rebuild cached outcomes after reinstall.
  async syncCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const storageKey = `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}`;
    const lastFetch = localStorage.getItem(storageKey);
    const lastFetchMs = lastFetch ? Date.parse(lastFetch) : 0;
    logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} sync started`, {
      studentId,
      lastFetch,
    });

    if (!lastFetchMs || Date.now() - lastFetchMs >= CAMPAIGN_SYNC_INTERVAL_MS) {
      const changes = await this._serverApi.getActiveCampaigns(
        studentId,
        lastFetch,
      );
      logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} changes received`, {
        studentId,
        count: changes?.length ?? 0,
      });
      for (const change of changes ?? []) {
        if (change.change_type === 'delete') {
          // Soft-delete locally so old reward history remains available to the Rewards page.
          await this.executeQuery(
            'UPDATE local_campaigns SET is_deleted = 1, status = ? WHERE id = ?',
            ['inactive', change.campaign_id],
          );
          logger.info(
            `${CAMPAIGN_REWARD_LOG_KEYWORD} campaign marked deleted`,
            {
              studentId,
              campaignId: change.campaign_id,
            },
          );
          continue;
        }
        // Upsert the server configuration so evaluation remains fully offline between fetches.
        await this.executeQuery(
          `INSERT OR REPLACE INTO local_campaigns
            (id, name, rules_json, start_date, end_date, status, updated_at, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            change.campaign_id,
            change.campaign_name,
            JSON.stringify(change.rules_json ?? {}),
            change.start_date,
            change.end_date,
            change.campaign_status,
            change.updated_at ?? change.created_at ?? new Date().toISOString(),
          ],
        );
        logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} campaign stored locally`, {
          studentId,
          campaignId: change.campaign_id,
          status: change.campaign_status,
        });
      }
      localStorage.setItem(storageKey, new Date().toISOString());
    }

    await this.hydrateCampaignRewards(studentId);
    logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} sync completed`, { studentId });
  }

  // Hydrate every campaign against local results; this is the reinstall/recovery path.
  async hydrateCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const result = await this.executeQuery(
      'SELECT * FROM local_campaigns WHERE is_deleted = 0',
    );
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      await this.evaluateCampaignReward(campaign, studentId, false);
    }
  }

  // Evaluate only active campaigns after a lesson so a newly earned certificate appears immediately.
  async evaluateCampaignRewardsAfterLesson(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const result = await this.executeQuery(
      `SELECT * FROM local_campaigns
       WHERE is_deleted = 0 AND status = 'active'
         AND start_date <= ? AND end_date >= ?`,
      [now, now],
    );
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      await this.evaluateCampaignReward(campaign, studentId, true);
    }
  }

  // Rewards UI reads this cache instead of running campaign aggregation queries during render.
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

  // Evaluate completion, persist the outcome, sync it to Supabase, and emit a certificate event once.
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
    const totalLessons = Number(metrics.total_lessons ?? 0);
    const completedLessons = Number(metrics.completed_lessons ?? 0);
    const completion = totalLessons
      ? (completedLessons / totalLessons) * 100
      : 0;
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
    logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} campaign evaluated`, {
      campaignId: campaign.id,
      studentId,
      totalLessons,
      completedLessons,
      completion,
      rank,
      status,
    });
    const evaluatedAt = now.toISOString();
    const existingResult = await this.executeQuery(
      `SELECT status, rank_achieved FROM user_campaign_rewards
       WHERE campaign_id = ? AND student_id = ? LIMIT 1`,
      [campaign.id, studentId],
    );
    const existing = existingResult?.values?.[0] as
      | { status?: string; rank_achieved?: number | null }
      | undefined;
    const isNewWin = status === 'won' && existing?.status !== 'won';

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
        // Keep the local result when offline; the next sync can retry the Supabase write.
        logger.error(
          `${CAMPAIGN_REWARD_LOG_KEYWORD} reward sync deferred; keeping local result`,
          error,
        );
      }
    }

    if (showCertificate && isNewWin) {
      // The host renders the existing certificate modal and handles confetti, audio, and sharing.
      logger.info(`${CAMPAIGN_REWARD_LOG_KEYWORD} certificate event emitted`, {
        campaignId: campaign.id,
        studentId,
        rank,
      });
      showCampaignCertificate({
        campaignId: campaign.id,
        campaignName: campaign.name,
        // Pass the active child name for analytics/share context while keeping the artwork clean.
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
