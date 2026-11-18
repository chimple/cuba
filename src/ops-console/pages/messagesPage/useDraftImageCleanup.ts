import { useEffect } from 'react';

export const useDraftImageCleanup = (imageUrl: string) => {
  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );
};
