import { registerPlugin } from '@capacitor/core';
import { TinCan } from 'tincants';
import { PortPlugin } from './common/constants';
import logger from './utility/logger';

export interface RespectActor {
  objectType?: 'Agent';
  name?: string | string[];
  mbox?: string | string[];
}

export interface RespectLaunchData {
  endpoint: string;
  auth: string;
  actor: RespectActor;
  activityId: string;
  registration: string;
}

const portPlugin = registerPlugin<PortPlugin>('Port');

const getActorMbox = (actor: RespectActor): string | null => {
  const mbox = actor.mbox;
  if (typeof mbox === 'string' && mbox.length > 0) return mbox;
  if (Array.isArray(mbox) && typeof mbox[0] === 'string' && mbox[0].length > 0)
    return mbox[0];

  return null;
};

const getActorName = (actor: RespectActor): string | null => {
  const name = actor.name;
  if (typeof name === 'string' && name.length > 0) return name;
  if (Array.isArray(name) && typeof name[0] === 'string' && name[0].length > 0)
    return name[0];

  return null;
};

export const getRespectLaunchData =
  async (): Promise<RespectLaunchData | null> => {
    try {
      const launchData = await portPlugin.sendLaunchData();
      const actor = JSON.parse(launchData.actor) as RespectActor;

      if (
        !launchData.endpoint ||
        !launchData.auth ||
        !launchData.lessonId ||
        !getActorMbox(actor)
      ) {
        return null;
      }

      return {
        endpoint: launchData.endpoint,
        auth: launchData.auth,
        actor,
        activityId: launchData.lessonId,
        registration: launchData.registration,
      };
    } catch (error) {
      logger.warn('RESPECT launch data is unavailable.', error);
      return null;
    }
  };

export const reinitializeTincan = async (
  launchData?: RespectLaunchData,
): Promise<TinCan | null> => {
  const activeLaunchData = launchData ?? (await getRespectLaunchData());
  if (!activeLaunchData) return null;

  try {
    const tincan = new TinCan({});
    tincan.addRecordStore({
      endpoint: activeLaunchData.endpoint,
      auth: activeLaunchData.auth,
    });
    return tincan;
  } catch (error) {
    logger.error('Failed to initialize the RESPECT xAPI client.', error);
    return null;
  }
};

export { getActorMbox, getActorName };
