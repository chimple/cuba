import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import {
  TableTypes,
  LeaderboardRewardsType,
  unlockedRewardsInfo,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from './logger';
import { UtilAppLifecycle } from './util.appLifecycle';

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}

export interface HotUpdateState {
  status: string;
  progress: number;
  channel: string;
  lastChecked: string;
  lastUpdated: string;
  error: string;
  isAuto: boolean;
}
export class UtilSessionContext extends UtilAppLifecycle {
  static [key: string]: any;
  public static async migrateLocalJsonFile(
    newFileURL: string,
    oldFilePath: string,
    newFilePathLocation: string,
    localStorageNameForFilePath: string,
  ) {
    try {
      if (!newFileURL) {
        return;
      }

      let newFileResponse = await fetch(newFileURL);

      let newFileJson = await newFileResponse.json();

      let oldFileResponse = await fetch(oldFilePath);

      let oldFileJson = await oldFileResponse.json();

      if (oldFileJson.version >= newFileJson.version) {
        return;
      }

      let res = await Filesystem.writeFile({
        path: newFilePathLocation,
        directory: Directory.Data,
        data: JSON.stringify(newFileJson),
        encoding: Encoding.UTF8,
        recursive: true,
      });
      localStorage.setItem(localStorageNameForFilePath, res.uri);
    } catch (error) {
      logger.error('Json File Migration failed ', error);

      throw error;
    }
  }

  public static async getNextUnlockStickers(): Promise<
    TableTypes<'sticker'>[]
  > {
    const date = new Date();
    const api = ServiceConfig.getI().apiHandler;
    const rewardsDoc = await api.getRewardsById(
      date.getFullYear(),
      'weeklySticker',
    );
    if (!rewardsDoc) return [];
    const currentWeek = this.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    const parsedWeeklyData: Record<string, { type: string; id: string }[]> =
      typeof weeklyData === 'string'
        ? JSON.parse(weeklyData)
        : typeof weeklyData === 'object' && weeklyData !== null
          ? (weeklyData as Record<string, { type: string; id: string }[]>)
          : {};
    const weeklyRewards = parsedWeeklyData[currentWeek.toString()] ?? [];
    weeklyRewards.forEach((value: { type: string; id: string }) => {
      if (value.type === LeaderboardRewardsType.STICKER) {
        stickerIds.push(value.id);
      }
    });

    const stickerDocs = await api.getStickersByIds(stickerIds);
    return stickerDocs;
  }

  public static getCurrentWeekNumber(): number {
    const date: Date = new Date();
    const startOfYear: Date = new Date(date.getFullYear(), 0, 1);
    const dayOfYear: number =
      Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const firstDayOfWeek: number = startOfYear.getDay() || 7;
    const weekNumber: number = Math.ceil((dayOfYear + firstDayOfWeek - 1) / 7);
    return weekNumber;
  }

  public static getCurrentMonthForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getMonth() + 1;
  }

  public static getCurrentYearForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getFullYear();
  }

  public static async getStudentFromServer() {
    const api = ServiceConfig.getI().apiHandler;
    let currentStudent = await this.getCurrentStudent();
    if (!currentStudent) return;
    const updatedStudent = await api.getUserByDocId(currentStudent.id);
    if (updatedStudent) {
      await this.setCurrentStudent(updatedStudent);
    }
  }

  public static async unlockWeeklySticker() {
    try {
      let currentUser = this.getCurrentStudent();
      if (!currentUser) return false;
      const api = ServiceConfig.getI().apiHandler;
      const date = new Date();
      const rewardsDoc = await api.getRewardsById(
        date.getFullYear(),
        'weeklySticker',
      );
      if (!rewardsDoc) return false;
      const currentWeek = this.getCurrentWeekNumber();
      const weeklyData = rewardsDoc.weeklySticker;
      let currentReward;

      const parsedWeeklyData: Record<string, { type: string; id: string }[]> =
        typeof weeklyData === 'string'
          ? JSON.parse(weeklyData)
          : typeof weeklyData === 'object' && weeklyData !== null
            ? (weeklyData as Record<string, { type: string; id: string }[]>)
            : {};
      const weeklyRewards = parsedWeeklyData[currentWeek.toString()] ?? [];
      weeklyRewards.forEach(async (value: { type: string; id: string }) => {
        currentReward = value;
      });

      if (!currentReward) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('unlockWeeklySticker() error ', error);
      return false;
    }
  }

  public static async getAllUnlockedRewards(): Promise<
    unlockedRewardsInfo[] | undefined
  > {
    return;
  }
}
