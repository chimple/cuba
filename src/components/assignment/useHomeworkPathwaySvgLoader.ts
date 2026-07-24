import { useCallback } from 'react';

import {
  ACTIVATION_REWARD_FLOW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  HOMEWORK_PATHWAY,
  HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
  IS_REWARD_FEATURE_ON,
  MASCOT_X_OFFSET,
  PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  REWARD_FLIGHT_ARC_Y_OFFSET,
  REWARD_FLIGHT_DURATION_MS,
  REWARD_FLIGHT_TARGET_X_OFFSET,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_COMPLETION_READY_EVENT,
  TableTypes,
  FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS,
  FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
} from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { getCachedImageSrc } from '../../utility/imageCache';
import { mapInBatches } from '../../utility/batch';
import {
  clearPendingHomeworkStickerFlow,
  clearPendingHomeworkStickerPreviewState,
} from '../../utility/homeworkStickerFlow';
import { StickerBookModalData } from '../learningPathway/StickerBookPreviewModal';
import { renderHomeworkPathwayScene } from './homeworkPathwaySceneRenderer';
import { HomeworkPathLessonItem } from './homeworkPathwayStructureTypes';

export const useHomeworkPathwaySvgLoader = (params: any) => {
  const {
    api,
    checkAndUpdateReward,
    containerRef,
    createSVGImage,
    delay,
    fetchSVGGroup,
    finishFinalHomeworkStickerFlow,
    getPendingRewardTransition,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleStickerPreviewReady,
    hasTodayRewardRef,
    history,
    inactiveText,
    invokeMascotCelebration,
    isOffline,
    isRewardFeatureOn,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    loadHaloAnimation,
    loadPathwayContent,
    loadSvgRequestIdRef,
    onHomeworkComplete,
    placeElement,
    preloadAllLessonImages,
    reloadHomeworkPathway,
    rewardBoxVariant,
    rewardText,
    setCurrentChapter,
    setCurrentCourse,
    setHasTodayReward,
    setHomeworkLessons,
    setIsRewardPathLoaded,
    setModalOpen,
    setModalText,
    setRewardRiveContainer,
    setRewardRiveState,
    setRiveContainer,
    tryFetchSVG,
    updateMascotToNormalState,
  } = params;

  const loadSVG = useCallback(async () => {
    if (!containerRef.current) return;
    const requestId = loadSvgRequestIdRef.current + 1;
    loadSvgRequestIdRef.current = requestId;

    try {
      const pendingActivationRewardFlowRaw = sessionStorage.getItem(
        ACTIVATION_REWARD_FLOW_KEY,
      );
      const hasPendingActivationRewardFlow =
        pendingActivationRewardFlowRaw === 'true' ||
        (() => {
          if (!pendingActivationRewardFlowRaw) return false;
          try {
            return Boolean(JSON.parse(pendingActivationRewardFlowRaw));
          } catch {
            return false;
          }
        })();
      const pendingRewardIndexRaw = sessionStorage.getItem(
        HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
      );
      const hasPendingRewardTransition =
        pendingRewardIndexRaw !== null && /^-?\d+$/.test(pendingRewardIndexRaw);
      const pendingRewardTransition = hasPendingRewardTransition
        ? getPendingRewardTransition()
        : null;
      const storedHomeworkPath =
        pendingRewardTransition?.pathSnapshot ||
        localStorage.getItem(HOMEWORK_PATHWAY);

      if (!storedHomeworkPath) {
        return;
      }
      const homeworkPath = JSON.parse(storedHomeworkPath) as {
        lessons: HomeworkPathLessonItem[];
        currentIndex: number;
        isPlaceholderSnapshot?: boolean;
      };
      const lessonsToRender: HomeworkPathLessonItem[] = homeworkPath.lessons;
      const isPlaceholderSnapshot = homeworkPath.isPlaceholderSnapshot === true;
      const pendingCompletedIndex =
        typeof pendingRewardTransition?.completedIndex === 'number' &&
        Number.isFinite(pendingRewardTransition.completedIndex)
          ? pendingRewardTransition.completedIndex
          : null;
      const pendingNextIndex =
        typeof pendingRewardTransition?.nextIndex === 'number' &&
        Number.isFinite(pendingRewardTransition.nextIndex)
          ? pendingRewardTransition.nextIndex
          : null;
      const isFinalRewardTransition =
        pendingCompletedIndex !== null &&
        pendingCompletedIndex + 1 >= lessonsToRender.length;
      // `currentIndex` drives mascot/reward targeting.
      // `visualCurrentIndex` drives node rendering (final reward shows all played).
      const currentIndex =
        !isFinalRewardTransition &&
        pendingNextIndex !== null &&
        pendingNextIndex >= 0 &&
        pendingNextIndex < lessonsToRender.length
          ? pendingNextIndex
          : homeworkPath.currentIndex;
      const visualCurrentIndex = isFinalRewardTransition
        ? lessonsToRender.length
        : currentIndex;
      const pathEndIndex = lessonsToRender.length - 1;
      const startIndex = 0;

      if (lessonsToRender.length === 0) {
        localStorage.removeItem(HOMEWORK_PATHWAY);
        onHomeworkComplete?.();
        return;
      }

      const firstHomeworkItem = lessonsToRender[0];

      let fetchedCourse: TableTypes<'course'> | undefined;
      let fetchedChapter: TableTypes<'chapter'> | undefined;

      try {
        if (!firstHomeworkItem.course_id || !firstHomeworkItem.chapter_id) {
          throw new Error('Missing homework course/chapter identifiers');
        }
        const [cData, chData] = await Promise.all([
          api.getCourse(firstHomeworkItem.course_id),
          api.getChapterById(firstHomeworkItem.chapter_id),
        ]);
        fetchedCourse = cData;
        fetchedChapter = chData;
      } catch (err) {
        logger.warn(
          'Offline: Could not fetch Course/Chapter metadata. Using fallbacks.',
        );
        // Create minimal fallbacks so the UI doesn't crash
        fetchedCourse = {
          id: firstHomeworkItem.course_id,
          name: 'Course',
          subject_id: 'unknown',
        } as TableTypes<'course'>;
        fetchedChapter = {
          id: firstHomeworkItem.chapter_id,
          name: 'Chapter',
        } as TableTypes<'chapter'>;
      }

      if (!fetchedCourse || !fetchedChapter) {
        logger.error('Could not determine course/chapter data.');
        fetchedCourse = {
          id: firstHomeworkItem.course_id,
        } as TableTypes<'course'>;
        fetchedChapter = {
          id: firstHomeworkItem.chapter_id,
        } as TableTypes<'chapter'>;
      }

      setCurrentCourse(fetchedCourse);
      setCurrentChapter(fetchedChapter);

      const lessons = lessonsToRender.map((item) => item.lesson);
      const currentStudent = Util.getCurrentStudent();
      if (!isStickerBookCelebrationPopupOn) {
        clearPendingHomeworkStickerPreviewState();
        sessionStorage.removeItem(REWARD_LEARNING_PATH);
        if (!isStickerBookCompletionPopupOn) {
          clearPendingHomeworkStickerFlow();
        }
      }
      let previewOverrideParsed: {
        awardedStickerId?: string;
        preAwardCollectedStickerIds?: string[];
        stickerBookId?: string | null;
        stickerBookTitle?: string | null;
        stickerBookSvgUrl?: string | null;
      } | null = null;
      let pendingStickerRewardParsed: {
        awardedStickerId?: string;
      } | null = null;
      let completionOverrideParsed: { payload?: StickerBookModalData } | null =
        null;
      let shouldOpenCelebrationPopup = false;

      if (isStickerBookPreviewOn) {
        const rawPreview = sessionStorage.getItem(
          AUTO_OPEN_STICKER_PREVIEW_KEY,
        );
        if (rawPreview && currentStudent?.id) {
          try {
            const parsed = JSON.parse(rawPreview);
            if (parsed?.studentId === currentStudent.id) {
              previewOverrideParsed = parsed;
              shouldOpenCelebrationPopup =
                isStickerBookCelebrationPopupOn &&
                Boolean(parsed?.awardedStickerId);
            }
          } catch {
            previewOverrideParsed = null;
          }
        }
      }

      if (isStickerBookCompletionPopupOn) {
        const rawCompletion = sessionStorage.getItem(
          AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
        );
        if (rawCompletion && currentStudent?.id) {
          try {
            const parsed = JSON.parse(rawCompletion);
            if (parsed?.studentId === currentStudent.id) {
              completionOverrideParsed = parsed;
            }
          } catch {
            completionOverrideParsed = null;
          }
        }
      }

      const rawPendingStickerReward = sessionStorage.getItem(
        PENDING_PATHWAY_STICKER_REWARD_KEY,
      );
      if (rawPendingStickerReward && currentStudent?.id) {
        try {
          const parsed = JSON.parse(rawPendingStickerReward);
          if (parsed?.studentId === currentStudent.id) {
            pendingStickerRewardParsed = parsed;
          }
        } catch {
          pendingStickerRewardParsed = null;
        }
      }

      const stickerPreviewPromise = isStickerBookPreviewOn
        ? getStickerPreviewPayload(
            previewOverrideParsed?.awardedStickerId,
            previewOverrideParsed?.preAwardCollectedStickerIds,
            previewOverrideParsed
              ? {
                  stickerBookId: previewOverrideParsed.stickerBookId,
                  stickerBookTitle: previewOverrideParsed.stickerBookTitle,
                  stickerBookSvgUrl: previewOverrideParsed.stickerBookSvgUrl,
                }
              : null,
          )
        : Promise.resolve(null);
      const stickerCompletionPayload = completionOverrideParsed
        ? getPersistedStickerCompletionPayload()
        : null;

      const [
        newRewardId,
        svgContent,
        fruitActive,
        fruitInactive,
        playedLessonSVG,
        giftSVG,
        giftSVG2,
        giftSVG3,
        haloPath,
        stickerPreviewPayload,
      ] = await Promise.all([
        checkAndUpdateReward().catch((e: unknown) => {
          logger.warn('Check Reward failed offline', e);
          return null;
        }),
        loadPathwayContent(
          'homeworkRemoteAsset/Pathway2.svg',
          '/pathwayAssets/English/Pathway2.svg',
        ),
        tryFetchSVG(
          'homeworkRemoteAsset/ActiveFruit.svg',
          '/pathwayAssets/English/ActiveFruit.svg',
          'fruitActive isSelected',
        ),
        fetchSVGGroup('/pathwayAssets/InactiveFruit.svg', 'fruitInactive'),
        tryFetchSVG(
          'homeworkRemoteAsset/PlayedLessonFruit.svg',
          '/pathwayAssets/English/PlayedLessonFruit.svg',
          'playedLessonSVG',
        ),
        tryFetchSVG(
          'https://db-stage.chimple.net/storage/v1/object/public/homework-pathway-assets/HW_pathway_mysterbox_frame_1.svg',
          '/pathwayAssets/English/HW_pathway_mysterbox_frame_1.svg',
          'giftSVG',
        ),
        tryFetchSVG(
          'https://db-stage.chimple.net/storage/v1/object/public/homework-pathway-assets/HW_pathway_mysterbox_frame_2.svg',
          '/pathwayAssets/English/HW_pathway_mysterbox_frame_2.svg',
          'giftSVG2',
        ),
        tryFetchSVG(
          'https://db-stage.chimple.net/storage/v1/object/public/homework-pathway-assets/HW_pathway_mysterbox_frame_3.svg',
          '/pathwayAssets/English/HW_pathway_mysterbox_frame_3.svg',
          'giftSVG3',
        ),
        loadHaloAnimation(
          'homeworkRemoteAsset/halo.svg',
          '/pathwayAssets/English/halo.svg',
        ),
        stickerPreviewPromise,
      ]);
      let didScheduleStickerCompletionPopup = false;
      let didDispatchStickerCompletionPopupImmediately = false;
      if (
        completionOverrideParsed &&
        !shouldOpenCelebrationPopup &&
        isStickerBookCompletionPopupOn &&
        stickerCompletionPayload
      ) {
        sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
        didScheduleStickerCompletionPopup = true;
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
              detail: stickerCompletionPayload,
            }),
          );
        }, 0);
        didDispatchStickerCompletionPopupImmediately = true;
      }

      const currentCompletedIndexFromPath =
        Number.isFinite(currentIndex) && currentIndex > 0
          ? currentIndex - 1
          : null;
      const rewardCompletedIndexRaw =
        typeof newRewardId === 'string'
          ? sessionStorage.getItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY)
          : null;
      const pendingRewardCompletedIndex =
        rewardCompletedIndexRaw !== null &&
        /^-?\d+$/.test(rewardCompletedIndexRaw)
          ? Number(rewardCompletedIndexRaw)
          : null;
      const activationRewardIndex =
        hasPendingActivationRewardFlow &&
        pendingRewardCompletedIndex === null &&
        typeof pendingRewardTransition?.completedIndex !== 'number' &&
        Number.isFinite(currentIndex) &&
        currentIndex >= 0 &&
        currentIndex < lessonsToRender.length
          ? currentIndex
          : null;
      const completedRewardIndex =
        typeof pendingRewardCompletedIndex === 'number' &&
        Number.isFinite(pendingRewardCompletedIndex) &&
        pendingRewardCompletedIndex >= 0 &&
        pendingRewardCompletedIndex < lessonsToRender.length
          ? pendingRewardCompletedIndex
          : typeof pendingRewardTransition?.completedIndex === 'number' &&
              Number.isFinite(pendingRewardTransition.completedIndex) &&
              pendingRewardTransition.completedIndex >= 0 &&
              pendingRewardTransition.completedIndex < lessonsToRender.length
            ? pendingRewardTransition.completedIndex
            : typeof activationRewardIndex === 'number'
              ? activationRewardIndex
              : currentCompletedIndexFromPath;

      if (typeof newRewardId !== 'string') {
        sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
        sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
      }

      preloadAllLessonImages(lessons);

      const resolvedLessonImageUrls = await mapInBatches(
        lessonsToRender,
        5,
        async ({ lesson }, lessonIdx) => {
          const isPlayed = lessonIdx < visualCurrentIndex;
          const isActive = lessonIdx === visualCurrentIndex;
          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);

          const lessonImageUrl =
            isPlayed || isActive
              ? isValidUrl
                ? (lesson.image ?? 'assets/icons/DefaultIcon.png')
                : 'assets/icons/DefaultIcon.png'
              : 'assets/icons/NextNodeIcon.svg';

          return await getCachedImageSrc(lessonImageUrl);
        },
      );
      const resolvedHaloSrc =
        typeof haloPath === 'string'
          ? await getCachedImageSrc(haloPath)
          : haloPath;
      const resolvedPointerSrc = await getCachedImageSrc(
        '/pathwayAssets/touchpointer.svg',
      );
      const resolvedStickerImageSrc =
        typeof stickerPreviewPayload?.nextStickerImage === 'string'
          ? await getCachedImageSrc(stickerPreviewPayload.nextStickerImage)
          : null;

      let chimple: SVGForeignObjectElement | null = null;
      chimple = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject',
      );
      chimple.setAttribute('width', '40%');
      chimple.setAttribute('height', '260%');

      renderHomeworkPathwayScene({
        api,
        chimple,
        completedRewardIndex,
        containerRef,
        createSVGImage,
        currentIndex,
        delay,
        didDispatchStickerCompletionPopupImmediately,
        didScheduleStickerCompletionPopup,
        fetchedChapter,
        fetchedCourse,
        fetchRequestId: requestId,
        finishFinalHomeworkStickerFlow,
        fruitActive,
        fruitInactive,
        getPersistedStickerCompletionPayload,
        getStickerPreviewPayload,
        giftSVG,
        giftSVG2,
        giftSVG3,
        handleStickerPreviewReady,
        hasTodayRewardRef,
        haloPath,
        history,
        inactiveText,
        invokeMascotCelebration,
        isFinalRewardTransition,
        isOffline,
        isPlaceholderSnapshot,
        isRewardFeatureOn,
        isStickerBookPreviewOn,
        lessons,
        lessonsToRender,
        loadSvgRequestIdRef,
        MASCOT_X_OFFSET,
        newRewardId,
        onHomeworkComplete,
        pathEndIndex,
        pendingStickerRewardParsed,
        placeElement,
        playedLessonSVG,
        reloadHomeworkPathway,
        resolvedHaloSrc,
        resolvedLessonImageUrls,
        resolvedPointerSrc,
        resolvedStickerImageSrc,
        rewardBoxVariant,
        rewardText,
        setHasTodayReward,
        setIsRewardPathLoaded,
        setModalOpen,
        setModalText,
        setRewardRiveContainer,
        setRewardRiveState,
        setRiveContainer,
        shouldOpenCelebrationPopup,
        startIndex,
        stickerCompletionPayload,
        stickerPreviewPayload,
        svgContent,
        updateMascotToNormalState,
        visualCurrentIndex,
        HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
        PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
        REWARD_FLIGHT_TARGET_X_OFFSET,
        REWARD_FLIGHT_ARC_Y_OFFSET,
        REWARD_FLIGHT_DURATION_MS,
        FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
        FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS,
      });
    } catch (error) {
      logger.error('Failed to load SVG:', error);
    }
  }, [
    api,
    checkAndUpdateReward,
    history,
    fetchSVGGroup,
    finishFinalHomeworkStickerFlow,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleStickerPreviewReady,
    inactiveText,
    isOffline,
    isRewardFeatureOn,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    loadHaloAnimation,
    loadPathwayContent,
    placeElement,
    preloadAllLessonImages,
    rewardText,
    rewardBoxVariant,
    setHasTodayReward,
    tryFetchSVG,
    updateMascotToNormalState,
    getPendingRewardTransition,
    reloadHomeworkPathway,
  ]);

  return { loadSVG };
};
