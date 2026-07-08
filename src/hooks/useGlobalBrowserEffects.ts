import { useEffect, useState } from 'react';
import {
  SEARCH_LESSON_CACHE_KEY,
  SEARCH_LESSON_HISTORY,
} from '../common/constants';
import { initializeClickListener } from '../analytics/clickUtil';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';

export const useGlobalBrowserEffects = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();

  useEffect(() => {
    const handleClick = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        selection.removeAllRanges();
      }
    };

    document.addEventListener('click', handleClick);
    localStorage.removeItem(SEARCH_LESSON_CACHE_KEY);
    localStorage.removeItem(SEARCH_LESSON_HISTORY);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    const cleanupClickListener = initializeClickListener();

    const handleOnline = () => {
      if (!online) {
        setOnline(true);
        presentToast({
          message: 'Device is online.',
          color: 'success',
          duration: 3000,
          position: 'bottom',
          buttons: [{ text: 'Dismiss', role: 'cancel' }],
        });
      }
    };

    const handleOffline = () => {
      setOnline(false);
      presentToast({
        message: 'Device is offline.',
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [{ text: 'Dismiss', role: 'cancel' }],
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupClickListener();
    };
  }, [online, presentToast]);
};
