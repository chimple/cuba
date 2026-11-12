import {
  LIDO_ASSESSMENT,
  LeaderboardDropdownList,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { LeaderboardInfo, TeacherLeaderboardScoreHistory } from '../ServiceApi';
import { SqliteApiUserClassManagement } from './SqliteApi.user.classManagement';

export class SqliteApiUserLeaderboards extends SqliteApiUserClassManagement {
  [key: string]: any;
  /**
   * Fetches the active leaderboard row for a teacher from local SQLite.
   * @param teacherId Authenticated teacher user ID.
   * @returns Leaderboard row, or undefined when unavailable.
   */
  async getTeacherLeaderboard(
    teacherId: string,
  ): Promise<TableTypes<'teacher_leaderboard'> | undefined> {
    await this.ensureInitialized();
    if (!this._db || !teacherId) return undefined;

    try {
      const result = await this._db.query(
        `SELECT * FROM ${TABLES.TeacherLeaderboard}
         WHERE teacher_id = ? AND COALESCE(is_deleted, 0) = 0
         LIMIT 1`,
        [teacherId],
      );
      const localResult = result.values?.[0] as
        | TableTypes<'teacher_leaderboard'>
        | undefined;
      return localResult;
    } catch (error) {
      logger.error(
        '[TeacherLeaderboard] Error fetching SQLite leaderboard:',
        error,
      );
      return undefined;
    }
  }

  /**
   * Calculates seven rolling daily teacher scores from locally synced SQLite data.
   * @param teacherId Authenticated teacher user ID whose score history is requested.
   * @returns Seven date-and-score entries, or an empty array when data is unavailable.
   */
  async getTeacherLeaderboardScoreHistory(
    teacherId: string,
  ): Promise<TeacherLeaderboardScoreHistory[]> {
    await this.ensureInitialized();
    if (!this._db || !teacherId) return [];

    try {
      const result = await this._db.query(
        // The query creates seven dates, compares consecutive rolling windows,
        // then applies base engagement and band-movement points per class.
        `WITH RECURSIVE
          params(teacher_id) AS (SELECT ?),
          days(score_date, day_number) AS (
            SELECT date('now', '-6 days'), 0
            UNION ALL
            SELECT date(score_date, '+1 day'), day_number + 1
            FROM days WHERE day_number < 6
          ),
          teacher_classes AS (
            SELECT DISTINCT cu.class_id
            FROM ${TABLES.ClassUser} cu, params p
            WHERE cu.user_id = p.teacher_id AND cu.role = 'teacher'
              AND COALESCE(cu.is_deleted, 0) = 0
          ),
          active_days AS (
            SELECT d.score_date
            FROM days d, params p
            WHERE EXISTS (
              SELECT 1 FROM ${TABLES.Assignment} a
              WHERE a.created_by = p.teacher_id
                AND COALESCE(a.is_deleted, 0) = 0
                AND a.created_at >= date(d.score_date, '-6 days')
                AND a.created_at < date(d.score_date, '+1 day')
            )
          ),
          windows AS (
            SELECT d.score_date, tc.class_id, students.user_id AS student_id,
              COALESCE((SELECT SUM(r.time_spent) FROM ${TABLES.Result} r
                WHERE r.student_id = students.user_id AND r.class_id = tc.class_id
                  AND COALESCE(r.is_deleted, 0) = 0
                  AND r.created_at >= date(d.score_date, '-6 days')
                  AND r.created_at < date(d.score_date, '+1 day')), 0) AS current_seconds,
              COALESCE((SELECT SUM(r.time_spent) FROM ${TABLES.Result} r
                WHERE r.student_id = students.user_id AND r.class_id = tc.class_id
                  AND COALESCE(r.is_deleted, 0) = 0
                  AND r.created_at >= date(d.score_date, '-7 days')
                  AND r.created_at < d.score_date), 0) AS previous_seconds,
              EXISTS(SELECT 1 FROM ${TABLES.Result} r
                WHERE r.student_id = students.user_id AND r.class_id = tc.class_id
                  AND COALESCE(r.is_deleted, 0) = 0
                  AND r.created_at < date(d.score_date, '+1 day')) AS played_current,
              EXISTS(SELECT 1 FROM ${TABLES.Result} r
                WHERE r.student_id = students.user_id AND r.class_id = tc.class_id
                  AND COALESCE(r.is_deleted, 0) = 0 AND r.created_at < d.score_date) AS played_previous
            FROM days d CROSS JOIN teacher_classes tc
            JOIN ${TABLES.ClassUser} students ON students.class_id = tc.class_id
              AND students.role = 'student' AND COALESCE(students.is_deleted, 0) = 0
          ),
          bands AS (
            SELECT *,
              CASE WHEN current_seconds >= 2700 THEN 'green' WHEN current_seconds > 0 THEN 'yellow' WHEN played_current THEN 'red' ELSE 'grey' END AS current_band,
              CASE WHEN previous_seconds >= 2700 THEN 'green' WHEN previous_seconds > 0 THEN 'yellow' WHEN played_previous THEN 'red' ELSE 'grey' END AS previous_band
            FROM windows
          ),
          class_scores AS (
            SELECT score_date, class_id,
              (COALESCE(AVG(CASE WHEN current_band = 'green' THEN current_seconds END), 0)
                + COALESCE(AVG(CASE WHEN current_band = 'yellow' THEN current_seconds END), 0)) / 60.0
              + SUM(CASE previous_band || '-' || current_band
                WHEN 'red-yellow' THEN 10 WHEN 'yellow-green' THEN 5 WHEN 'red-green' THEN 15
                WHEN 'grey-yellow' THEN 20 WHEN 'grey-green' THEN 25 WHEN 'green-yellow' THEN -5
                WHEN 'yellow-red' THEN -10 WHEN 'green-red' THEN -15 ELSE 0 END) AS score
            FROM bands GROUP BY score_date, class_id
          )
        SELECT d.score_date AS date,
          CASE WHEN ad.score_date IS NULL THEN 0 ELSE ROUND(COALESCE(SUM(cs.score), 0)) END AS score
        FROM days d LEFT JOIN active_days ad ON ad.score_date = d.score_date
        LEFT JOIN class_scores cs ON cs.score_date = d.score_date
        GROUP BY d.score_date, ad.score_date ORDER BY d.score_date`,
        [teacherId],
      );

      return (result.values ?? []).map(
        (row: { date?: unknown; score?: unknown }) => ({
          date: String(row.date),
          score: Number(row.score),
        }),
      );
    } catch (error) {
      logger.error(
        '[TeacherLeaderboard] Error calculating SQLite score history:',
        error,
      );
      return [];
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId: string,
  ): Promise<LeaderboardInfo | undefined> {
    await this.ensureInitialized();
    try {
      // Ensure the database instance is initialized
      if (!this._db) throw new Error('Database is not initialized');

      // Define the query to fetch the leaderboard data for the given student
      const currentStudentQuery = `
        SELECT 'allTime' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'monthly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND strftime('%m', res.created_at) = strftime('%m', datetime('now'))
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'weekly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(res.score) as total_score,
               sum(res.time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        JOIN ${TABLES.Lesson} l ON l.id = res.lesson_id
        WHERE res.student_id = '${studentId}'
          AND strftime('%W', res.created_at) = strftime('%W', datetime('now'))
          AND COALESCE(res.is_deleted, 0) = 0
          AND COALESCE(u.is_deleted, 0) = 0
          AND COALESCE(l.plugin_type, '') <> '${LIDO_ASSESSMENT}'
        GROUP BY res.student_id, u.name
      `;

      // Execute the query
      const currentUserResult = await this._db.query(currentStudentQuery);

      // Handle case where no data is returned
      if (!currentUserResult.values) {
        return;
      }

      // Initialize the leaderboard structure
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Process the results
      currentUserResult.values.forEach((result: any) => {
        if (!result) return;

        const leaderboardEntry = {
          name: result.name || '',
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: studentId,
        };

        switch (result.type) {
          case 'allTime':
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case 'monthly':
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case 'weekly':
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            logger.warn('Unknown leaderboard type: ', result.type);
        }
      });

      return leaderBoardList;
    } catch (error) {
      logger.error(
        'Error in getLeaderboardStudentResultFromB2CCollection: ',
        error,
      );
    }
  }

  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    if (sectionId) {
      // Getting Class wise Leaderboard
      let classLeaderboard = await this._serverApi.getLeaderboardResults(
        sectionId,
        leaderboardDropdownType,
      );
      return classLeaderboard;
    } else {
      // Getting Generic Leaderboard
      let genericQueryResult = await this._serverApi.getLeaderboardResults(
        '',
        leaderboardDropdownType,
      );
      if (!genericQueryResult) {
        return;
      }
      return genericQueryResult;
    }
  }
}
