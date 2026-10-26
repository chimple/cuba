import { useCallback, useEffect } from 'react';

import { ServiceConfig } from '../services/ServiceConfig';
import {
  REWARD_LEARNING_PATH,
  COURSE_CHANGED,
  SOURCE,
  IS_REWARD_FEATURE_ON,
  EVENTS,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
} from '../common/constants';
import { Util } from '../utility/util';
import {
  CoursePath,
  LearningPath,
  LessonNode,
  recommendNextLesson,
} from './useLearningPath';
import logger from '../utility/logger';
import { t } from 'i18next';
import { getCachedImageSrc } from '../utility/imageCache';
import { mapInBatches } from '../utility/batch';
import { schoolUtil } from '../utility/schoolUtil';
import { ensurePlayableLearningPath } from './pathwayLearningPathRepair';
import {
  createSVGImage,
  loadGroupAsset,
  loadHalo,
  loadPathwayTemplate,
  placeElement,
  preloadAllLessonImages,
  SVG_NS,
} from './pathwaySvgAssets';
import {
  getPathwayStickerCompletionPayload,
  getPathwayStickerPreviewPayload,
  getPersistedPathwayStickerCompletionPayload,
} from './pathwayStickerPayloads';
import { runPathwayRewardAnimation } from './pathwayRewardAnimation';
import { navigateToPathwayLesson } from './pathwayLessonNavigation';
import { renderPathwaySvgScene } from './pathwaySvgSceneRenderer';
import { usePathwayStickerFeatureFlags } from './usePathwayStickerFeatureFlags';
import {
  PendingStickerReward,
  UsePathwaySVGParams,
} from './usePathwaySVG.types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const PATH_SIZE = 5;

export function usePathwaySVG({
  containerRef,
  setModalOpen,
  setModalText,

  history,
  getCachedLesson,
  checkAndUpdateReward,
  updateMascotToNormalState,
  invokeMascotCelebration,
  setRewardRiveState,
  setRiveContainer,
  setRewardRiveContainer,
  setHasTodayReward,
  setCurrentCourse,
  setCurrentChapter,
  setIsRewardPathLoaded,
  isRewardPathLoaded,
  setPathwayLoading,
  onStickerPreviewReady,
  onStickerCompletionReady,
}: UsePathwaySVGParams) {
  const api = ServiceConfig.getI().apiHandler;
  const {
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    rewardBoxVariant,
  } = usePathwayStickerFeatureFlags();

  const loadSVG = useCallback(async () => {
    const stopPathwayLoading = () => setPathwayLoading?.(false);
    if (!containerRef.current) {
      stopPathwayLoading();
      return;
    }
    setPathwayLoading?.(true);

    try {
      const startTime = performance.now();

      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent) {
        stopPathwayLoading();
        return;
      }

      const rewardLearningPath = sessionStorage.getItem(REWARD_LEARNING_PATH);

      let learningPath: any;
      if (rewardLearningPath) {
        learningPath = JSON.parse(rewardLearningPath);
      } else if (currentStudent.learning_path) {
        const pathToParse =
          Util.getLatestLearningPathByUpdatedAt(currentStudent);
        learningPath = pathToParse ? JSON.parse(pathToParse) : null;
      } else {
        logger.warn('No learning path found for current student');
        stopPathwayLoading();
        return;
      }

      const currentClass = schoolUtil.getCurrentClass();
      let linkedClassId: string | undefined;
      const resolveNextLesson = async (course: CoursePath) => {
        if (linkedClassId === undefined) {
          try {
            const isLinked = await api.isStudentLinked(currentStudent.id);
            linkedClassId = isLinked ? currentClass?.id : undefined;
          } catch (error) {
            logger.warn(
              'Unable to confirm linked class while rebuilding learning pathway',
              error,
            );
            linkedClassId = undefined;
          }
        }

        const courseInput = {
          id: course.course_id,
          subject_id: course.subject_id,
          framework_id: course.framework_id ?? null,
          code: course.course_code ?? null,
          pathway_display_name: course.display_name,
          is_pal_consolidated: course.is_pal_consolidated,
        };

        return recommendNextLesson({
          student: currentStudent,
          course: courseInput,
          mode: learningPath.pathMode,
          classId: linkedClassId,
          coursePath: { path: course.path },
        });
      };

      const playablePathState = await ensurePlayableLearningPath({
        learningPath,
        getCachedLesson,
        resolveNextLesson,
        options: rewardLearningPath
          ? {
              allowCourseSwitch: false,
              allowReplacementLesson: false,
            }
          : undefined,
      });

      learningPath = playablePathState.learningPath;
      if (playablePathState.updated) {
        const pathString = JSON.stringify(learningPath);

        if (rewardLearningPath) {
          sessionStorage.setItem(REWARD_LEARNING_PATH, pathString);
        } else {
          await api.updateLearningPath(currentStudent, pathString);
          await Util.setCurrentStudent({
            ...currentStudent,
            learning_path: pathString,
          });
          window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
        }
      }

      const course = playablePathState.currentCourse;
      if (!course) {
        stopPathwayLoading();
        return;
      }
      const pathItem =
        course.path.find((p: LessonNode) => p && p.isPlayed === false) ??
        course.path[course.path.length - 1];
      if (!pathItem) {
        stopPathwayLoading();
        return;
      }
      const isAssessment = pathItem?.is_assessment;
      const assessmentId = pathItem?.assignment_id;
      const activeIndex = course.path.findIndex(
        (p: LessonNode) => p.isPlayed === false,
      );
      const currentIndex =
        activeIndex === -1 ? course.path.length - 1 : activeIndex;

      const startIndex = Math.max(0, currentIndex - (PATH_SIZE - 1));
      const pathEndIndex = Math.min(
        Math.max(course.path.length - 1, 4),
        startIndex + PATH_SIZE - 1,
      );

      let courseData: any = null;
      let chapterData: any = null;
      try {
        [courseData, chapterData] = await Promise.all([
          api.getCourse(course.course_id),
          pathItem.chapter_id
            ? api.getChapterById(pathItem.chapter_id)
            : Promise.resolve(null),
        ]);
      } catch (err) {
        logger.warn(
          'Offline: Could not fetch Course/Chapter metadata. Using fallbacks.',
          err,
        );
        courseData = { id: course.course_id, name: 'Course' };
        chapterData = { id: pathItem.chapter_id, name: 'Chapter' };
      }

      let overrideParsed: any = null;
      let completionOverrideParsed: any = null;
      let pendingStickerRewardParsed: PendingStickerReward | null = null;
      if (isStickerBookPreviewOn) {
        const raw = sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.studentId && parsed.studentId === currentStudent.id) {
              overrideParsed = parsed;
            }
          } catch (e) {}
        }
      } else {
        // Preview disabled: clear pending auto-open state and refresh to new path.
        sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
        if (sessionStorage.getItem(REWARD_LEARNING_PATH)) {
          sessionStorage.removeItem(REWARD_LEARNING_PATH);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
          }, 0);
        }
      }

      const shouldOpenCelebrationPopup =
        isStickerBookPreviewOn &&
        isStickerBookCelebrationPopupOn &&
        Boolean(overrideParsed);

      if (overrideParsed && !shouldOpenCelebrationPopup) {
        sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
        if (sessionStorage.getItem(REWARD_LEARNING_PATH)) {
          sessionStorage.removeItem(REWARD_LEARNING_PATH);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
          }, 0);
        }
      }

      const rawCompletionPopup = sessionStorage.getItem(
        AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
      );
      if (rawCompletionPopup) {
        try {
          const parsed = JSON.parse(rawCompletionPopup);
          if (parsed?.studentId && parsed.studentId === currentStudent.id) {
            completionOverrideParsed = parsed;
          }
        } catch (e) {}
      }

      const rawPendingStickerReward = sessionStorage.getItem(
        PENDING_PATHWAY_STICKER_REWARD_KEY,
      );
      if (rawPendingStickerReward) {
        try {
          const parsed = JSON.parse(rawPendingStickerReward);
          if (parsed?.studentId && parsed.studentId === currentStudent.id) {
            pendingStickerRewardParsed = parsed;
          }
        } catch (e) {}
      }

      const isRewardFeatureEnabled =
        localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';

      const stickerPreviewPromise = isStickerBookPreviewOn
        ? overrideParsed
          ? getPathwayStickerPreviewPayload(
              api,
              overrideParsed.awardedStickerId,
              Array.isArray(overrideParsed.preAwardCollectedStickerIds)
                ? overrideParsed.preAwardCollectedStickerIds
                : undefined,
              {
                stickerBookId: overrideParsed.stickerBookId,
                stickerBookTitle: overrideParsed.stickerBookTitle,
                stickerBookSvgUrl: overrideParsed.stickerBookSvgUrl,
              },
            )
          : getPathwayStickerPreviewPayload(api)
        : Promise.resolve(null);

      const stickerCompletionPromise = isStickerBookCompletionPopupOn
        ? getPersistedPathwayStickerCompletionPayload(completionOverrideParsed)
          ? Promise.resolve(
              getPersistedPathwayStickerCompletionPayload(
                completionOverrideParsed,
              ),
            )
          : getPathwayStickerCompletionPayload(api)
        : Promise.resolve(null);
      (window as any).__currentCourseForPathway__ = courseData;
      (window as any).__currentChapterForPathway__ = chapterData;
      setCurrentCourse(courseData);
      setCurrentChapter(chapterData);

      const lessons = await Promise.all(
        course.path
          .slice(startIndex, pathEndIndex + 1)
          .map((p: LessonNode) => getCachedLesson(p.lesson_id)),
      );

      // Preload icons/images for lessons (to reduce flicker)
      preloadAllLessonImages(lessons);

      const [
        stickerPreviewPayload,
        stickerCompletionPayload,
        newRewardIdFromCheck,
        pathwaySVG,
        flowerActive,
        flowerInactive,
        playedLessonSVG,
        mysteryBox1,
        mysteryBox2,
        mysteryBox3,
        halo,
      ] = await Promise.all([
        stickerPreviewPromise,
        stickerCompletionPromise,
        isRewardFeatureEnabled ? checkAndUpdateReward() : Promise.resolve(null),
        loadPathwayTemplate(),
        loadGroupAsset(
          'flowerActive',
          'remoteAsset/FlowerActive.svg',
          '/pathwayAssets/English/FlowerActive.svg',
        ),
        loadGroupAsset(
          'flowerInactive',
          'remoteAsset/FlowerInactive.svg',
          '/pathwayAssets/FlowerInactive.svg',
        ),
        loadGroupAsset(
          'playedLessonSVG',
          'remoteAsset/PlayedLesson.svg',
          '/pathwayAssets/English/PlayedLesson.svg',
        ),
        loadGroupAsset(
          'mysteryBox1',
          'remoteAsset/mysteryBox1.svg',
          '/pathwayAssets/English/mysteryBox1.svg',
        ),
        loadGroupAsset(
          'mysteryBox2',
          'remoteAsset/mysteryBox2.svg',
          '/pathwayAssets/English/mysteryBox2.svg',
        ),
        loadGroupAsset(
          'mysteryBox3',
          'remoteAsset/mysteryBox3.svg',
          '/pathwayAssets/English/mysteryBox3.svg',
        ),
        loadHalo(),
      ]);
      const shouldWaitForRewardAnimationBeforeSticker =
        typeof newRewardIdFromCheck === 'string' && isRewardFeatureEnabled;

      let didScheduleStickerCompletionPopup = false;
      if (rawCompletionPopup) {
        try {
          const parsed = JSON.parse(rawCompletionPopup);
          const shouldOpenForStudent =
            parsed?.studentId && parsed.studentId === currentStudent.id;
          if (
            shouldOpenForStudent &&
            !shouldOpenCelebrationPopup &&
            isStickerBookCompletionPopupOn &&
            stickerCompletionPayload
          ) {
            sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
            didScheduleStickerCompletionPopup = true;
            if (!shouldWaitForRewardAnimationBeforeSticker) {
              setTimeout(
                () => onStickerCompletionReady(stickerCompletionPayload),
                0,
              );
            }
          }
        } catch {
          sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
        }
      }

      // Auto-open sticker preview after a pathway completes (set in Util.updateLearningPath).
      if (
        shouldOpenCelebrationPopup &&
        !shouldWaitForRewardAnimationBeforeSticker
      ) {
        if (stickerPreviewPayload && !didScheduleStickerCompletionPopup) {
          setTimeout(
            () =>
              onStickerPreviewReady(
                stickerPreviewPayload,
                'pathway_completion_auto',
              ),
            0,
          );
        }
      }

      const resolvedLessonImageUrls = await mapInBatches(
        lessons,
        5,
        async (lesson) => {
          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);
          const lessonImageUrl = isValidUrl
            ? (lesson.image ?? 'assets/icons/DefaultIcon.png')
            : 'assets/icons/DefaultIcon.png';

          return await getCachedImageSrc(lessonImageUrl);
        },
      );
      const resolvedHaloSrc =
        typeof halo === 'string' ? await getCachedImageSrc(halo) : null;
      const resolvedPointerSrc = await getCachedImageSrc(
        '/pathwayAssets/touchpointer.svg',
      );
      const resolvedStickerImageSrc =
        typeof stickerPreviewPayload?.nextStickerImage === 'string'
          ? await getCachedImageSrc(stickerPreviewPayload.nextStickerImage)
          : null;

      // Build SVG in next frame to keep main thread responsive
      renderPathwaySvgScene({
        activeIndex,
        assessmentId,
        containerRef,
        course,
        currentIndex,
        didScheduleStickerCompletionPopup,
        endTimeStart: startTime,
        flowerActive,
        flowerInactive,
        halo,
        handleLessonClick,
        isAssessment,
        isOffline,
        isStickerBookPreviewOn,
        lessons,
        mysteryBox1,
        mysteryBox2,
        mysteryBox3,
        newRewardIdFromCheck,
        onStickerCompletionReady,
        onStickerPreviewReady,
        pathEndIndex,
        pathItem,
        pathwaySVG,
        pendingStickerRewardParsed,
        playedLessonSVG,
        resolvedHaloSrc,
        resolvedLessonImageUrls,
        resolvedPointerSrc,
        resolvedStickerImageSrc,
        rewardBoxVariant,
        runRewardAnimation: (
          newRewardId: string,
          animationLessons: any[],
          animationStartIndex: number,
          animationCurrentIndex: number,
          svg: SVGSVGElement,
          startPoint: DOMPoint,
          xValues: number[],
          chimple: SVGForeignObjectElement,
          animationPathEndIndex: number,
          completedLessonGlobalIndex: number,
          shouldSkipMascotMovement: boolean,
          shouldPlayFinalRewardAudioBeforeComplete: boolean,
          onComplete?: () => void,
        ) =>
          runPathwayRewardAnimation({
            newRewardId,
            lessons: animationLessons,
            startIndex: animationStartIndex,
            currentIndex: animationCurrentIndex,
            svg,
            startPoint,
            xValues,
            chimple,
            pathEndIndex: animationPathEndIndex,
            completedLessonGlobalIndex,
            shouldSkipMascotMovement,
            shouldPlayFinalRewardAudioBeforeComplete,
            invokeMascotCelebration,
            onComplete,
            setHasTodayReward,
            setIsRewardPathLoaded,
            setRewardRiveContainer,
            setRewardRiveState,
            updateMascotToNormalState,
          }),
        setHasTodayReward,
        setModalOpen,
        setModalText,
        setRiveContainer,
        shouldOpenCelebrationPopup,
        startIndex,
        stickerCompletionPayload,
        stickerPreviewPayload,
        stopPathwayLoading,
        updateMascotToNormalState,
      });
    } catch (error) {
      logger.error('Failed to load SVG:', error);
      stopPathwayLoading();
    }
  }, [
    api,
    checkAndUpdateReward,
    containerRef,
    getCachedLesson,
    history,
    invokeMascotCelebration,
    isRewardPathLoaded,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    onStickerCompletionReady,
    onStickerPreviewReady,
    rewardBoxVariant,
    setCurrentChapter,
    setCurrentCourse,
    setHasTodayReward,
    setIsRewardPathLoaded,
    setPathwayLoading,
    setModalOpen,
    setModalText,
    setRewardRiveContainer,
    setRewardRiveState,
    setRiveContainer,
    updateMascotToNormalState,
  ]);

  useEffect(() => {
    (window as any).__triggerPathwayReload__ = loadSVG;
    loadSVG();

    return () => {
      delete (window as any).__triggerPathwayReload__;
    };
  }, [loadSVG]);

  function handleLessonClick(
    lesson: any,
    course: any,
    skillId?: string,
    is_assessment?: boolean,
    assessmentId?: string,
    source: SOURCE = SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
  ) {
    navigateToPathwayLesson({
      assessmentId,
      course,
      history,
      isAssessment: is_assessment,
      lesson,
      skillId,
      source,
    });
  }

  return {};
}

export * from './pathwayLearningPathRepair';
