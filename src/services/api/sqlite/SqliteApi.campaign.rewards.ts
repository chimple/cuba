import { SqliteApiAssignmentAssessments } from './SqliteApi.assignment.assessments';
import logger from '../../../utility/logger';
import { store } from '../../../redux/store';
import { setCampaignRewardsState } from '../../../redux/slices/campaignRewards/campaignRewardsSlice';
import { showCampaignCertificate } from '../../../components/campaignCertificate';
import type { CampaignCertificateRank } from '../../../components/campaignCertificate';
import {
  getEligibleCampaignIds,
  hasEligibleCampaignIds,
  saveEligibleCampaignIds,
} from './campaignRewardEligibility';
const CAMPAIGN_LAST_FETCH_PREFIX = 'campaignLastFetch:studentScoped:';
const CAMPAIGN_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
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

// Campaign dates are calendar dates. Treat the end date as inclusive by
// using the start of the following UTC day as the exclusive boundary.
const getCampaignEndExclusive = (endDate: string): Date => {
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return end;
  return new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1),
  );
};

const parseCampaignRules = (value: string): CampaignRewardRule[] => {
  try {
    const parsed = JSON.parse(value) as { rules?: CampaignRewardRule[] };
    return Array.isArray(parsed?.rules) ? parsed.rules : [];
  } catch {
    return [];
  }
};

export class SqliteApiCampaignRewards extends SqliteApiAssignmentAssessments {
  protected async onResultSyncCompleted(
    resultRowsChanged: boolean,
  ): Promise<void> {
    if (!resultRowsChanged) return;

    const profiles = await this.getParentStudentProfiles().catch(() => []);
    const studentIds = new Set(
      profiles
        .map((profile) => profile?.id)
        .filter((id): id is string => Boolean(id)),
    );
    if (this.currentStudent?.id) studentIds.add(this.currentStudent.id);

    await Promise.allSettled(
      [...studentIds].map((studentId) =>
        this.hydrateCampaignRewards(studentId).catch(() => undefined),
      ),
    );
  }

  async syncCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return;
    await this.ensureInitialized();
    const storageKey = `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}`;
    const lastFetch = localStorage.getItem(storageKey);
    const lastFetchMs = lastFetch ? Date.parse(lastFetch) : 0;
    if (!lastFetchMs || Date.now() - lastFetchMs >= CAMPAIGN_SYNC_INTERVAL_MS) {
      const changes = await this._serverApi.getActiveCampaigns(
        studentId,
        lastFetch,
      );
      const eligibleCampaignIds = getEligibleCampaignIds(studentId);
      for (const change of changes ?? []) {
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
            change.updated_at ?? change.created_at ?? new Date().toISOString(),
          ],
        );
      }
      saveEligibleCampaignIds(studentId, eligibleCampaignIds);
      localStorage.setItem(storageKey, new Date().toISOString());
    }
    await this.hydrateCampaignRewards(studentId);
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
      await this.evaluateCampaignReward(campaign, studentId, false);
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
         AND start_date <= ?
         AND datetime(end_date, '+1 day') > datetime(?)`,
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
      `SELECT r.*, c.name AS campaign_name, c.objective, c.target_value, c.start_date, c.end_date
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
    const result = await this.executeQuery(
      `SELECT campaign_id FROM user_campaign_rewards
       WHERE student_id = ? AND is_deleted = 0 AND has_unseen_certificate = 1
       ORDER BY evaluated_at DESC LIMIT 1`,
      [studentId],
    );
    const campaignId = result?.values?.[0]?.campaign_id as string | undefined;
    return { hasUnseenCertificate: Boolean(campaignId), campaignId };
  }
  async markCampaignCertificatesSeen(studentId: string): Promise<void> {
    await this.ensureInitialized();
    await this.executeQuery(
      `UPDATE user_campaign_rewards SET has_unseen_certificate = 0, updated_at = ?
       WHERE student_id = ? AND is_deleted = 0 AND has_unseen_certificate = 1`,
      [new Date().toISOString(), studentId],
    );
  }
  private async evaluateCampaignReward(
    campaign: LocalCampaignRow,
    studentId: string,
    showCertificate: boolean,
  ): Promise<void> {
    const now = new Date();
    const campaignEndExclusive = getCampaignEndExclusive(campaign.end_date);
    const isHomepageCampaign =
      campaign.objective === 'homepage_learning_pathway_campaign';
    const metricsResult = isHomepageCampaign
      ? await this.executeQuery(
          `SELECT COUNT(DISTINCT r.lesson_id) AS completed_lessons
           FROM result r
           WHERE r.student_id = ? AND r.is_deleted = 0
             AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
             AND r.source IN ('learning_pathway_home_no_pal', 'learning_pathway_home_pal')
             AND julianday(r.created_at) >= julianday(?)
             AND julianday(r.created_at) < julianday(?)`,
          [studentId, campaign.start_date, campaignEndExclusive.toISOString()],
        )
      : await this.executeQuery(
          `SELECT COUNT(DISTINCT a.lesson_id) AS total_lessons,
             COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.lesson_id END) AS completed_lessons
           FROM assignment a
           LEFT JOIN result r ON r.assignment_id = a.id
             AND r.student_id = ? AND r.is_deleted = 0
             AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
             AND julianday(r.created_at) >= julianday(?)
             AND julianday(r.created_at) < julianday(?)
           WHERE a.campaign_id = ? AND a.is_deleted = 0`,
          [
            studentId,
            campaign.start_date,
            campaignEndExclusive.toISOString(),
            campaign.id,
          ],
        );
    const metrics = metricsResult?.values?.[0] ?? {};
    const completedLessons = Number(metrics.completed_lessons ?? 0);
    const pathwayTarget = Number(campaign.target_value);
    const totalPathways =
      Number.isFinite(pathwayTarget) && pathwayTarget > 0 ? pathwayTarget : 0;
    const completedPathways = Math.floor(completedLessons / 5);
    // Persist lesson units; the popup derives pathway units for homepage campaigns.
    const totalLessons = isHomepageCampaign
      ? totalPathways * 5
      : Number(metrics.total_lessons ?? 0);
    const completionPercent = isHomepageCampaign
      ? totalPathways
        ? Math.min((completedPathways / totalPathways) * 100, 100)
        : 0
      : totalLessons
        ? (completedLessons / totalLessons) * 100
        : 0;
    const completion =
      isHomepageCampaign || campaign.target_type === 'number_of_lessons'
        ? completedLessons
        : completionPercent;
    const rules = parseCampaignRules(campaign.rules_json).sort(
      (a, b) => b.min - a.min,
    );
    const winningRule = rules.find((rule) => completion >= Number(rule.min));
    const participationEligible =
      !winningRule && now >= campaignEndExclusive && completedLessons >= 1;
    const status = winningRule
      ? 'won'
      : now >= campaignEndExclusive
        ? 'missed'
        : 'in_progress';
    const rank = winningRule?.rank ?? null;
    const certificateRank: CampaignCertificateRank =
      winningRule?.rank ??
      (participationEligible ? 'participation' : 'progress');
    const evaluatedAt = now.toISOString();
    const existingResult = await this.executeQuery(
      `SELECT status, rank_achieved, has_unseen_certificate FROM user_campaign_rewards
       WHERE campaign_id = ? AND student_id = ? LIMIT 1`,
      [campaign.id, studentId],
    );
    const existing = existingResult?.values?.[0] as
      | {
          status?: string;
          rank_achieved?: number | null;
          has_unseen_certificate?: boolean | number;
        }
      | undefined;
    const certificateShownKey = `campaignCertificateShown:${studentId}:${campaign.id}:${rank}`;
    const shouldEmitCertificate =
      showCertificate &&
      (status === 'won' || participationEligible) &&
      !localStorage.getItem(certificateShownKey);

    await this.executeQuery(
      `INSERT OR REPLACE INTO user_campaign_rewards
        (campaign_id, student_id, lessons_completed_count, lessons_target_count,
         completion_percentage, certificate_available, rank_achieved, status,
         has_unseen_certificate, evaluated_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        campaign.id,
        studentId,
        completedLessons,
        totalLessons,
        Math.round(completionPercent),
        status === 'won' || participationEligible ? 1 : 0,
        rank,
        status,
        shouldEmitCertificate || Boolean(existing?.has_unseen_certificate)
          ? 1
          : 0,
        evaluatedAt,
        evaluatedAt,
      ],
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
          'Campaign reward sync deferred; keeping local result',
          error,
        );
      }
    }

    if (shouldEmitCertificate) {
      store.dispatch(
        setCampaignRewardsState({
          studentId,
          hasUnseenCertificate: true,
        }),
      );
      localStorage.setItem(certificateShownKey, evaluatedAt);
      showCampaignCertificate({
        campaignId: campaign.id,
        campaignName: campaign.name,
        studentName: this.currentStudent?.name ?? '',
        schoolId: this.currentSchool?.id,
        rank: certificateRank,
        awardedAt: evaluatedAt,
        isNewlyEarned: true,
        studentId,
      });
    }
  }
}
