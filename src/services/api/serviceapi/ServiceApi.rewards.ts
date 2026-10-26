import { TableTypes, LeaderboardRewards } from '../../../common/constants';

export interface ServiceApiRewards {
  /** Reads local or remote badge progress for the specified child profile. */
  getUserBadgeProgress(
    userId: string,
  ): Promise<TableTypes<'user_badge_progress'> | undefined>;

  /** Clears the unseen flag for the specified child profile. */
  markUserBadgeSeen(userId: string): Promise<void>;

  /** Increments the child's lesson count and returns any newly reached milestone. */
  recordBadgeLessonCompletion(userId: string): Promise<{
    progress: TableTypes<'user_badge_progress'>;
    milestoneReached: number | null;
  }>;

  getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]>;

  getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]>;

  getRewardsById(
    id: number,
    periodType: string,
  ): Promise<TableTypes<'reward'> | undefined>;

  getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]>;

  getUserStickerBook(
    userId: string,
  ): Promise<TableTypes<'user_sticker_book'>[]>;

  getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]>;

  getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]>;

  markStciekercolledasTrue(userId: string): Promise<void>;

  updateRewardAsSeen(studentId: string): Promise<void>;

  updateRewardsForStudent(
    studentId: string,
    unlockReward: LeaderboardRewards,
  ): void | Promise<void>;

  getRewardById(
    rewardId: string,
  ): Promise<TableTypes<'rive_reward'> | undefined>;

  getAllRewards(): Promise<TableTypes<'rive_reward'>[] | []>;

  updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string,
  ): Promise<void>;
}
