import { LeaderboardDropdownList } from '../../../common/constants';
import logger from '../../../utility/logger';
import { LeaderboardInfo, StudentLeaderboardInfo } from '../ServiceApi';
import { SupabaseApiUserClassManagement } from './SupabaseApi.user.classManagement';

const GENERIC_LEADERBOARD_LIMIT = 50;

type LeaderboardDataType = 'weekly' | 'monthly' | 'allTime';

const emptyLeaderboardInfo = (): LeaderboardInfo => ({
  weekly: [],
  allTime: [],
  monthly: [],
});

const getLeaderboardDataType = (
  leaderboardDropdownType: LeaderboardDropdownList,
): LeaderboardDataType =>
  leaderboardDropdownType === LeaderboardDropdownList.WEEKLY
    ? 'weekly'
    : leaderboardDropdownType === LeaderboardDropdownList.MONTHLY
      ? 'monthly'
      : 'allTime';

const mapLeaderboardRow = (result: any): StudentLeaderboardInfo => ({
  name: result.name || '',
  score: result.total_score || 0,
  timeSpent: result.total_time_spent || 0,
  lessonsPlayed: result.lessons_played || 0,
  userId: result.student_id || '',
});

const pushLeaderboardRow = (leaderBoardList: LeaderboardInfo, result: any) => {
  const leaderboardEntry = mapLeaderboardRow(result);
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
};

export interface SupabaseApiUserLeaderboards {
  [key: string]: any;
}
export class SupabaseApiUserLeaderboards extends SupabaseApiUserClassManagement {
  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    try {
      if (!this.supabase)
        throw new Error('Supabase instance is not initialized');

      const leaderBoardList = emptyLeaderboardInfo();

      if (!sectionId) {
        const leaderboardType = getLeaderboardDataType(leaderboardDropdownType);
        const { data, error } = await this.supabase
          .from('get_leaderboard_generic_data')
          .select(
            'type, student_id, name, lessons_played, total_score, total_time_spent',
          )
          .eq('type', leaderboardType)
          .order('total_score', { ascending: false, nullsFirst: false })
          .limit(GENERIC_LEADERBOARD_LIMIT);

        if (error) {
          throw error;
        }

        data?.forEach((result) => pushLeaderboardRow(leaderBoardList, result));
        return leaderBoardList;
      }

      const rpcRes = await this.supabase.rpc('get_class_leaderboard', {
        current_class_id: sectionId,
      });

      // Check if the response is valid
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? new Error('Failed to fetch leaderboard data');
      }

      // Initialize the leaderboard structure
      const data: any = rpcRes.data;

      // Process the data and populate the leaderboard lists
      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        pushLeaderboardRow(leaderBoardList, result);
      }

      return leaderBoardList;
    } catch (e) {
      logger.error('Error in getLeaderboardResults: ', e);
      // Return an empty leaderboard structure in case of error
      return emptyLeaderboardInfo();
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId?: string,
  ): Promise<LeaderboardInfo | undefined> {
    try {
      // Initialize leaderboard structure
      let leaderBoardList = emptyLeaderboardInfo();

      if (!this.supabase) {
        logger.error('Supabase instance is not initialized');
        return;
      }

      if (!studentId) {
        logger.warn(
          'getLeaderboardStudentResultFromB2CCollection called without studentId',
        );
        return leaderBoardList;
      }

      // Execute the query
      const { data, error } = await this.supabase
        .from('get_leaderboard_generic_data')
        .select(
          'type, student_id, name, lessons_played, total_score, total_time_spent',
        )
        .eq('student_id', studentId)
        .limit(3);

      // Handle errors in the query execution
      if (error) {
        logger.error('Error fetching leaderboard data: ', error);
        return;
      }

      // Handle case where no data is returned
      if (!data) {
        logger.warn('No data returned from get_leaderboard_generic_data');
        return;
      }

      // Process the results
      data.forEach((result) => {
        if (!result) return;
        pushLeaderboardRow(leaderBoardList, result);
      });

      return leaderBoardList;
    } catch (error) {
      logger.error(
        'Error in getLeaderboardStudentResultFromB2CCollection: ',
        error,
      );
    }
  }
}
