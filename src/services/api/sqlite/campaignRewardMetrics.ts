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
           AND a.source IN (?, ?)
           AND a.starts_at >= ?
           AND a.starts_at <= ?
           AND (
             (a.is_class_wise = 1 AND EXISTS (
               SELECT 1 FROM class_user cu
               WHERE cu.class_id = a.class_id AND cu.user_id = ? AND cu.is_deleted = 0
             ))
             OR EXISTS (
               SELECT 1 FROM assignment_user au
               WHERE au.assignment_id = a.id AND au.user_id = ? AND au.is_deleted = 0
             )
           )`,
        [
          studentId,
          campaign.start_date,
          campaign.end_date,
          SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
          SOURCE.LEARNING_PATHWAY_HOME_PAL,
          campaign.start_date,
          campaign.end_date,
          studentId,
          studentId,
        ],
      )
    : await executeQuery(
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
  let totalLessons = getMetricValue(metricsResult, 'total_lessons');
  let completedLessons = getMetricValue(metricsResult, 'completed_lessons');

  if (isHomepageLearningPathwayCampaign && totalLessons === 0) {
    const resultMetrics = await executeQuery(
      `SELECT
         COUNT(DISTINCT r.lesson_id) AS total_lessons,
         COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN r.lesson_id END) AS completed_lessons
       FROM result r
       WHERE r.student_id = ?
         AND r.is_deleted = 0
         AND COALESCE(r.status, '') NOT IN ('system_exit', 'assessment_terminated')
         AND r.source IN (?, ?)
         AND r.created_at >= ? AND r.created_at <= ?`,
      [
        studentId,
        SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
        SOURCE.LEARNING_PATHWAY_HOME_PAL,
        campaign.start_date,
        campaign.end_date,
      ],
    );
    totalLessons = getMetricValue(resultMetrics, 'total_lessons');
    completedLessons = getMetricValue(resultMetrics, 'completed_lessons');
  }

  return { totalLessons, completedLessons };
};
