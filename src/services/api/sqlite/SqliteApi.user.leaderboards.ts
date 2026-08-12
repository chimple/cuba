import {
  LIDO_ASSESSMENT,
  LeaderboardDropdownList,
  TABLES,
} from '../../../common/constants';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { LeaderboardInfo } from '../ServiceApi';
import { SqliteApiUserClassManagement } from './SqliteApi.user.classManagement';

export class SqliteApiUserLeaderboards extends SqliteApiUserClassManagement {
  [key: string]: any;
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
