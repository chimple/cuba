import { useEffect } from 'react';
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';

import {
  PATHWAY_END_REWARD_BOX_VARIANT,
  STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  STICKER_BOOK_COMPLETION_POPUP,
  STICKER_BOOK_PREVIEW_ENABLED,
} from '../common/constants';
import { setCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import { useAppSelector } from '../redux/hooks';

export const usePathwayStickerFeatureFlags = () => {
  const liveIsStickerBookPreviewOn = useFeatureIsOn(
    STICKER_BOOK_PREVIEW_ENABLED,
  );
  const liveIsStickerBookCelebrationPopupOn = useFeatureIsOn(
    STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  );
  const liveIsStickerBookCompletionPopupOn = useFeatureIsOn(
    STICKER_BOOK_COMPLETION_POPUP,
  );
  const liveRewardBoxVariant = useFeatureValue(
    PATHWAY_END_REWARD_BOX_VARIANT,
    'mystery_box',
  );
  const cachedFeatureValues = useAppSelector(
    (state) => state.growthbook.featureValues,
  );
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStickerBookPreviewOn = isOffline
    ? ((cachedFeatureValues?.[STICKER_BOOK_PREVIEW_ENABLED] as boolean) ??
      liveIsStickerBookPreviewOn)
    : liveIsStickerBookPreviewOn;
  const isStickerBookCelebrationPopupOn = isOffline
    ? ((cachedFeatureValues?.[
        STICKER_BOOK_CELEBRATION_POPUP_ENABLED
      ] as boolean) ?? liveIsStickerBookCelebrationPopupOn)
    : liveIsStickerBookCelebrationPopupOn;
  const isStickerBookCompletionPopupOn = isOffline
    ? ((cachedFeatureValues?.[STICKER_BOOK_COMPLETION_POPUP] as boolean) ??
      liveIsStickerBookCompletionPopupOn)
    : liveIsStickerBookCompletionPopupOn;
  const rewardBoxVariant = isOffline
    ? ((cachedFeatureValues?.[PATHWAY_END_REWARD_BOX_VARIANT] as string) ??
      liveRewardBoxVariant)
    : liveRewardBoxVariant;

  useEffect(() => {
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_PREVIEW_ENABLED,
      liveIsStickerBookPreviewOn,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
      liveIsStickerBookCelebrationPopupOn,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_COMPLETION_POPUP,
      liveIsStickerBookCompletionPopupOn,
    );
    setCachedGrowthBookFeatureValue(
      PATHWAY_END_REWARD_BOX_VARIANT,
      liveRewardBoxVariant,
    );
  }, [
    liveIsStickerBookPreviewOn,
    liveIsStickerBookCelebrationPopupOn,
    liveIsStickerBookCompletionPopupOn,
    liveRewardBoxVariant,
  ]);

  return {
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    rewardBoxVariant,
  };
};
