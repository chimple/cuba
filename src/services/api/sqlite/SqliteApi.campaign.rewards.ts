import { SqliteApiAssignmentAssessments } from './SqliteApi.assignment.assessments';
import logger from '../../../utility/logger';
import { showCampaignCertificate } from '../../../components/campaignCertificate';
import type { CampaignCertificateRank } from '../../../components/campaignCertificate';

const CAMPAIGN_LAST_FETCH_PREFIX = 'campaignLastFetch:studentScoped:';
const CAMPAIGN_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

type LocalCampaignRow = {
  id: string;
  name: string;
  rules_json: string;
  objective: string;
  target_value: number | null;
  start_date: string;
  end_date: string;
  status: string;
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

export class SqliteApiCampaignRewards extends SqliteApiAssignmentAssessments {
  async syncCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const storageKey = `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}`;
    const lastFetch = localStorage.getItem(storageKey);
    const lastFetchMs = lastFetch ? Date.parse(lastFetch) : 0;
    if (!lastFetchMs || Date.now() - lastFetchMs >= CAMPAIGN_SYNC_INTERVAL_MS) {
      const changes = await this.getActiveCampaigns(studentId, lastFetch);
      const eligibleIds = this.getEligibleCampaignIds(studentId);
      for (const change of changes ?? []) {
        if (change.change_type === 'delete') {
          await this.executeQuery(
            'UPDATE user_campaign_rewards SET is_deleted = 1 WHERE campaign_id = ? AND student_id = ?',
            [change.campaign_id, studentId],
          );
          eligibleIds.delete(change.campaign_id);
          continue;
        }
        eligibleIds.add(change.campaign_id);
        await this.executeQuery(
          `INSERT OR REPLACE INTO local_campaigns
            (id, name, rules_json, objective, target_value, start_date, end_date,
             status, updated_at, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            change.campaign_id,
            change.campaign_name ?? `Campaign ${change.campaign_id}`,
            typeof change.rules_json === 'string'
              ? change.rules_json
              : JSON.stringify(change.rules_json ?? change.rewards ?? {}),
            change.objective ?? 'homework_campaign',
            change.target_value ?? null,
            change.start_date ?? new Date().toISOString(),
            change.end_date ?? new Date().toISOString(),
            change.campaign_status ?? 'active',
            change.updated_at ?? change.created_at ?? new Date().toISOString(),
          ],
        );
      }
      localStorage.setItem(
        `${storageKey}:eligible`,
        JSON.stringify([...eligibleIds]),
      );
      localStorage.setItem(storageKey, new Date().toISOString());
    }
    await this.hydrateCampaignRewards(studentId);
  }

  private getEligibleCampaignIds(studentId: string): Set<string> {
    try {
      const ids: unknown = JSON.parse(
        localStorage.getItem(
          `${CAMPAIGN_LAST_FETCH_PREFIX}${studentId}:eligible`,
        ) ?? '[]',
      );
      return new Set(
        Array.isArray(ids)
          ? ids.filter((id): id is string => typeof id === 'string')
          : [],
      );
    } catch {
      return new Set();
    }
  }

  async hydrateCampaignRewards(
    studentId = this.currentStudent?.id,
  ): Promise<void> {
    if (!studentId) return;
    await this.ensureInitialized();
    const result = await this.executeQuery(
      'SELECT * FROM local_campaigns WHERE is_deleted = 0',
    );
    const eligibleIds = this.getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, false);
    }
  }

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
    const eligibleIds = this.getEligibleCampaignIds(studentId);
    for (const campaign of (result?.values ?? []) as LocalCampaignRow[]) {
      if (!eligibleIds.has(campaign.id)) continue;
      await this.evaluateCampaignReward(campaign, studentId, true);
    }
  }

  async getCachedCampaignRewards(studentId = this.currentStudent?.id) {
    if (!studentId) return [];
    await this.ensureInitialized();
    const result = await this.executeQuery(
      `SELECT r.*, c.name AS campaign_name, c.objective, c.start_date, c.end_date
       FROM user_campaign_rewards r
       LEFT JOIN local_campaigns c ON c.id = r.campaign_id
       WHERE r.student_id = ? AND r.is_deleted = 0
       ORDER BY r.evaluated_at DESC`,
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
    const isHomepageCampaign =
      campaign.objective === 'homepage_learning_pathway_campaign';
    const metricsResult = isHomepageCampaign
      ? await this.executeQuery(
          `SELECT
             COUNT(DISTINCT a.lesson_id) AS total_lessons,
             COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.lesson_id END) AS completed_lessons
           FROM assignment a
           LEFT JOIN result r
             ON r.assignment_id = a.id
            AND r.student_id = ?
            AND r.is_deleted = 0
            AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
            AND r.created_at >= ?
            AND r.created_at <= ?
           WHERE a.is_deleted = 0
             AND a.source IN (
               'learning_pathway_home_no_pal',
               'learning_pathway_home_pal'
             )
             AND a.starts_at >= ?
             AND a.starts_at <= ?
             AND (
               (a.is_class_wise = 1 AND EXISTS (
                 SELECT 1 FROM class_user cu
                 WHERE cu.class_id = a.class_id
                   AND cu.user_id = ?
                   AND cu.is_deleted = 0
               ))
               OR EXISTS (
                 SELECT 1 FROM assignment_user au
                 WHERE au.assignment_id = a.id
                   AND au.user_id = ?
                   AND au.is_deleted = 0
               )
             )`,
          [
            studentId,
            campaign.start_date,
            campaign.end_date,
            campaign.start_date,
            campaign.end_date,
            studentId,
            studentId,
          ],
        )
      : await this.executeQuery(
          `SELECT
             COUNT(DISTINCT a.lesson_id) AS total_lessons,
             COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.lesson_id END) AS completed_lessons
           FROM assignment a
           LEFT JOIN result r
             ON r.assignment_id = a.id
            AND r.student_id = ?
            AND r.is_deleted = 0
            AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
            AND r.created_at >= ?
            AND r.created_at <= ?
           WHERE a.campaign_id = ? AND a.is_deleted = 0`,
          [studentId, campaign.start_date, campaign.end_date, campaign.id],
        );
    const metrics = metricsResult?.values?.[0] ?? {};
    let totalLessons = Number(metrics.total_lessons ?? 0);
    let completedLessons = Number(metrics.completed_lessons ?? 0);
    if (isHomepageCampaign && totalLessons === 0) {
      const fallbackResult = await this.executeQuery(
        `SELECT COUNT(DISTINCT r.lesson_id) AS total_lessons, COUNT(DISTINCT r.lesson_id) AS completed_lessons
         FROM result r WHERE r.student_id = ? AND r.is_deleted = 0
           AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
           AND r.source IN ('learning_pathway_home_no_pal', 'learning_pathway_home_pal')
           AND r.created_at >= ? AND r.created_at <= ?`,
        [studentId, campaign.start_date, campaign.end_date],
      );
      const fallback = fallbackResult?.values?.[0] ?? {};
      totalLessons = Number(fallback.total_lessons ?? 0);
      completedLessons = Number(fallback.completed_lessons ?? 0);
    }
    const completion = totalLessons
      ? Math.min((completedLessons / totalLessons) * 100, 100)
      : 0;
    const rules = parseCampaignRules(campaign.rules_json).sort(
      (a, b) => b.min - a.min,
    );
    const progressValue = isHomepageCampaign ? completedLessons : completion;
    const winningRule = rules.find((rule) => progressValue >= Number(rule.min));
    const status = winningRule
      ? 'won'
      : now > new Date(campaign.end_date)
        ? 'missed'
        : 'in_progress';
    const rank = winningRule?.rank ?? null;
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
        (campaign_id, student_id, lessons_completed_count, lessons_target_count,
         completion_percentage, rank_achieved, status, certificate_available,
         evaluated_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        campaign.id,
        studentId,
        completedLessons,
        totalLessons,
        Math.round(completion),
        rank,
        status,
        status === 'won' ? 1 : 0,
        evaluatedAt,
        evaluatedAt,
      ],
    );

    if (existing?.status !== status || existing?.rank_achieved !== rank) {
      try {
        await this.queueCampaignRewardUpload({
          campaignId: campaign.id,
          studentId,
          rankAchieved: rank,
          status,
          evaluatedAt,
        });
      } catch (error) {
        logger.error(
          'Campaign reward queue failed; keeping local result',
          error,
        );
      }
    }

    if (shouldEmitCertificate) {
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
