import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  CACHE_IMAGE,
  DOWNLOADING_CHAPTER_ID,
  DOWNLOAD_BUTTON_LOADING_STATUS,
  IS_CUBA,
  PortPlugin,
} from '../common/constants';
import { Util } from '../utility/util';
import { logger } from '../utility/logger';

interface ExtraData {
  notificationType?: string;
  rewardProfileId?: string;
  classId?: string;
}

type PluginListenerHandle = { remove: () => void };

type NotificationPortPlugin = PortPlugin & {
  addListener?: (
    eventName: 'notificationOpened',
    listenerFunc: (data: ExtraData | undefined) => void,
  ) => PluginListenerHandle | Promise<PluginListenerHandle>;
};

const processNotificationData = (data: ExtraData | undefined) => {
  Util.navigateTabByNotificationData(data);
};

const getNotificationData = async () => {
  if (!Capacitor.isNativePlatform()) return;

  if (!Util.port) Util.port = registerPlugin<PortPlugin>('Port');
  if (Util.port && typeof Util.port.fetchNotificationData === 'function') {
    try {
      const data = await Util.port.fetchNotificationData();
      if (data) {
        processNotificationData(data);
      }
    } catch (error) {
      logger.error('Error retrieving notification data:', error);
    }
  } else {
    logger.warn('Util.port or fetchNotificationData is not available.');
  }
};

const updateAvatarSuggestionJson = async () => {
  try {
  } catch (error) {
    logger.error('Util.migrateLocalJsonFile failed ', error);
  }
};

export const useNativeAppListeners = () => {
  useEffect(() => {
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(false));
    localStorage.setItem(DOWNLOADING_CHAPTER_ID, JSON.stringify(false));
    localStorage.setItem(IS_CUBA, '1');

    let appStateListener: PluginListenerHandle | undefined;
    let appUrlOpenListener: PluginListenerHandle | undefined;
    let notificationOpenedListener: PluginListenerHandle | undefined;

    void Promise.resolve(
      CapApp.addListener?.('appStateChange', Util.onAppStateChange),
    ).then((listener) => {
      appStateListener = listener;
    });

    if (Capacitor.isNativePlatform()) {
      const portPlugin = registerPlugin<NotificationPortPlugin>('Port');
      void Promise.resolve(
        portPlugin.addListener?.('notificationOpened', (data) => {
          if (data) {
            processNotificationData(data);
          }
        }),
      ).then((listener) => {
        notificationOpenedListener = listener;
      });

      void Promise.resolve(
        CapApp.addListener?.('appUrlOpen', Util.onAppUrlOpen),
      ).then((listener) => {
        appUrlOpenListener = listener;
      });

      void Filesystem.mkdir({
        path: CACHE_IMAGE,
        directory: Directory.Cache,
      }).catch((error) => {
        logger.error('Error in creating directory for cache', error);
      });
    }

    void Util.startFlexibleUpdate();
    Util.listenToNetwork();
    void getNotificationData();
    void Util.notificationListener((extraData: ExtraData | undefined) => {
      if (extraData) {
        Util.navigateTabByNotificationData(extraData);
      }
    });
    void updateAvatarSuggestionJson();

    return () => {
      appStateListener?.remove();
      appUrlOpenListener?.remove();
      notificationOpenedListener?.remove();
    };
  }, []);
};
