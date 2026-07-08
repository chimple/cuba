import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { GENERIC_POP_UP, SHOW_GENERIC_POPUP } from '../common/constants';
import PopupManager from '../components/GenericPopUp/GenericPopUpManager';
import { logger } from '../utility/logger';

export const useGenericPopup = () => {
  const growthbook = useGrowthBook();
  const location = useLocation();
  const [popupData, setPopupData] = useState<any>(null);
  const popupDataRef = useRef<any>(null);

  useEffect(() => {
    popupDataRef.current = popupData;
  }, [popupData]);

  useLayoutEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      logger.info('POPUP EVENT RECEIVED', customEvent.detail);
      setPopupData(customEvent.detail);
    };

    window.addEventListener(SHOW_GENERIC_POPUP, handler);
    return () => {
      window.removeEventListener(SHOW_GENERIC_POPUP, handler);
    };
  }, []);

  useEffect(() => {
    if (!growthbook) return;

    const popupConfig = growthbook.getFeatureValue(GENERIC_POP_UP, null) as any;
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
  }, [growthbook, location.search]);

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
