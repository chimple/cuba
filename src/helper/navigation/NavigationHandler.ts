import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import type { History } from 'history';

type ReplaceHistory = Pick<History, 'replace'>;
type PendingNavigationTarget = string;

let historyRef: ReplaceHistory | null = null;
let pendingNavigationTargets: PendingNavigationTarget[] = [];

const flushPendingNavigationTargets = (): void => {
  if (!historyRef || pendingNavigationTargets.length < 1) {
    return;
  }

  const queuedTargets = pendingNavigationTargets;
  pendingNavigationTargets = [];

  for (const target of queuedTargets) {
    historyRef.replace(target);
  }
};

export const registerNavigationHandler = (history: ReplaceHistory): void => {
  historyRef = history;
  flushPendingNavigationTargets();
};

export const unregisterNavigationHandler = (): void => {
  historyRef = null;
};

export const replaceWithNavigationTarget = (url: string): void => {
  if (!historyRef) {
    pendingNavigationTargets.push(url);
    return;
  }

  historyRef.replace(url);
};

export const useNavigationHandler = () => {
  const history = useHistory();

  useEffect(() => {
    registerNavigationHandler(history);

    return () => {
      unregisterNavigationHandler();
    };
  }, [history]);

  return {
    navigateTo: replaceWithNavigationTarget,
  };
};
