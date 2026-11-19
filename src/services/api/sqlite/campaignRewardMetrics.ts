import { SOURCE } from '../../../common/constants';

type CampaignMetricsInput = {
  id: string;
  objective?: string | null;
  start_date: string;
  end_date: string;
};

type QueryResult = {
  values?: Array<Record<string, unknown>>;
};

type ExecuteQuery = (
  statement: string,
  values?: unknown[],
) => Promise<QueryResult | undefined>;

const getMetricValue = (result: QueryResult | undefined, key: string) =>
  Number(result?.values?.[0]?.[key] ?? 0);

export const getCampaignLessonMetrics = async (
  executeQuery: ExecuteQuery,
  campaign: CampaignMetricsInput,
  studentId: string,
): Promise<{ totalLessons: number; completedLessons: number }> => {
  const isHomepageLearningPathwayCampaign =
    campaign.objective === 'homepage_learning_pathway_campaign';
  const metricsResult = isHomepageLearningPathwayCampaign
    ? await executeQuery(
        `SELECT COUNT(DISTINCT r.lesson_id) AS total_lessons,
                COUNT(DISTINCT r.lesson_id) AS completed_lessons
         FROM result r
         WHERE r.student_id = ?
           AND r.is_deleted = 0
           AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
           AND r.source IN (?, ?)
           AND date(r.created_at) >= date(?)
           AND date(r.created_at) <= date(?)`,
        [
          studentId,
          SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
          SOURCE.LEARNING_PATHWAY_HOME_PAL,
          campaign.start_date,
          campaign.end_date,
        ],
      )
    : await executeQuery(
        `SELECT COUNT(DISTINCT a.lesson_id) AS total_lessons,
                COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.lesson_id END) AS completed_lessons
         FROM assignment a
         LEFT JOIN result r
           ON r.assignment_id = a.id
          AND r.student_id = ?
          AND r.is_deleted = 0
          AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
          AND date(r.created_at) >= date(?)
          AND date(r.created_at) <= date(?)
         WHERE a.campaign_id = ?
           AND a.is_deleted = 0`,
        [studentId, campaign.start_date, campaign.end_date, campaign.id],
      );

  return {
    totalLessons: getMetricValue(metricsResult, 'total_lessons'),
    completedLessons: getMetricValue(metricsResult, 'completed_lessons'),
  };
};
