import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';

import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  CURRENT_STUDENT_CHANGED_EVENT,
  EVENTS,
  HOMEWORK_PATHWAY,
  PATHWAY_END_REWARD_BOX_VARIANT,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  STICKER_BOOK_COMPLETION_POPUP,
  STICKER_BOOK_COMPLETION_READY_EVENT,
  STICKER_BOOK_PREVIEW_ENABLED,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { AudioUtil } from '../utility/AudioUtil';
import {
  StickerBookModalData,
  StickerBookPreviewVariant,
} from '../components/learningPathway/StickerBookPreviewModal.logic';
import { extractStickerSvg } from '../components/common/SvgHelpers';
import { fetchStickerBookSvgText } from '../utility/stickerBookAssets';
import { setCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import { useAppSelector } from '../redux/hooks';
import logger from '../utility/logger';
import {
  clearPendingFinalHomeworkStickerFlow,
  hasPendingFinalHomeworkStickerFlow,
} from '../utility/homeworkStickerFlow';

const STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH = '/assets/audios';
const STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX =
  'congrats_on_sticker_collection.mp3';
const STICKER_REWARD_BOX_SELECTOR = '.PathwayStructure-end-reward-box--sticker';
const STICKER_REWARD_BOX_OPEN_CLASS =
  'PathwayStructure-end-reward-box--sticker-open';
const STICKER_REWARD_BOX_CLOSE_CLASS =
  'PathwayStructure-end-reward-box--sticker-close-anim';
const STICKER_REWARD_BOX_TILT_CLASS =
  'PathwayStructure-end-reward-box--sticker-clicked';
const CROWD_CHEER_AUDIO_URL = '/assets/audios/common/crowd_cheer.mp3';
const stickerDataUrlCache: Record<string, string> = {};

type PlaybackStateConfig = {
  stateMachine?: string;
  inputName?: string;
  stateValue?: number;
  animationName?: string;
};

interface UseHomeworkStickerParams {
  containerRef: RefObject<HTMLDivElement | null>;
  riveContainer: HTMLDivElement | null;
  currentMascotStateValue: number;
  reloadHomeworkPathway: () => void;
  onFinalHomeworkStickerComplete?: () => void;
  playMascotAudioFromLocalPath: (
    localAudioPath: string,
    stateConfig?: PlaybackStateConfig,
    playbackOptions?: {
      onPlaybackStop?: () => void;
    },
  ) => Promise<boolean>;
  playRewardAudio: (stateValue?: number) => Promise<void>;
}

const getStickerCollectMascotAudioPath = (languageCode?: string) => {
  const normalizedLanguageCode = languageCode?.toLowerCase().split('-')[0];
  const resolvedLanguageCode = normalizedLanguageCode || 'en';
  return `${STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH}/${resolvedLanguageCode}_${STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX}`;
};

const getStickerImageFallbackFromBookSvg = async (
  stickerBookSvgUrl: string,
  stickerId: string,
) => {
  const cacheKey = `${stickerBookSvgUrl}::${stickerId}`;
  const cached = stickerDataUrlCache[cacheKey];
  if (cached) return cached;

  let stickerSvg: string | null = null;
  try {
    const text = await fetchStickerBookSvgText(stickerBookSvgUrl);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = text;
    const svgNode = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (svgNode) {
      stickerSvg = extractStickerSvg(svgNode, stickerId);
    }
  } catch {
    stickerSvg = null;
  }

  if (!stickerSvg) return null;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stickerSvg)}`;
  stickerDataUrlCache[cacheKey] = dataUrl;
  return dataUrl;
};

export function useHomeworkSticker({
  containerRef,
  riveContainer,
  currentMascotStateValue,
  reloadHomeworkPathway,
  onFinalHomeworkStickerComplete,
  playMascotAudioFromLocalPath,
  playRewardAudio,
}: UseHomeworkStickerParams) {
  const api = ServiceConfig.getI().apiHandler;
  const [stickerPreviewData, setStickerPreviewData] =
    useState<StickerBookModalData | null>(null);
  const [isStickerPreviewOpen, setIsStickerPreviewOpen] = useState(false);
  const [stickerPreviewTrigger, setStickerPreviewTrigger] =
    useState<StickerBookPreviewVariant>('preview');
  const [stickerPreviewLaunchMotion, setStickerPreviewLaunchMotion] = useState<{
    offsetX: number;
    offsetY: number;
    startScale: number;
  } | null>(null);
  const [stickerPreviewFlyoutMotion, setStickerPreviewFlyoutMotion] = useState<{
    offsetX: number;
    offsetY: number;
    endScale: number;
  } | null>(null);
  const [stickerCompletionData, setStickerCompletionData] =
    useState<StickerBookModalData | null>(null);
  const [isStickerCompletionOpen, setIsStickerCompletionOpen] = useState(false);
  const [isStickerCollectSpeaking, setIsStickerCollectSpeaking] =
    useState(false);
  const [
    shouldCelebrateAfterPathwayReload,
    setShouldCelebrateAfterPathwayReload,
  ] = useState(false);

  const lastStickerCompletionOpenKeyRef = useRef<string | null>(null);
  const shouldRefreshPathAfterCompletionRef = useRef(false);
  const isStickerCollectSpeakingRef = useRef(false);
  const hasCollectedStickerRef = useRef(false);
  const hasCheckedStickerReplayEligibilityRef = useRef(false);
  const pendingCelebrationRiveContainerRef = useRef<Element | null>(null);
  const latestRiveContainerRef = useRef<Element | null>(null);
  const rewardAudioSequenceRef = useRef({
    rewardId: null as string | null,
    crowdComplete: false,
    rewardReady: false,
    suppressed: false,
    stateValue: null as number | null,
    token: 0,
  });

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

  const getStickerRewardBoxElement = useCallback(
    () => containerRef.current?.querySelector(STICKER_REWARD_BOX_SELECTOR),
    [containerRef],
  );

  const setStickerCollectTiltActive = useCallback(
    (active: boolean) => {
      isStickerCollectSpeakingRef.current = active;
      setIsStickerCollectSpeaking(active);
      const rewardBox = getStickerRewardBoxElement();
      if (!rewardBox) return;

      if (active) {
        rewardBox.classList.remove(
          STICKER_REWARD_BOX_OPEN_CLASS,
          STICKER_REWARD_BOX_CLOSE_CLASS,
        );
        rewardBox.classList.add(STICKER_REWARD_BOX_TILT_CLASS);
      } else {
        rewardBox.classList.remove(STICKER_REWARD_BOX_TILT_CLASS);
      }
    },
    [getStickerRewardBoxElement],
  );

  const clearPendingPathwayStickerReward = useCallback(() => {
    sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
  }, []);

  const hasPendingPathwayStickerReward = useCallback(() => {
    const raw = sessionStorage.getItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
    const currentStudentId = Util.getCurrentStudent()?.id;
    if (!raw || !currentStudentId) return false;

    try {
      const parsed = JSON.parse(raw);
      return Boolean(
        parsed?.studentId === currentStudentId && parsed?.awardedStickerId,
      );
    } catch {
      return false;
    }
  }, []);

  const finishHomeworkAfterStickerFlow = useCallback(() => {
    shouldRefreshPathAfterCompletionRef.current = false;
    clearPendingFinalHomeworkStickerFlow();
    clearPendingPathwayStickerReward();
    sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
    sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
    localStorage.removeItem(HOMEWORK_PATHWAY);
    onFinalHomeworkStickerComplete?.();
  }, [clearPendingPathwayStickerReward, onFinalHomeworkStickerComplete]);

  const resetRewardAudioSequence = useCallback(() => {
    rewardAudioSequenceRef.current = {
      ...rewardAudioSequenceRef.current,
      rewardId: null,
      crowdComplete: false,
      rewardReady: false,
      suppressed: false,
      stateValue: null,
    };
  }, []);

  const shouldSuppressRewardAudioForStickerBook = useCallback(() => {
    const currentStudentId = Util.getCurrentStudent()?.id;
    if (!currentStudentId) return false;

    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) || 'null',
      );
      return Boolean(
        parsed?.studentId === currentStudentId && parsed?.awardedStickerId,
      );
    } catch {
      return false;
    }
  }, []);

  const playStickerCollectMascotAudio = useCallback(
    async (
      localAudioPath: string,
      onPlaybackStop?: () => void,
    ): Promise<boolean> => {
      if (!localAudioPath) {
        onPlaybackStop?.();
        return false;
      }
      setStickerCollectTiltActive(true);
      const didStartPlayback = await playMascotAudioFromLocalPath(
        localAudioPath,
        {
          stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
          inputName: CHIMPLE_MASCOT_INPUT_REWARD,
        },
        {
          onPlaybackStop: () => {
            setStickerCollectTiltActive(false);
            onPlaybackStop?.();
          },
        },
      );

      if (!didStartPlayback) {
        setStickerCollectTiltActive(false);
        onPlaybackStop?.();
      }

      return didStartPlayback;
    },
    [playMascotAudioFromLocalPath, setStickerCollectTiltActive],
  );

  const playStickerAudio = useCallback(
    async (onPlaybackStop?: () => void): Promise<boolean> => {
      if (!hasCollectedStickerRef.current) {
        onPlaybackStop?.();
        return false;
      }
      const studentLanguageCode = await AudioUtil.getAudioLanguageCode();
      const localAudioPath =
        getStickerCollectMascotAudioPath(studentLanguageCode);
      if (localAudioPath) {
        return playStickerCollectMascotAudio(localAudioPath, onPlaybackStop);
      }
      onPlaybackStop?.();
      return false;
    },
    [playStickerCollectMascotAudio],
  );

  const playStickerAudioAndClearPending = useCallback(
    (onPlaybackStop?: () => void) => {
      clearPendingPathwayStickerReward();
      return playStickerAudio(onPlaybackStop);
    },
    [clearPendingPathwayStickerReward, playStickerAudio],
  );

  const playStickerAudioAndFinishHomework = useCallback(() => {
    void playStickerAudioAndClearPending(() => {
      finishHomeworkAfterStickerFlow();
    });
  }, [finishHomeworkAfterStickerFlow, playStickerAudioAndClearPending]);

  const playStickerAudioAfterReload = useCallback(() => {
    pendingCelebrationRiveContainerRef.current = latestRiveContainerRef.current;
    setShouldCelebrateAfterPathwayReload(true);
  }, []);

  const canReplayStickerAudio = useCallback(async (): Promise<boolean> => {
    if (hasCollectedStickerRef.current) return true;
    if (hasCheckedStickerReplayEligibilityRef.current) return false;
    const student = Util.getCurrentStudent();
    if (!student?.id) return false;

    try {
      const current = await api.getCurrentStickerBookWithProgress(student.id);
      const hasAnySticker =
        (current?.progress?.stickers_collected?.length ?? 0) > 0;
      hasCollectedStickerRef.current = hasAnySticker;
      hasCheckedStickerReplayEligibilityRef.current = true;
      return hasAnySticker;
    } catch {
      return false;
    }
  }, [api]);

  const handleMascotReplayClick = useCallback(() => {
    if (isStickerCollectSpeakingRef.current) return;
    void (async () => {
      if (!(await canReplayStickerAudio())) return;
      playStickerAudio();
    })();
  }, [canReplayStickerAudio, playStickerAudio]);

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
          progress = currentBookWithProgress.progress;
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
  }, []);

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
    },
    [getStickerRewardBoxElement],
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
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          reloadHomeworkPathway();
        }, 0);
        return;
      }

      playStickerAudioAfterReload();
      window.setTimeout(() => {
        reloadHomeworkPathway();
      }, 0);
    },
    [
      getPersistedStickerCompletionPayload,
      playStickerAudioAfterReload,
      reloadHomeworkPathway,
      stickerPreviewData,
      stickerPreviewTrigger,
    ],
  );

  const closeStickerCompletion = useCallback(
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

      if (hasPendingFinalHomeworkStickerFlow()) {
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          reloadHomeworkPathway();
        }, 0);
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
      hasPendingPathwayStickerReward,
      playStickerAudioAfterReload,
      playStickerAudioAndClearPending,
      reloadHomeworkPathway,
      stickerCompletionData,
    ],
  );

  const resetStickerCelebrationState = useCallback(() => {
    pendingCelebrationRiveContainerRef.current = null;
    latestRiveContainerRef.current = null;
    hasCollectedStickerRef.current = false;
    hasCheckedStickerReplayEligibilityRef.current = false;
    isStickerCollectSpeakingRef.current = false;
    setShouldCelebrateAfterPathwayReload(false);
    setStickerCollectTiltActive(false);
    setIsStickerPreviewOpen(false);
    setStickerPreviewData(null);
    setStickerPreviewLaunchMotion(null);
    setStickerPreviewFlyoutMotion(null);
    setStickerPreviewTrigger('preview');
    setIsStickerCompletionOpen(false);
    setStickerCompletionData(null);
    shouldRefreshPathAfterCompletionRef.current = false;
  }, [setStickerCollectTiltActive]);

  useEffect(
    () => () => setStickerCollectTiltActive(false),
    [setStickerCollectTiltActive],
  );

  useEffect(
    () => () => {
      rewardAudioSequenceRef.current.token += 1;
      resetRewardAudioSequence();
    },
    [resetRewardAudioSequence],
  );

  useEffect(() => {
    const handleStudentChanged = () => {
      resetRewardAudioSequence();
      clearPendingFinalHomeworkStickerFlow();
      clearPendingPathwayStickerReward();
      resetStickerCelebrationState();
    };

    window.addEventListener(
      CURRENT_STUDENT_CHANGED_EVENT,
      handleStudentChanged as EventListener,
    );

    return () => {
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChanged as EventListener,
      );
    };
  }, [
    clearPendingPathwayStickerReward,
    resetRewardAudioSequence,
    resetStickerCelebrationState,
  ]);

  useEffect(() => {
    latestRiveContainerRef.current = riveContainer;
    if (
      !shouldCelebrateAfterPathwayReload ||
      !riveContainer ||
      riveContainer === pendingCelebrationRiveContainerRef.current
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      pendingCelebrationRiveContainerRef.current = null;
      setShouldCelebrateAfterPathwayReload(false);
      if (hasPendingFinalHomeworkStickerFlow()) {
        playStickerAudioAndFinishHomework();
        return;
      }
      playStickerAudioAndClearPending();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    playStickerAudioAndFinishHomework,
    playStickerAudioAndClearPending,
    riveContainer,
    shouldCelebrateAfterPathwayReload,
  ]);

  useEffect(() => {
    const playRewardAudioIfReady = (token: number, rewardId: string) => {
      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (
        rewardAudioSequence.token !== token ||
        rewardAudioSequence.rewardId !== rewardId ||
        rewardAudioSequence.suppressed
      ) {
        return;
      }

      resetRewardAudioSequence();
      void playRewardAudio(
        rewardAudioSequence.stateValue ?? currentMascotStateValue,
      );
    };

    const handleRewardCelebrationStarted = (event: Event) => {
      const customEvent = event as CustomEvent<{
        rewardId?: string;
        stateValue?: number;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;

      const nextToken = rewardAudioSequenceRef.current.token + 1;
      const shouldSuppress = shouldSuppressRewardAudioForStickerBook();

      rewardAudioSequenceRef.current = {
        rewardId,
        crowdComplete: false,
        rewardReady: false,
        suppressed: shouldSuppress,
        stateValue: customEvent.detail?.stateValue ?? currentMascotStateValue,
        token: nextToken,
      };

      void AudioUtil.playAudioOrTts({
        audioUrl: CROWD_CHEER_AUDIO_URL,
        onComplete: () => {
          const rewardAudioSequence = rewardAudioSequenceRef.current;
          if (
            rewardAudioSequence.token !== nextToken ||
            rewardAudioSequence.rewardId !== rewardId ||
            rewardAudioSequence.suppressed
          ) {
            return;
          }

          rewardAudioSequence.crowdComplete = true;
          if (rewardAudioSequence.rewardReady) {
            playRewardAudioIfReady(nextToken, rewardId);
          }
        },
      });
    };

    const handleRewardAudioReady = (event: Event) => {
      const customEvent = event as CustomEvent<{
        rewardId?: string;
        stateValue?: number;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;

      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (rewardAudioSequence.rewardId !== rewardId) return;

      rewardAudioSequence.stateValue =
        customEvent.detail?.stateValue ??
        rewardAudioSequence.stateValue ??
        currentMascotStateValue;

      if (
        rewardAudioSequence.suppressed ||
        shouldSuppressRewardAudioForStickerBook()
      ) {
        resetRewardAudioSequence();
        return;
      }

      if (rewardAudioSequence.crowdComplete) {
        playRewardAudioIfReady(rewardAudioSequence.token, rewardId);
        return;
      }

      rewardAudioSequence.rewardReady = true;
    };

    window.addEventListener(
      PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
      handleRewardCelebrationStarted as EventListener,
    );
    window.addEventListener(
      PATHWAY_REWARD_AUDIO_READY_EVENT,
      handleRewardAudioReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
        handleRewardCelebrationStarted as EventListener,
      );
      window.removeEventListener(
        PATHWAY_REWARD_AUDIO_READY_EVENT,
        handleRewardAudioReady as EventListener,
      );
    };
  }, [
    currentMascotStateValue,
    playRewardAudio,
    resetRewardAudioSequence,
    shouldSuppressRewardAudioForStickerBook,
  ]);

  useEffect(() => {
    if (!isStickerCollectSpeaking) return;
    const container = containerRef.current;
    if (!container) return;

    const syncTilt = () => {
      const rewardBox = getStickerRewardBoxElement();
      if (!rewardBox || !isStickerCollectSpeakingRef.current) return;
      rewardBox.classList.remove(
        STICKER_REWARD_BOX_OPEN_CLASS,
        STICKER_REWARD_BOX_CLOSE_CLASS,
      );
      rewardBox.classList.add(STICKER_REWARD_BOX_TILT_CLASS);
    };

    syncTilt();

    const observer = new MutationObserver(syncTilt);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [containerRef, getStickerRewardBoxElement, isStickerCollectSpeaking]);

  useEffect(() => {
    const rewardBox = getStickerRewardBoxElement();
    if (!rewardBox) return;

    if (isStickerPreviewOpen) {
      rewardBox.classList.remove(STICKER_REWARD_BOX_CLOSE_CLASS);
      rewardBox.classList.add(STICKER_REWARD_BOX_OPEN_CLASS);
      return;
    }

    if (rewardBox.classList.contains(STICKER_REWARD_BOX_OPEN_CLASS)) {
      rewardBox.classList.remove(STICKER_REWARD_BOX_OPEN_CLASS);
      rewardBox.classList.add(STICKER_REWARD_BOX_CLOSE_CLASS);
      setTimeout(() => {
        rewardBox.classList.remove(STICKER_REWARD_BOX_CLOSE_CLASS);
      }, 500);
    }
  }, [getStickerRewardBoxElement, isStickerPreviewOpen]);

  useEffect(() => {
    const handleStickerCompletionReady = (event: Event) => {
      const customEvent = event as CustomEvent<StickerBookModalData>;
      const data = customEvent.detail;
      if (!data?.stickerBookId) return;

      sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
      openStickerCompletion(data);
    };

    window.addEventListener(
      STICKER_BOOK_COMPLETION_READY_EVENT,
      handleStickerCompletionReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        STICKER_BOOK_COMPLETION_READY_EVENT,
        handleStickerCompletionReady as EventListener,
      );
    };
  }, [openStickerCompletion]);

  return {
    closeStickerCompletion,
    closeStickerPreview,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleMascotReplayClick,
    handleStickerPreviewReady,
    hasPendingPathwayStickerReward,
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    openStickerCompletion,
    rewardBoxVariant,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  };
}
