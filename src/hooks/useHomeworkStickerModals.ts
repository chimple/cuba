import { useCallback, RefObject } from 'react';

import { getPathwayStickerCollectedEvent } from '../analytics/rewardEvents';
import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  EVENTS,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../common/constants';
import {
  StickerBookModalData,
  StickerBookPreviewVariant,
} from '../components/learningPathway/StickerBookPreviewModal.logic';
import {
  clearPendingFinalHomeworkStickerFlow,
  hasPendingFinalHomeworkStickerFlow,
} from '../utility/homeworkStickerFlow';
import { Util } from '../utility/util';
import logger from '../utility/logger';
import { getStickerImageFallbackFromBookSvg } from './useHomeworkStickerAssets';

interface UseHomeworkStickerModalsParams {
  api: {
    getCurrentStickerBookWithProgress: (
      studentId: string,
    ) => Promise<{
      book?: {
        id: string;
        title?: string | null;
        svg_url?: string | null;
      } | null;
      progress?: { stickers_collected?: string[] | null } | null;
    } | null>;
    getNextWinnableSticker: (
      stickerBookId: string,
      studentId: string,
    ) => Promise<string | null>;
    getStickersByIds: (
      stickerIds: string[],
    ) => Promise<{ image?: string | null; name?: string | null }[] | null>;
  };
  getStickerRewardBoxElement: () => Element | null | undefined;
  hasCollectedStickerRef: RefObject<boolean>;
  hasCheckedStickerReplayEligibilityRef: RefObject<boolean>;
  hasPendingPathwayStickerReward: () => boolean;
  lastStickerCompletionOpenKeyRef: RefObject<string | null>;
  playStickerAudioAfterReload: () => void;
  playStickerAudioAndClearPending: (onPlaybackStop?: () => void) => void;
  playStickerAudioAndFinishHomework: () => void;
  reloadHomeworkPathway: () => void;
  setIsStickerCompletionOpen: (open: boolean) => void;
  setIsStickerPreviewOpen: (open: boolean) => void;
  setStickerCompletionData: (data: StickerBookModalData | null) => void;
  setStickerPreviewData: (data: StickerBookModalData | null) => void;
  setStickerPreviewFlyoutMotion: (
    motion: { offsetX: number; offsetY: number; endScale: number } | null,
  ) => void;
  setStickerPreviewLaunchMotion: (
    motion: { offsetX: number; offsetY: number; startScale: number } | null,
  ) => void;
  setStickerPreviewTrigger: (trigger: StickerBookPreviewVariant) => void;
  shouldRefreshPathAfterCompletionRef: RefObject<boolean>;
  stickerCompletionData: StickerBookModalData | null;
  stickerPreviewData: StickerBookModalData | null;
  stickerPreviewTrigger: StickerBookPreviewVariant;
  clearPendingPathwayStickerReward: () => void;
}

export const useHomeworkStickerModals = ({
  api,
  clearPendingPathwayStickerReward,
  getStickerRewardBoxElement,
  hasCollectedStickerRef,
  hasCheckedStickerReplayEligibilityRef,
  hasPendingPathwayStickerReward,
  lastStickerCompletionOpenKeyRef,
  playStickerAudioAfterReload,
  playStickerAudioAndClearPending,
  playStickerAudioAndFinishHomework,
  reloadHomeworkPathway,
  setIsStickerCompletionOpen,
  setIsStickerPreviewOpen,
  setStickerCompletionData,
  setStickerPreviewData,
  setStickerPreviewFlyoutMotion,
  setStickerPreviewLaunchMotion,
  setStickerPreviewTrigger,
  shouldRefreshPathAfterCompletionRef,
  stickerCompletionData,
  stickerPreviewData,
  stickerPreviewTrigger,
}: UseHomeworkStickerModalsParams) => {
  const getStickerPreviewPayload = useCallback(
    async (
      forcedStickerId?: string,
      preAwardCollectedStickerIds?: string[],
      persistedBookContext?: {
        stickerBookId?: string | null;
        stickerBookTitle?: string | null;
        stickerBookSvgUrl?: string | null;
      } | null,
    ): Promise<StickerBookModalData | null> => {
      try {
        const currentStudent = Util.getCurrentStudent();
        if (!currentStudent?.id) return null;

        let book: {
          id: string;
          title?: string | null;
          svg_url?: string | null;
        } | null = null;
        let progress: { stickers_collected?: string[] | null } | null = null;

        if (
          persistedBookContext?.stickerBookId &&
          persistedBookContext.stickerBookSvgUrl
        ) {
          book = {
            id: persistedBookContext.stickerBookId,
            title: persistedBookContext.stickerBookTitle ?? 'Sticker Book',
            svg_url: persistedBookContext.stickerBookSvgUrl,
          };
        } else {
          const currentBookWithProgress =
            await api.getCurrentStickerBookWithProgress(currentStudent.id);
          if (!currentBookWithProgress?.book) return null;
          book = currentBookWithProgress.book;
          progress = currentBookWithProgress.progress ?? null;
        }

        const collectedStickerIds = Array.isArray(preAwardCollectedStickerIds)
          ? preAwardCollectedStickerIds
          : (progress?.stickers_collected ?? []);
        const nextStickerId =
          forcedStickerId ??
          (await api.getNextWinnableSticker(book.id, currentStudent.id));
        if (!nextStickerId) return null;

        const visibleCollectedStickerIds = forcedStickerId
          ? collectedStickerIds.filter((id: string) => id !== forcedStickerId)
          : collectedStickerIds;

        const nextStickerDetails = await api.getStickersByIds([nextStickerId]);
        const nextSticker = nextStickerDetails?.[0];
        let nextStickerImage = nextSticker?.image || undefined;

        if (!nextStickerImage && book.svg_url) {
          try {
            const dataUrl = await getStickerImageFallbackFromBookSvg(
              book.svg_url,
              nextStickerId,
            );
            if (dataUrl) nextStickerImage = dataUrl;
          } catch (error) {
            logger.warn(
              '[StickerBook] Failed to build sticker preview image from book SVG',
              error,
            );
          }
        }

        return {
          source: 'homework_pathway',
          stickerBookId: book.id,
          stickerBookTitle: book.title || 'Sticker Book',
          stickerBookSvgUrl: book.svg_url || '',
          collectedStickerIds: visibleCollectedStickerIds,
          nextStickerId,
          nextStickerName: nextSticker?.name || 'Sticker',
          nextStickerImage,
        };
      } catch (error) {
        logger.error(
          'Failed to build homework sticker preview payload:',
          error,
        );
        return null;
      }
    },
    [api],
  );

  const getPersistedStickerCompletionPayload = useCallback(() => {
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
        source: payload.source ?? 'homework_pathway',
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

  const openStickerCompletion = useCallback((data: StickerBookModalData) => {
    const completionKey = [
      data.source,
      data.stickerBookId,
      data.collectedStickerIds.length,
      data.totalStickerCount,
    ].join(':');

    if (lastStickerCompletionOpenKeyRef.current === completionKey) {
      return;
    }

    lastStickerCompletionOpenKeyRef.current = completionKey;
    if (data.collectedStickerIds.length > 0) {
      hasCollectedStickerRef.current = true;
      hasCheckedStickerReplayEligibilityRef.current = true;
    }

    setStickerCompletionData(data);
    setIsStickerCompletionOpen(true);
    Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_OPEN, {
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: data.source,
      sticker_book_id: data.stickerBookId,
      sticker_book_title: data.stickerBookTitle,
      collected_count: data.collectedStickerIds.length,
      total_stickers: data.totalStickerCount,
    });
  }, [
    hasCheckedStickerReplayEligibilityRef,
    hasCollectedStickerRef,
    lastStickerCompletionOpenKeyRef,
    setIsStickerCompletionOpen,
    setStickerCompletionData,
  ]);

  const handleStickerPreviewReady = useCallback(
    (
      data: StickerBookModalData,
      trigger: 'sticker_click' | 'pathway_completion_auto',
    ) => {
      if (data.collectedStickerIds.length > 0) {
        hasCollectedStickerRef.current = true;
        hasCheckedStickerReplayEligibilityRef.current = true;
      }

      const rewardBoxRect =
        getStickerRewardBoxElement()?.getBoundingClientRect();
      if (trigger === 'pathway_completion_auto' && rewardBoxRect) {
        setStickerPreviewLaunchMotion({
          offsetX:
            rewardBoxRect.left +
            rewardBoxRect.width / 2 -
            window.innerWidth / 2,
          offsetY:
            rewardBoxRect.top +
            rewardBoxRect.height / 2 -
            window.innerHeight / 2,
          startScale: Math.max(0.12, Math.min(0.28, rewardBoxRect.width / 736)),
        });
      } else {
        setStickerPreviewLaunchMotion(null);
      }

      const profileAvatarRect = document
        .querySelector('[data-profile-avatar-anchor="true"]')
        ?.getBoundingClientRect();
      if (profileAvatarRect) {
        setStickerPreviewFlyoutMotion({
          offsetX:
            profileAvatarRect.right -
            profileAvatarRect.width * 0.25 -
            window.innerWidth / 2,
          offsetY:
            profileAvatarRect.top +
            profileAvatarRect.height * 0.3 -
            window.innerHeight / 2,
          endScale: Math.max(
            0.1,
            Math.min(0.24, profileAvatarRect.width / 736),
          ),
        });
      } else {
        setStickerPreviewFlyoutMotion(null);
      }

      setStickerPreviewData(data);
      setStickerPreviewTrigger(
        trigger === 'pathway_completion_auto' ? 'drag_collect' : 'preview',
      );
      setIsStickerPreviewOpen(true);
      const isDragPopup = trigger === 'pathway_completion_auto';
      Util.logEvent(
        isDragPopup
          ? EVENTS.STICKER_DRAG_POPUP_SHOWN
          : EVENTS.STICKER_PREVIEW_POPUP_SHOWN,
        {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: data.stickerBookId,
          sticker_id: data.nextStickerId,
          source: data.source,
          trigger,
        },
      );
      if (isDragPopup) {
        Util.logEvent(getPathwayStickerCollectedEvent(data.source), {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: data.stickerBookId,
          sticker_id: data.nextStickerId,
          source: data.source,
          trigger,
        });
      }
    },
    [
      getStickerRewardBoxElement,
      hasCheckedStickerReplayEligibilityRef,
      hasCollectedStickerRef,
      setIsStickerPreviewOpen,
      setStickerPreviewData,
      setStickerPreviewFlyoutMotion,
      setStickerPreviewLaunchMotion,
      setStickerPreviewTrigger,
    ],
  );

  const closeStickerPreview = useCallback(
    (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => {
      if (!stickerPreviewData) return;
      const isDragPopup = stickerPreviewTrigger === 'drag_collect';
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
          trigger: isDragPopup ? 'pathway_completion_auto' : 'sticker_click',
        },
      );

      setIsStickerPreviewOpen(false);
      setStickerPreviewLaunchMotion(null);
      setStickerPreviewFlyoutMotion(null);

      if (!isDragPopup) return;

      hasCollectedStickerRef.current = true;
      hasCheckedStickerReplayEligibilityRef.current = true;
      sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
      const deferredCompletionPayload = getPersistedStickerCompletionPayload();

      if (deferredCompletionPayload) {
        shouldRefreshPathAfterCompletionRef.current = true;
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
              detail: deferredCompletionPayload,
            }),
          );
        }, 0);
        return;
      }

      if (hasPendingFinalHomeworkStickerFlow()) {
        playStickerAudioAndFinishHomework();
        return;
      }

      playStickerAudioAfterReload();
      window.setTimeout(() => {
        reloadHomeworkPathway();
      }, 0);
    },
    [
      getPersistedStickerCompletionPayload,
      hasCheckedStickerReplayEligibilityRef,
      hasCollectedStickerRef,
      playStickerAudioAfterReload,
      playStickerAudioAndFinishHomework,
      reloadHomeworkPathway,
      setIsStickerPreviewOpen,
      setStickerPreviewFlyoutMotion,
      setStickerPreviewLaunchMotion,
      shouldRefreshPathAfterCompletionRef,
      stickerPreviewData,
      stickerPreviewTrigger,
    ],
  );

  const closeStickerCompletion = useCallback(
    (reason: 'backdrop' | 'close_button' | 'acknowledge_button') => {
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

      if (reason === 'acknowledge_button') {
        shouldRefreshPathAfterCompletionRef.current = false;
        clearPendingFinalHomeworkStickerFlow();
        clearPendingPathwayStickerReward();
        sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
        return;
      }

      if (hasPendingFinalHomeworkStickerFlow()) {
        playStickerAudioAndFinishHomework();
        return;
      }

      if (shouldRefreshPathAfterCompletionRef.current) {
        shouldRefreshPathAfterCompletionRef.current = false;
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          reloadHomeworkPathway();
        }, 0);
        return;
      }

      if (
        sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) ||
        hasPendingPathwayStickerReward()
      ) {
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          reloadHomeworkPathway();
        }, 0);
        return;
      }

      playStickerAudioAndClearPending();
    },
    [
      clearPendingPathwayStickerReward,
      hasPendingPathwayStickerReward,
      playStickerAudioAfterReload,
      playStickerAudioAndClearPending,
      playStickerAudioAndFinishHomework,
      reloadHomeworkPathway,
      setIsStickerCompletionOpen,
      shouldRefreshPathAfterCompletionRef,
      stickerCompletionData,
    ],
  );

  return {
    closeStickerCompletion,
    closeStickerPreview,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleStickerPreviewReady,
    openStickerCompletion,
  };
};
