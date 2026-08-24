import { Capacitor, registerPlugin } from '@capacitor/core';
import { Statement, TinCan } from 'tincants';
import { PortPlugin } from './common/constants';
import logger from './utility/logger';

export interface RespectActor {
  objectType?: 'Agent';
  name?: string | string[];
  mbox?: string | string[];
  account?: {
    homePage?: string;
    name?: string;
  };
}

export interface RespectLaunchData {
  endpoint: string;
  auth: string;
  actor: RespectActor;
  activityId: string;
  registration: string;
  xapiIpcPackage: string;
}

type XapiStatement = ReturnType<Statement['asVersion']>;

interface RespectXapiPlugin {
  postStatement(options: {
    endpoint: string;
    auth: string;
    ipcPackage: string;
    statement: XapiStatement;
  }): Promise<{ postedStatementIds: string }>;
}

function registerCapacitorPlugin<T>(name: string): T {
  // Jest component mocks often provide Capacitor.isNativePlatform only. Keep
  // importing the analytics layer harmless when native plugin registration is
  // unavailable; native builds still use Capacitor's real registrar.
  if (typeof registerPlugin !== 'function') return {} as T;
  return registerPlugin<T>(name);
}

const portPlugin = registerCapacitorPlugin<PortPlugin>('Port');
const respectXapiPlugin = registerCapacitorPlugin<RespectXapiPlugin>(
  'RespectXapi',
);

interface RespectLaunchParameters {
  endpoint: string;
  auth: string;
  actor: string;
  registration: string;
  lessonId: string;
  xapiIpcPackage: string;
}

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

const toRespectLaunchData = (
  launchParameters: RespectLaunchParameters,
): RespectLaunchData | null => {
  try {
    const actor = JSON.parse(launchParameters.actor) as RespectActor;

    if (
      !launchParameters.endpoint ||
      !launchParameters.auth ||
      !launchParameters.lessonId ||
      !getActorIdentifier(actor)
    ) {
      return null;
    }

    return {
      endpoint: launchParameters.endpoint,
      auth: launchParameters.auth,
      actor,
      activityId: launchParameters.lessonId,
      registration: launchParameters.registration,
      xapiIpcPackage: launchParameters.xapiIpcPackage,
    };
  } catch {
    return null;
  }
};

const getRespectLaunchDataFromUrl = (): RespectLaunchData | null => {
  const searchParameters = new URLSearchParams(window.location.search);

  return toRespectLaunchData({
    endpoint: searchParameters.get('endpoint') ?? '',
    auth: searchParameters.get('auth') ?? '',
    actor: searchParameters.get('actor') ?? '',
    registration: searchParameters.get('registration') ?? '',
    lessonId: searchParameters.get('activity_id') ?? '',
    xapiIpcPackage: searchParameters.get('xapiIpcPackage') ?? '',
  });
};

export const getRespectLaunchData =
  async (): Promise<RespectLaunchData | null> => {
    try {
      const nativeLaunchData = toRespectLaunchData(
        await portPlugin.sendLaunchData(),
      );

      return nativeLaunchData ?? getRespectLaunchDataFromUrl();
    } catch {
      return getRespectLaunchDataFromUrl();
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

export const usesRespectXapiIpc = (launchData: RespectLaunchData): boolean =>
  Capacitor.isNativePlatform() && launchData.xapiIpcPackage.length > 0;

export const sendRespectXapiStatement = async (
  launchData: RespectLaunchData,
  statement: Statement,
): Promise<{ postedStatementIds: string }> => {
  if (!usesRespectXapiIpc(launchData)) {
    throw new Error('RESPECT xAPI IPC service is unavailable.');
  }

  return respectXapiPlugin.postStatement({
    endpoint: launchData.endpoint,
    auth: launchData.auth,
    ipcPackage: launchData.xapiIpcPackage,
    statement: statement.asVersion('1.0.3'),
  });
};

const getActorAccount = (
  actor: RespectActor,
): { homePage: string; name: string } | null => {
  const homePage = actor.account?.homePage;
  const name = actor.account?.name;

  return homePage && name ? { homePage, name } : null;
};

const getActorIdentifier = (actor: RespectActor): string | null =>
  getActorMbox(actor) ?? getActorAccount(actor)?.name ?? null;

const toXapiAgent = (
  actor: RespectActor,
): {
  objectType: 'Agent';
  name?: string;
  mbox?: string;
  account?: { homePage: string; name: string };
} => {
  const name = getActorName(actor) ?? undefined;
  const mbox = getActorMbox(actor);

  if (mbox) {
    return { objectType: 'Agent', name, mbox };
  }

  const account = getActorAccount(actor);
  if (!account) {
    throw new Error('RESPECT launch actor has no xAPI identifier.');
  }

  return { objectType: 'Agent', name, account };
};

export {
  getActorAccount,
  getActorIdentifier,
  getActorMbox,
  getActorName,
  toXapiAgent,
};
