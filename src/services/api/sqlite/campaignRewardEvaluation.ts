import { showCampaignCertificate } from '../../../components/campaignCertificate';
import type { CampaignCertificateRank } from '../../../components/campaignCertificate';
import { store } from '../../../redux/store';
import { setCampaignRewardsState } from '../../../redux/slices/campaignRewards/campaignRewardsSlice';
import logger from '../../../utility/logger';
import { getCampaignLessonMetrics } from './campaignRewardMetrics';
import {
  logCampaignEvaluation,
  logCampaignReward,
} from './campaignRewardLogging';

export type LocalCampaignRow = {
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

export type CampaignRewardRule = {
  rank: 1 | 2 | 3;
  min: number;
  reward?: string;
};

type QueryResult = { values?: Array<Record<string, unknown>> };
type ExecuteQuery = (
  statement: string,
  values?: unknown[],
) => Promise<QueryResult | undefined>;

type Dependencies = {
  executeQuery: ExecuteQuery;
  upsertReward: (payload: {
    campaignId: string;
    studentId: string;
    rankAchieved: number | null;
    status: 'won' | 'missed' | 'in_progress';
    evaluatedAt: string;
  }) => Promise<unknown>;
  getStudent: (studentId: string) => Promise<
    | {
        name?: string | null;
        language_id?: string | null;
      }
    | null
    | undefined
  >;
  getLanguage: (
    languageId: string,
  ) => Promise<{ code?: string | null } | null | undefined>;
  studentName: string;
  schoolId?: string;
};

export const parseCampaignRules = (value: string): CampaignRewardRule[] => {
  try {
    const parsed = JSON.parse(value) as { rules?: CampaignRewardRule[] };
    return Array.isArray(parsed?.rules) ? parsed.rules : [];
  } catch {
    return [];
  }
};

const isDigitalRewardsCampaign = (value: string): boolean => {
  try {
    return JSON.parse(value).type === 'digital_rewards';
  } catch {
    return false;
  }
};

const getLocalDateKey = (value = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const evaluateCampaignReward = async (
  dependencies: Dependencies,
  campaign: LocalCampaignRow,
  studentId: string,
  showCertificate: boolean,
): Promise<void> => {
  const now = new Date();
  const today = getLocalDateKey(now);
  const campaignEndDate = campaign.end_date.slice(0, 10);
  const campaignEnded = today > campaignEndDate;
  const isHomepageCampaign =
    campaign.objective === 'homepage_learning_pathway_campaign';
  const { totalLessons, completedLessons } = await getCampaignLessonMetrics(
    dependencies.executeQuery,
    campaign,
    studentId,
  );
  const pathwayTarget = Number(campaign.target_value);
  const totalPathways =
    Number.isFinite(pathwayTarget) && pathwayTarget > 0 ? pathwayTarget : 0;
  const persistedTargetLessons = isHomepageCampaign
    ? totalPathways * 5
    : totalLessons;
  const completionPercent = isHomepageCampaign
    ? totalPathways
      ? Math.min((Math.floor(completedLessons / 5) / totalPathways) * 100, 100)
      : 0
    : persistedTargetLessons
      ? (completedLessons / persistedTargetLessons) * 100
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
    !winningRule && campaignEnded && completedLessons >= 1;
  const status = winningRule ? 'won' : campaignEnded ? 'missed' : 'in_progress';
  const rank = winningRule?.rank ?? null;
  const certificateAvailable =
    isDigitalRewardsCampaign(campaign.rules_json) &&
    (Boolean(winningRule) || (campaignEnded && participationEligible));
  const certificateRank: CampaignCertificateRank | null = certificateAvailable
    ? (rank ?? (participationEligible ? 'participation' : null))
    : null;
  const evaluatedAt = now.toISOString();
  const existingResult = await dependencies.executeQuery(
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
  const certificateShownKey = `campaignCertificateShown:${studentId}:${campaign.id}:${certificateRank}`;
  const shouldEmitCertificate =
    showCertificate &&
    campaignEnded &&
    (status === 'won' || participationEligible) &&
    certificateAvailable &&
    !localStorage.getItem(certificateShownKey);
  logCampaignEvaluation(campaign, studentId, {
    targetType: campaign.target_type,
    targetValue: campaign.target_value,
    rules,
    totalLessons,
    completedLessons,
    completion,
    status,
    rank,
    certificateRank,
    endDate: campaign.end_date,
    certificateAvailable,
    certificateAvailableOn: new Date(campaign.end_date)
      .toISOString()
      .slice(0, 10),
    shouldEmitCertificate,
  });

  await dependencies.executeQuery(
    `INSERT OR REPLACE INTO user_campaign_rewards
      (campaign_id, student_id, lessons_completed_count, lessons_target_count,
       completion_percentage, certificate_available, rank_achieved, status,
       has_unseen_certificate, evaluated_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      campaign.id,
      studentId,
      completedLessons,
      persistedTargetLessons,
      Math.round(completionPercent),
      certificateAvailable ? 1 : 0,
      rank,
      status,
      certificateAvailable &&
      (shouldEmitCertificate || Boolean(existing?.has_unseen_certificate))
        ? 1
        : 0,
      evaluatedAt,
      evaluatedAt,
    ],
  );

  if (existing?.status !== status || existing?.rank_achieved !== rank) {
    try {
      await dependencies.upsertReward({
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

  if (!shouldEmitCertificate) return;
  let languageCode = localStorage.getItem('language') ?? 'en';
  let studentName = dependencies.studentName;
  try {
    const student = await dependencies.getStudent(studentId);
    studentName = student?.name ?? studentName;
    if (student?.language_id) {
      const language = await dependencies.getLanguage(student.language_id);
      languageCode = language?.code ?? languageCode;
    }
  } catch (error) {
    logger.warn(
      'Campaign certificate language lookup failed; using stored language',
      error,
    );
  }
  store.dispatch(
    setCampaignRewardsState({ studentId, hasUnseenCertificate: true }),
  );
  localStorage.setItem(certificateShownKey, evaluatedAt);
  showCampaignCertificate({
    campaignId: campaign.id,
    campaignName: campaign.name,
    studentName,
    schoolId: dependencies.schoolId,
    rank: certificateRank!,
    campaignEndDate: campaign.end_date,
    languageCode,
    isNewlyEarned: true,
    studentId,
  });
  logCampaignReward('certificate emitted', {
    campaignId: campaign.id,
    studentId,
    rank: certificateRank,
    languageCode,
  });
};
