import { UtilLearningPaths } from './util.learningPaths';

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
export class UtilPathwayPersistence extends UtilLearningPaths {
  static [key: string]: any;
  static [key: string]: any;
}
