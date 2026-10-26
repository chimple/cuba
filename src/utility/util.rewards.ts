import {
  EVENTS,
  LANG,
  LANGUAGE,
  TableTypes,
  SHOULD_SHOW_REMOTE_ASSETS,
  CHIMPLE_RIVE_STATE_MACHINE_MAX,
  DAILY_USER_REWARD,
  IS_REWARD_FEATURE_ON,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import i18n from '../i18n';
import { store } from '../redux/store';
import { setUser } from '../redux/slices/auth/authSlice';
import logger from './logger';
import { UtilDataAndRewards } from './util.dataAndRewards';

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
export class UtilRewards extends UtilDataAndRewards {
  static [key: string]: any;
  public static async handleDeeplinkClick(
    url: URL,
    currentUser: TableTypes<'user'> | null,
    destinationPage: string,
  ) {
    const timestamp = new Date().toISOString();

    // Convert all query parameters to an object
    const queryParams: Record<string, string | null> = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    const eventData = {
      user_id: currentUser?.id ?? 'anonymous',
      user_name: currentUser?.name ?? '',
      phone: currentUser?.phone || null,
      email: currentUser?.email || null,
      timestamp,
      destinationPage: destinationPage,
      ...queryParams,
    };

    await this.logEvent(EVENTS.DEEPLINK_CLICKED, eventData);
  }

  public static async setParentLanguagetoLocal() {
    const api = ServiceConfig.getI().apiHandler;
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!!user && !!user.language_id) {
      const langDoc = await api.getLanguageWithId(user.language_id);
      if (langDoc) {
        const tempLangCode = langDoc.code ?? LANG.ENGLISH;
        localStorage.setItem(LANGUAGE, tempLangCode);
        await i18n.changeLanguage(tempLangCode);
      }
    }
  }

  public static async updateUserLanguage(languageCode: string) {
    if (!languageCode) return;
    try {
      const api = ServiceConfig.getI().apiHandler;
      const auth = ServiceConfig.getI().authHandler;
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) return;

      const allLanguages = await api.getAllLanguages();
      const selectedLanguage = allLanguages.find(
        (lang) => lang.code === languageCode,
      );

      // Skip if no language found or already set to the same language
      if (!selectedLanguage || selectedLanguage.id === currentUser.language_id)
        return;

      await api.updateLanguage(currentUser.id, selectedLanguage.id);
      localStorage.setItem(LANGUAGE, languageCode);
      await i18n.changeLanguage(languageCode ?? '');

      const updatedUserData: TableTypes<'user'> = {
        ...currentUser,
        language_id: selectedLanguage.id,
      };

      store.dispatch(setUser(updatedUserData));
      auth.currentUser = updatedUserData;
    } catch (error) {
      logger.error('Failed to update user language:', error);
    }
  }

  public static async fetchTodaysReward() {
    try {
      const allRewards = await ServiceConfig.getI().apiHandler.getAllRewards();
      if (allRewards.length === 0) return;
      const today = new Date();
      const day = today.getDate();
      let chimpleRiveMaxState = allRewards[0].max_state_value ?? 8;
      if (localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true') {
        chimpleRiveMaxState =
          parseInt(
            localStorage.getItem(CHIMPLE_RIVE_STATE_MACHINE_MAX) as string,
          ) ?? chimpleRiveMaxState;
      }

      const mappedState = ((day - 1) % chimpleRiveMaxState) + 1;
      const todaysReward = allRewards.find(
        (reward) =>
          reward.state_number_input === mappedState && reward.type === 'normal',
      );
      return todaysReward;
    } catch (error) {
      logger.error('Error fetching Chimple Rive config:', error);
    }
  }

  public static async shouldGiveDailyReward(): Promise<boolean> {
    try {
      const isRewardFeatureOn =
        localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';
      if (!isRewardFeatureOn) return false;
      const currentStudent = this.getCurrentStudent();
      if (!currentStudent) return false;

      const dailyUserReward = currentStudent.reward
        ? JSON.parse(currentStudent.reward as string)
        : {};
      const todaysReward = await this.fetchTodaysReward();
      if (!todaysReward) return false;

      const today = new Date().toISOString().split('T')[0];
      const rewardDate = dailyUserReward.timestamp
        ? new Date(dailyUserReward.timestamp).toISOString().split('T')[0]
        : null;
      const hasReceivedTodayReward =
        todaysReward.id === dailyUserReward.reward_id && rewardDate === today;

      return !hasReceivedTodayReward;
    } catch (error) {
      logger.error('Error checking daily reward eligibility:', error);
      return false;
    }
  }

  public static async updateUserReward() {
    try {
      // Get daily user reward from localStorage
      const dailyUserReward = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) ?? '{}',
      );

      const currentStudent = this.getCurrentStudent();
      if (!currentStudent) return;
      // Fetch current reward
      const currentReward = currentStudent.reward
        ? JSON.parse(currentStudent.reward as string)
        : null;
      if (!currentReward) return;

      // Initialize student's reward object if it doesn't exist
      if (!dailyUserReward[currentStudent.id]) {
        dailyUserReward[currentStudent.id] = {};
      }

      if (
        !dailyUserReward[currentStudent.id].timestamp ||
        new Date(dailyUserReward[currentStudent.id].timestamp)
          .toISOString()
          .split('T')[0] !== new Date().toISOString().split('T')[0] ||
        dailyUserReward[currentStudent.id].reward_id !==
          currentReward?.reward_id
      ) {
        // Update localStorage
        dailyUserReward[currentStudent.id].reward_id = currentReward.reward_id;
        dailyUserReward[currentStudent.id].timestamp = currentReward.timestamp;
        localStorage.setItem(
          DAILY_USER_REWARD,
          JSON.stringify(dailyUserReward),
        );
      }
    } catch (error) {
      logger.error('Error updating student reward:', error);
    }
  }
}
