import { useEffect } from 'react';

import logger from '../../utility/logger';
import { hasPendingHomeworkStickerFlow } from '../../utility/homeworkStickerFlow';

interface UseHomeworkDailyRewardModalVisibilityParams {
  isRewardFeatureOn: boolean;
  isStickerCompletionOpen: boolean;
  isStickerPreviewOpen: boolean;
  setRewardModalOpen: (open: boolean) => void;
  shouldShowDailyRewardModal: () => Promise<boolean>;
}

export const useHomeworkDailyRewardModalVisibility = ({
  isRewardFeatureOn,
  isStickerCompletionOpen,
  isStickerPreviewOpen,
  setRewardModalOpen,
  shouldShowDailyRewardModal,
}: UseHomeworkDailyRewardModalVisibilityParams) => {
  useEffect(() => {
    if (
      isStickerPreviewOpen ||
      isStickerCompletionOpen ||
      hasPendingHomeworkStickerFlow()
    ) {
      setRewardModalOpen(false);
      return;
    }

    const showModalIfNeeded = async () => {
      try {
        const showModal = await shouldShowDailyRewardModal();
        setRewardModalOpen(showModal);
      } catch (e) {
        logger.warn('Reward Modal Check failed offline');
      }
    };
    if (isRewardFeatureOn) {
      showModalIfNeeded();
    }
  }, [
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    setRewardModalOpen,
    shouldShowDailyRewardModal,
  ]);
};
