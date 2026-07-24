import {
  REWARD_LEARNING_PATH,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
} from '../common/constants';
import { UtilPathwayUpdates } from './util.pathwayUpdates';

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
export class UtilHomeworkPaths extends UtilPathwayUpdates {
  static [key: string]: any;
  protected static clearPathwayStickerRewardSession() {
    sessionStorage.removeItem(REWARD_LEARNING_PATH);
    sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
    sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
    sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
  }
}
