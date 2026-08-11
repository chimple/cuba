import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { MODES } from '../common/constants';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import { AudioUtil } from '../utility/AudioUtil';

const LAST_MODAL_SHOWN_KEY = 'lastTimeExceededShown';
const START_TIME_KEY = 'startTime';
const USED_TIME_KEY = 'usedTime';
const LAST_ACCESS_DATE_KEY = 'lastAccessDate';
const IS_INITIALIZED = 'isInitialized';

let timeoutId: NodeJS.Timeout;

export const useUsageLimitModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const showModalRef = useRef(showModal);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  const initializeUsage = useCallback(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    const lastAccessDate = localStorage.getItem(LAST_ACCESS_DATE_KEY);

    if (!lastAccessDate || lastAccessDate !== currentDate) {
      localStorage.setItem(USED_TIME_KEY, '0');
      localStorage.setItem(START_TIME_KEY, Date.now().toString());
      localStorage.setItem(LAST_ACCESS_DATE_KEY, currentDate);
    }

    if (!localStorage.getItem(IS_INITIALIZED)) {
      localStorage.setItem(START_TIME_KEY, Date.now().toString());
      localStorage.setItem(IS_INITIALIZED, 'true');
    }
  }, []);

  const calculateUsedTime = useCallback(() => {
    const currentTime = Date.now();
    const startTime = Number(
      localStorage.getItem(START_TIME_KEY) || currentTime,
    );
    const usedTime = Number(localStorage.getItem(USED_TIME_KEY));
    const sessionTime = (currentTime - startTime) / 1000;
    return usedTime + sessionTime;
  }, []);

  const saveUsedTime = useCallback(() => {
    localStorage.setItem(USED_TIME_KEY, calculateUsedTime().toString());
  }, [calculateUsedTime]);

  const clearExistingTimeout = useCallback(() => {
    clearTimeout(timeoutId);
  }, []);

  const checkTimeExceeded = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    const currMode = await schoolUtil.getCurrMode();
    if (currMode !== MODES.PARENT) return;

    const today = new Date().toISOString().split('T')[0];
    const lastModalShownDate = localStorage.getItem(LAST_MODAL_SHOWN_KEY);

    if (lastModalShownDate !== today) {
      setShowModal(true);
      window.dispatchEvent(
        new CustomEvent('shouldShowModal', { detail: true }),
      );
      localStorage.setItem(LAST_MODAL_SHOWN_KEY, today);
    }
  }, []);

  const startTimeout = useCallback(() => {
    clearExistingTimeout();
    const usedTime = Number(localStorage.getItem(USED_TIME_KEY) || 0);
    const remainingTime = Util.TIME_LIMIT - usedTime;
    if (remainingTime > 0) {
      timeoutId = setTimeout(() => {
        void checkTimeExceeded();
      }, remainingTime * 1000);
    }
  }, [checkTimeExceeded, clearExistingTimeout]);

  const handleVisibilityChange = useCallback(() => {
    const currentTime = Date.now();
    if (document.visibilityState === 'visible') {
      if (!localStorage.getItem(START_TIME_KEY)) {
        localStorage.setItem(START_TIME_KEY, currentTime.toString());
      }
      startTimeout();
    } else {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      saveUsedTime();
      localStorage.removeItem(START_TIME_KEY);
      clearExistingTimeout();
    }
  }, [clearExistingTimeout, saveUsedTime, startTimeout]);

  useEffect(() => {
    initializeUsage();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimeout();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearExistingTimeout();
    };
  }, [
    clearExistingTimeout,
    handleVisibilityChange,
    initializeUsage,
    startTimeout,
  ]);

  const continueAfterBreak = () => {
    setShowModal(false);
    setShowToast(true);
    localStorage.setItem(START_TIME_KEY, Date.now().toString());
  };

  return {
    showModal,
    showModalRef,
    setShowModal,
    showToast,
    setShowToast,
    continueAfterBreak,
  };
};
