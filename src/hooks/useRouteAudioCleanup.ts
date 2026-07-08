import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AudioUtil } from '../utility/AudioUtil';

export const useRouteAudioCleanup = () => {
  const location = useLocation();
  const lastLocationRef = useRef(location.pathname + location.search);

  useEffect(() => {
    const currentLocation = location.pathname + location.search;
    if (lastLocationRef.current !== currentLocation) {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      lastLocationRef.current = currentLocation;
    }
  }, [location.pathname, location.search]);
};
