import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFeatureValue } from '@growthbook/growthbook-react';
import { GENERIC_POP_UP, SHOW_GENERIC_POPUP } from '../common/constants';
import PopupManager from '../components/GenericPopUp/GenericPopUpManager';
import { PopupConfig } from '../components/GenericPopUp/GenericPopUpType';
import { logger } from '../utility/logger';

type PopupLocalizedContent = PopupConfig['content'][string];

type PopupEventDetail = {
  config: PopupConfig;
  localized: PopupLocalizedContent;
};

export const useGenericPopup = () => {
  const location = useLocation();
  const popupConfig = useFeatureValue<PopupConfig | null>(GENERIC_POP_UP, null);
  const [popupData, setPopupData] = useState<PopupEventDetail | null>(null);
  const popupDataRef = useRef<PopupEventDetail | null>(null);

  useEffect(() => {
    popupDataRef.current = popupData;
  }, [popupData]);

  useLayoutEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<PopupEventDetail>;
      logger.info('POPUP EVENT RECEIVED', customEvent.detail);
      setPopupData(customEvent.detail);
    };

    window.addEventListener(SHOW_GENERIC_POPUP, handler);
    return () => {
      window.removeEventListener(SHOW_GENERIC_POPUP, handler);
    };
  }, []);

  useEffect(() => {
    if (!popupConfig) return;

    const params = new URLSearchParams(location.search);
    const currentTab = params.get('tab');

    if (
      currentTab &&
      popupConfig.screen_name &&
      currentTab.toLowerCase() === popupConfig.screen_name.toLowerCase()
    ) {
      PopupManager.onAppOpen(popupConfig);
      PopupManager.onTimeElapsed(popupConfig);
    }
  }, [location.search, popupConfig]);

  const closePopup = () => {
    if (!popupData) return;
    PopupManager.onDismiss(popupData.config);
    setPopupData(null);
  };

  const actOnPopup = () => {
    if (!popupData) return;
    PopupManager.onAction(popupData.config);
    setPopupData(null);
  };

  return {
    popupData,
    popupDataRef,
    setPopupData,
    popupManager: PopupManager,
    closePopup,
    actOnPopup,
  };
};
