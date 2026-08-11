import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGES } from '../common/constants';

export const useOpsConsoleBodyClass = () => {
  const location = useLocation();

  useEffect(() => {
    const isOpsConsoleRoute = location.pathname.includes(PAGES.SIDEBAR_PAGE);

    if (isOpsConsoleRoute) {
      document.body.classList.add('ops-console');
    } else {
      document.body.classList.remove('ops-console');
    }

    return () => {
      document.body.classList.remove('ops-console');
    };
  }, [location.pathname]);
};
