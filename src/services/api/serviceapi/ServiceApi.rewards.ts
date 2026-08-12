import { TableTypes, LeaderboardRewards } from '../../../common/constants';

export interface ServiceApiRewards {
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
