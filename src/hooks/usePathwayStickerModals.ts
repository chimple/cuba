import React from 'react';
import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  COURSE_CHANGED,
  EVENTS,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../common/constants';
import { Util } from '../utility/util';
import { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';

export const usePathwayStickerModals = (ctx: any) => {
  const {
    hasCollectedStickerRef,
    hasCheckedStickerReplayEligibilityRef,
    hasPendingPathwayStickerReward,
    isStickerPreviewOpen,
    playStickerAudioAfterReload,
    playStickerAudioAndClearPending,
    setIsStickerCompletionOpen,
    setIsStickerPreviewOpen,
    setModalOpen,
    setStickerPreviewFlyoutMotion,
    setStickerPreviewLaunchMotion,
    shouldRefreshPathAfterCompletionRef,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewTrigger,
  } = ctx;
  const getDeferredStickerCompletionPayload = React.useCallback(() => {
    const raw = sessionStorage.getItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const payload = parsed?.payload;
      if (
        !payload ||
        typeof payload !== 'object' ||
        !payload.stickerBookId ||
        !Array.isArray(payload.collectedStickerIds)
      ) {
        return null;
      }

      return {
        source: payload.source ?? 'learning_pathway',
        stickerBookId: payload.stickerBookId,
        stickerBookTitle: payload.stickerBookTitle || 'Sticker Book',
        stickerBookSvgUrl: payload.stickerBookSvgUrl || '',
        collectedStickerIds: payload.collectedStickerIds,
        totalStickerCount:
          typeof payload.totalStickerCount === 'number'
            ? payload.totalStickerCount
            : payload.collectedStickerIds.length,
      } as StickerBookModalData;
    } catch {
      return null;
    }
  }, []);

  const refreshPathAfterRewardModal = React.useCallback(() => {
    if (!sessionStorage.getItem(REWARD_LEARNING_PATH)) return;

    sessionStorage.removeItem(REWARD_LEARNING_PATH);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
    }, 0);
  }, []);

  const closePathwayModal = React.useCallback(() => {
    setModalOpen(false);
    refreshPathAfterRewardModal();
  }, [refreshPathAfterRewardModal, setModalOpen]);

  const confirmPathwayModal = React.useCallback(() => {
    setModalOpen(false);
    refreshPathAfterRewardModal();
  }, [refreshPathAfterRewardModal, setModalOpen]);

  const closeStickerPreview = React.useCallback(
    (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => {
      if (!stickerPreviewData) return;
      const isDragPopup = stickerPreviewTrigger === 'pathway_completion_auto';
      Util.logEvent(
        isDragPopup
          ? EVENTS.STICKER_DRAG_POPUP_CLOSED
          : EVENTS.STICKER_PREVIEW_POPUP_CLOSED,
        {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: stickerPreviewData.stickerBookId,
          sticker_id: stickerPreviewData.nextStickerId,
          source: stickerPreviewData.source,
          close_reason: reason,
          trigger: stickerPreviewTrigger,
        },
      );
      setIsStickerPreviewOpen(false);
      setStickerPreviewLaunchMotion(null);
      setStickerPreviewFlyoutMotion(null);
      if (stickerPreviewTrigger === 'pathway_completion_auto') {
        hasCollectedStickerRef.current = true;
        hasCheckedStickerReplayEligibilityRef.current = true;
        sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        sessionStorage.removeItem(REWARD_LEARNING_PATH);
        const deferredCompletionPayload = getDeferredStickerCompletionPayload();
        if (deferredCompletionPayload) {
          shouldRefreshPathAfterCompletionRef.current = true;
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
                detail: deferredCompletionPayload,
              }),
            );
          }, 0);
        } else {
          playStickerAudioAfterReload();
          window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
          }, 0);
        }
      }
    },
    [
      getDeferredStickerCompletionPayload,
      playStickerAudioAfterReload,
      stickerPreviewData,
      stickerPreviewTrigger,
    ],
  );

  const closeStickerCompletion = React.useCallback(
    (reason: 'backdrop' | 'close_button') => {
      if (stickerCompletionData && reason === 'close_button') {
        Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_CLOSE, {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          source: stickerCompletionData.source,
          sticker_book_id: stickerCompletionData.stickerBookId,
          sticker_book_title: stickerCompletionData.stickerBookTitle,
          collected_count: stickerCompletionData.collectedStickerIds.length,
          total_stickers: stickerCompletionData.totalStickerCount,
        });
      }
      setIsStickerCompletionOpen(false);
      if (shouldRefreshPathAfterCompletionRef.current) {
        shouldRefreshPathAfterCompletionRef.current = false;
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
        }, 0);
      } else if (
        sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) ||
        hasPendingPathwayStickerReward()
      ) {
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          (window as any).__triggerPathwayReload__?.();
        }, 0);
      } else {
        playStickerAudioAndClearPending();
      }
    },
    [
      hasPendingPathwayStickerReward,
      playStickerAudioAndClearPending,
      playStickerAudioAfterReload,
      stickerCompletionData,
    ],
  );

  return {
    closePathwayModal,
    closeStickerCompletion,
    closeStickerPreview,
    confirmPathwayModal,
  };
};
