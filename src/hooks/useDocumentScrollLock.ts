import { useEffect } from 'react';

const LOCKED_SCROLL_STYLE = 'hidden';

export const useDocumentScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const bodyOverflow = document.body.style.overflow;
    const documentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = LOCKED_SCROLL_STYLE;
    document.documentElement.style.overflow = LOCKED_SCROLL_STYLE;

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = documentOverflow;
    };
  }, [isLocked]);
};
