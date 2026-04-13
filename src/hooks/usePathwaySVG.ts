import { RefObject, useCallback, useEffect } from 'react';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';

import { ServiceConfig } from '../services/ServiceConfig';
import {
  REWARD_LEARNING_PATH,
  COURSE_CHANGED,
  COCOS,
  LIVE_QUIZ,
  LIDO,
  PAGES,
  CONTINUE,
  RewardBoxState,
  IS_REWARD_FEATURE_ON,
  LIDO_ASSESSMENT,
  EVENTS,
  STICKER_BOOK_PREVIEW_ENABLED,
  STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  STICKER_BOOK_COMPLETION_POPUP,
  PATHWAY_END_REWARD_BOX_VARIANT,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
} from '../common/constants';
import { Util } from '../utility/util';
import { LessonNode } from './useLearningPath';
import { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';
import { extractStickerSvg } from '../components/common/SvgHelpers';
import logger from '../utility/logger';
import { fetchStickerBookSvgText } from '../utility/stickerBookAssets';
import { setCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import { useAppSelector } from '../redux/hooks';
import { t } from 'i18next';

interface UsePathwaySVGParams {
  containerRef: RefObject<HTMLDivElement | null>;
  setModalOpen: (b: boolean) => void;
  setModalText: (text: string) => void;

  history: any;
  getCachedLesson: (lessonId: string) => Promise<any>;
  checkAndUpdateReward: () => Promise<string | null>;
  updateMascotToNormalState: (rewardId: string) => Promise<void>;
  invokeMascotCelebration: (stateNumber: number) => Promise<void>;
  setRewardRiveState: (state: RewardBoxState) => void;
  setRiveContainer: (el: HTMLDivElement | null) => void;
  setRewardRiveContainer: (el: HTMLDivElement | null) => void;
  setHasTodayReward: (val: boolean) => void;
  setCurrentCourse: (course: any) => void;
  setCurrentChapter: (chapter: any) => void;
  setIsRewardPathLoaded: (b: boolean) => void;
  isRewardPathLoaded: boolean;
  onStickerPreviewReady: (
    data: StickerBookModalData,
    trigger: 'sticker_click' | 'pathway_completion_auto',
  ) => void;
  onStickerCompletionReady: (data: StickerBookModalData) => void;
}

// CACHES
const svgGroupCache: Record<string, SVGGElement | SVGSVGElement> = {};
const svgStringCache: Record<string, string> = {};
let pathwayTemplateCache: string | null = null;
const stickerDataUrlCache: Record<string, string> = {};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const PATH_SIZE = 5;
const CHIMPLE_MOVE_DURATION_MS = 2000;
const CHIMPLE_MOVE_FALLBACK_BUFFER_MS = 300;

const fetchLocalFile = async (path: string): Promise<string> => {
  const file = await Filesystem.readFile({
    path,
    directory: Directory.External,
  });
  return atob(file.data as string);
};

const fetchLocalGroup = async (
  path: string,
): Promise<SVGGElement | SVGSVGElement> => {
  const text = await fetchLocalFile(path);
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector('svg');
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

const fetchRemoteSVGGroup = async (
  url: string,
): Promise<SVGGElement | SVGSVGElement> => {
  const res = await fetch(url);
  const text = await res.text();
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector('svg');
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// Builds a display-ready data URL for a single sticker by extracting it from
// the full sticker-book SVG. Used as a fallback when sticker.image is missing.
const getStickerImageFallbackFromBookSvg = async (
  stickerBookSvgUrl: string,
  stickerId: string,
): Promise<string | null> => {
  const cacheKey = `${stickerBookSvgUrl}::${stickerId}`;
  const cached = stickerDataUrlCache[cacheKey];
  if (cached) return cached;

  let stickerSvg: string | null = null;
  try {
    // Extract the requested sticker from the full book SVG and reuse it as an image.
    const text = await fetchStickerBookSvgText(stickerBookSvgUrl);
    const wrapper = document.createElementNS(SVG_NS, 'g');
    wrapper.innerHTML = text;
    const svgNode = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (!svgNode) return null;
    stickerSvg = extractStickerSvg(svgNode, stickerId);
  } catch {
    stickerSvg = null;
  }

  if (!stickerSvg) return null;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stickerSvg)}`;
  stickerDataUrlCache[cacheKey] = dataUrl;
  return dataUrl;
};

const createSVGImage = (
  href: string,
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  className?: string,
) => {
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('href', href);
  img.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  if (width != null) img.setAttribute('width', String(width));
  if (height != null) img.setAttribute('height', String(height));
  if (x != null) img.setAttribute('x', String(x));
  if (y != null) img.setAttribute('y', String(y));
  if (className != null) img.setAttribute('class', className);

  img.onerror = () => img.setAttribute('href', 'assets/icons/DefaultIcon.png');

  return img;
};

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
  onStickerPreviewReady,
  onStickerCompletionReady,
}: UsePathwaySVGParams) {
  const api = ServiceConfig.getI().apiHandler;
  const liveIsStickerBookPreviewOn = useFeatureIsOn(
    STICKER_BOOK_PREVIEW_ENABLED,
  );
  const liveIsStickerBookCelebrationPopupOn = useFeatureIsOn(
    STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  );
  const liveIsStickerBookCompletionPopupOn = useFeatureIsOn(
    STICKER_BOOK_COMPLETION_POPUP,
  );
  // Default to mystery box rewards when the experiment value is missing.
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

  const loadSVG = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const startTime = performance.now();

      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent) return;

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
        return;
      }

      const currentCourseIndex = learningPath.courses.currentCourseIndex;
      const course = learningPath.courses.courseList[currentCourseIndex];
      if (!course) return;
      const pathItem =
        course.path.find((p: LessonNode) => p && p.isPlayed === false) ??
        course.path[course.path.length - 1];
      if (!pathItem) return;
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
          api.getCourse(course.id),
          api.getChapterById(pathItem.chapter_id),
        ]);
      } catch (err) {
        logger.warn(
          'Offline: Could not fetch Course/Chapter metadata. Using fallbacks.',
          err,
        );
        courseData = { id: course.id, name: 'Course' };
        chapterData = { id: pathItem.chapter_id, name: 'Chapter' };
      }

      let overrideParsed: any = null;
      let completionOverrideParsed: any = null;
      let pendingStickerRewardParsed: any = null;
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

      const stickerPreviewPromise = isStickerBookPreviewOn
        ? overrideParsed
          ? getStickerPreviewPayload(
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
          : getStickerPreviewPayload()
        : Promise.resolve(null);

      const stickerCompletionPromise = isStickerBookCompletionPopupOn
        ? getPersistedStickerCompletionPayload(completionOverrideParsed)
          ? Promise.resolve(
              getPersistedStickerCompletionPayload(completionOverrideParsed),
            )
          : getStickerCompletionPayload()
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
        checkAndUpdateReward(),
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
            setTimeout(
              () => onStickerCompletionReady(stickerCompletionPayload),
              0,
            );
          }
        } catch {
          sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
        }
      }

      // Auto-open sticker preview after a pathway completes (set in Util.updateLearningPath).
      if (shouldOpenCelebrationPopup) {
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

      // Build SVG in next frame to keep main thread responsive
      requestAnimationFrame(async () => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = pathwaySVG;
        const svg = containerRef.current.querySelector('svg') as SVGSVGElement;
        if (!svg) return;
        svg.style.overflow = 'visible';

        const paths = Array.from(
          svg.querySelectorAll('g > path'),
        ) as SVGPathElement[];
        if (!paths.length) return;

        const startPoint = paths[0].getPointAtLength(0);
        const xValues = [27, 155, 276, 387, 496];

        const fragment = document.createDocumentFragment();

        // chimple foreignObject
        const chimple = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'foreignObject',
        );
        chimple.setAttribute('width', '32.5%');
        chimple.setAttribute('height', '100%');
        let lastIndex = -1;
        // Build lesson nodes
        lessons.forEach((lesson: any, idx: number) => {
          const path = paths[idx];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;

          const isPlayed =
            startIndex + idx < currentIndex || activeIndex === -1;
          const isActive =
            startIndex + idx === currentIndex && activeIndex !== -1;

          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);

          const lessonImageUrl =
            isPlayed || isActive
              ? isValidUrl
                ? lesson.image
                : 'assets/icons/DefaultIcon.png'
              : 'assets/icons/NextNodeIcon.svg';

          const positionMappings = {
            playedLesson: {
              x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
              y: [flowerY - 4, flowerY - 7, flowerY - 10, flowerY - 5, flowerY],
            },
            activeGroup: {
              x: [flowerX - 20, flowerX - 20, 260, flowerX - 10, flowerX - 15],
              y: [flowerY - 23, 5, 10, 5, 10],
            },
          };

          if (isPlayed) {
            // Played lesson
            const playedLesson = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            const lessonImage = createSVGImage(lessonImageUrl, 30, 30, 28, 30);
            playedLesson.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement,
            );
            playedLesson.appendChild(lessonImage);
            placeElement(
              playedLesson as SVGGElement,
              positionMappings.playedLesson.x[idx] ?? flowerX - 20,
              positionMappings.playedLesson.y[idx] ?? flowerY - 20,
            );
            fragment.appendChild(playedLesson);
          } else if (isActive) {
            // Active lesson
            const activeGroup = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            activeGroup.setAttribute(
              'transform',
              `translate(${
                positionMappings.activeGroup.x[idx] ?? flowerX - 20
              }, ${positionMappings.activeGroup.y[idx] ?? flowerY - 20})`,
            );

            // halo
            if (typeof halo === 'string') {
              const haloImg = createSVGImage(halo, 140, 140, -15, -12);
              activeGroup.appendChild(haloImg);
            } else {
              const haloNode = halo.cloneNode(true) as
                | SVGSVGElement
                | SVGGElement;
              haloNode.setAttribute('x', '-15');
              haloNode.setAttribute('y', '-12');
              haloNode.setAttribute('width', '140');
              haloNode.setAttribute('height', '140');
              activeGroup.appendChild(haloNode);
            }

            const lessonImage = createSVGImage(lessonImageUrl, 30, 30, 40, 40);
            activeGroup.appendChild(
              flowerActive.cloneNode(true) as SVGGElement,
            );
            activeGroup.appendChild(lessonImage);

            const pointer = createSVGImage(
              '/pathwayAssets/touchpointer.svg',
              35,
              35,
              85,
              80,
              'PathwayStructure-animated-pointer',
            );
            activeGroup.appendChild(pointer);

            activeGroup.style.cursor = 'pointer';
            activeGroup.addEventListener('click', () => {
              handleLessonClick(
                lesson,
                course,
                pathItem?.skill_id,
                isAssessment,
                assessmentId,
              );
            });

            fragment.appendChild(activeGroup);
          }
          lastIndex = idx;
        });

        for (let i = lastIndex + 1; i < PATH_SIZE; i++) {
          const path = paths[i];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;
          // Locked lesson
          const flower_Inactive = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g',
          );
          const positionMappings = {
            flowerInactive: {
              x: [flowerX - 20, flowerX, flowerX, flowerX + 5, flowerX + 10],
              y: [
                flowerY - 20,
                flowerY + 5,
                flowerY - 6,
                flowerY + 3,
                flowerY - 5,
              ],
            },
          };
          const lessonImage = createSVGImage(
            'assets/icons/NextNodeIcon.svg',
            30,
            30,
            21,
            23,
          );
          flower_Inactive.appendChild(
            flowerInactive.cloneNode(true) as SVGGElement,
          );
          flower_Inactive.appendChild(lessonImage);
          flower_Inactive.addEventListener('click', () => {
            setModalOpen(true);
            setModalText(
              t('This lesson is locked. Play the current active lesson.'),
            );
          });
          flower_Inactive.setAttribute(
            'style',
            'cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);',
          );
          placeElement(
            flower_Inactive as SVGGElement,
            positionMappings.flowerInactive.x[i] ?? flowerX - 20,
            positionMappings.flowerInactive.y[i] ?? flowerY - 20,
          );
          fragment.appendChild(flower_Inactive);
        }

        // Path-end reward node (Sticker or Mystery box)
        const endPath = paths[paths.length - 1];
        const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
        const rewardWrapper = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        ) as SVGGElement;
        rewardWrapper.setAttribute('style', 'cursor: pointer;');

        // Wrap the reward visuals in an inner <g> so CSS transform animations don't
        // clobber the outer translate() from placeElement (SVG transform attribute).
        const rewardGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        ) as SVGGElement;
        (rewardGroup.style as any).transformBox = 'fill-box';
        rewardGroup.style.transformOrigin = 'center';
        rewardWrapper.appendChild(rewardGroup);

        const isRewardFeatureOn =
          localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';

        const normalizedVariant = String(rewardBoxVariant ?? '')
          .trim()
          .toLowerCase();
        const gbWantsMystery =
          normalizedVariant === 'mystery_3d' ||
          normalizedVariant === 'mystery' ||
          normalizedVariant === 'mysterybox' ||
          normalizedVariant === 'mystery_box';

        const hasNextSticker = Boolean(stickerPreviewPayload?.nextStickerId);
        // `getStickerPreviewPayload` already resolves image fallback via book SVG.
        const nextStickerImageSrc = stickerPreviewPayload?.nextStickerImage;
        const hasRenderableSticker = Boolean(nextStickerImageSrc);
        // Show the sticker reward only when a real sticker can be rendered.
        const rewardMode: 'sticker' | 'mystery_box' =
          !hasNextSticker || !hasRenderableSticker || gbWantsMystery
            ? 'mystery_box'
            : 'sticker';

        rewardWrapper.setAttribute('data-reward-mode', rewardMode);
        rewardWrapper.setAttribute(
          'aria-label',
          rewardMode === 'sticker' ? 'Sticker reward' : 'Mystery box reward',
        );

        // Base mobile width defaults to ~57px based on mockup
        const width =
          window.innerWidth >= 1024 ? 68 : window.innerWidth >= 768 ? 62 : 57;
        // Mockup height is 44px for a 57.37px width (~0.767 ratio)
        const height = Math.round(width * 0.767);

        const playRewardClickAnimation = (
          mode: 'sticker' | 'mystery_box',
        ): Promise<void> => {
          if (mode === 'mystery_box') {
            return Promise.resolve();
          }

          const willOpenPreview =
            mode === 'sticker' &&
            isStickerBookPreviewOn &&
            stickerPreviewPayload;

          if (willOpenPreview) {
            rewardGroup.classList.remove(
              'PathwayStructure-end-reward-box--sticker-close-anim',
            );
            void rewardGroup.getBoundingClientRect(); // force reflow
            rewardGroup.classList.add(
              'PathwayStructure-end-reward-box--sticker-open',
            );
            return new Promise((resolve) => setTimeout(resolve, 750));
          }

          const animationClass =
            'PathwayStructure-end-reward-box--sticker-clicked';

          rewardGroup.classList.remove(
            'PathwayStructure-end-reward-box--sticker-clicked',
            'PathwayStructure-end-reward-box--clicked',
          );

          // force reflow so the animation can restart
          void rewardGroup.getBoundingClientRect();
          rewardGroup.classList.add(animationClass);

          return new Promise((resolve) => {
            let resolved = false;
            const finish = () => {
              if (resolved) return;
              resolved = true;
              rewardGroup.classList.remove(animationClass);
              resolve();
            };

            const onEnd = (event: AnimationEvent) => {
              if (event.target === rewardGroup) finish();
            };

            rewardGroup.addEventListener('animationend', onEnd, { once: true });
            window.setTimeout(finish, 1100);
          });
        };

        if (rewardMode === 'sticker') {
          rewardGroup.classList.add(
            'PathwayStructure-end-reward-box',
            'PathwayStructure-end-reward-box--sticker',
          );

          const bg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'rect',
          );
          bg.setAttribute('width', String(width));
          bg.setAttribute('height', String(height));
          bg.setAttribute('rx', String(Math.round(height * 0.24)));
          bg.setAttribute('ry', String(Math.round(height * 0.24)));
          bg.setAttribute('fill', '#FFFDEE');
          bg.setAttribute('stroke', '#F55376');
          bg.setAttribute('stroke-width', '3');

          const horizontalPadding = Math.round(width * 0.12);
          const verticalPadding = Math.round(height * 0.12);
          const contentWidth = width - horizontalPadding * 2;
          const contentHeight = height - verticalPadding * 2;

          rewardGroup.appendChild(bg);
          // Reuse the same resolved sticker image that powers the preview modal.
          if (nextStickerImageSrc) {
            rewardGroup.appendChild(
              createSVGImage(
                nextStickerImageSrc,
                contentWidth,
                contentHeight,
                horizontalPadding,
                verticalPadding,
                'PathwayStructure-end-reward-sticker-image',
              ),
            );
          }
          placeElement(
            rewardWrapper,
            endPoint.x - width / 2,
            endPoint.y - height / 2,
          );

          if (currentIndex < pathEndIndex + 1) {
            rewardWrapper.addEventListener('click', async () => {
              await playRewardClickAnimation(rewardMode);

              void Util.logEvent(EVENTS.PATHWAY_STICKER_BOX_TAPPED, {
                user_id: Util.getCurrentStudent()?.id ?? 'unknown',
                source: 'learning_pathway',
                sticker_book_id:
                  stickerPreviewPayload?.stickerBookId ?? 'unknown',
                sticker_id: stickerPreviewPayload?.nextStickerId ?? 'unknown',
                gb_variant: normalizedVariant || 'sticker',
              });

              if (isStickerBookPreviewOn && stickerPreviewPayload) {
                onStickerPreviewReady(stickerPreviewPayload, 'sticker_click');
              } else {
                setModalText(t('Complete these 5 lessons to earn rewards'));
                setModalOpen(true);
              }
            });
          }
        } else {
          rewardGroup.classList.add(
            'PathwayStructure-end-reward-box',
            'PathwayStructure-end-reward-box--mystery',
          );
          const mysteryBoxClone = mysteryBox1.cloneNode(true) as SVGElement;
          mysteryBoxClone.setAttribute('width', String(width));
          mysteryBoxClone.setAttribute('height', String(height));
          mysteryBoxClone.style.width = `${width}px`;
          mysteryBoxClone.style.height = `${height}px`;
          rewardGroup.appendChild(mysteryBoxClone);

          placeElement(
            rewardWrapper,
            endPoint.x - width / 2,
            endPoint.y - height / 2,
          );

          if (currentIndex < pathEndIndex + 1) {
            rewardWrapper.addEventListener('click', async () => {
              await playRewardClickAnimation(rewardMode);

              const reason = isOffline
                ? 'offline'
                : hasNextSticker
                  ? 'experiment'
                  : 'stickers_exhausted';
              const mysteryBoxModalText =
                reason === 'stickers_exhausted'
                  ? t('Complete these 5 lessons to earn rewards')
                  : t('Complete these 5 lessons to earn 10 stars');

              void Util.logEvent(EVENTS.PATHWAY_MYSTERY_BOX_TAPPED, {
                user_id: Util.getCurrentStudent()?.id ?? 'unknown',
                source: 'learning_pathway',
                reason,
                sticker_book_id:
                  stickerPreviewPayload?.stickerBookId ?? 'unknown',
                sticker_id: stickerPreviewPayload?.nextStickerId ?? 'none',
                gb_variant: normalizedVariant || 'mystery_box',
              });

              const replaceContent = (newContent: SVGElement) => {
                while (rewardGroup.firstChild) {
                  rewardGroup.removeChild(rewardGroup.firstChild);
                }
                const clone = newContent.cloneNode(true) as SVGElement;
                clone.setAttribute('width', String(width));
                clone.setAttribute('height', String(height));
                clone.style.width = `${width}px`;
                clone.style.height = `${height}px`;
                rewardGroup.appendChild(clone);
              };

              const animationSequence = [
                { content: mysteryBox2, delay: 300 },
                { content: mysteryBox3, delay: 500 },
                { content: mysteryBox2, delay: 700 },
                { content: mysteryBox3, delay: 900 },
                {
                  callback: () => {
                    setModalText(mysteryBoxModalText);
                    setModalOpen(true);
                    replaceContent(mysteryBox1);
                  },
                  delay: 1100,
                },
              ];

              animationSequence.forEach(({ content, callback, delay }) => {
                setTimeout(() => {
                  if (content) replaceContent(content);
                  if (callback) callback();
                }, delay);
              });
            });
          }
        }

        fragment.appendChild(rewardWrapper);
        svg.appendChild(fragment);

        // Setup chimple mascot initial position
        const idx = lessons.findIndex(
          (_: any, index: number) => startIndex + index === currentIndex - 1,
        );
        const xValuesForChimple = [-60, 66, 180, 295, 412];

        const isStringReward =
          newRewardIdFromCheck !== null &&
          typeof newRewardIdFromCheck === 'string';

        // If a popup is about to open, defer reward animation
        // so it plays after the pathway refresh (avoids animating behind the popup).
        const willShowCelebration =
          shouldOpenCelebrationPopup && !!stickerPreviewPayload;
        const shouldSkipRewardAnimationForSticker =
          isStringReward &&
          isRewardFeatureOn &&
          Boolean(pendingStickerRewardParsed?.awardedStickerId);
        const shouldRunRewardAnimation =
          isStringReward &&
          isRewardFeatureOn &&
          !shouldSkipRewardAnimationForSticker &&
          !willShowCelebration &&
          !didScheduleStickerCompletionPopup;

        if (shouldSkipRewardAnimationForSticker) {
          setHasTodayReward(false);
          await updateMascotToNormalState(newRewardIdFromCheck as string);
          await Util.updateUserReward();
        }

        if (shouldRunRewardAnimation) {
          runRewardAnimation(
            newRewardIdFromCheck as string,
            lessons,
            startIndex,
            currentIndex,
            svg,
            startPoint,
            xValues,
            chimple,
            pathEndIndex,
          );
        }

        // Attach chimple (mascot)
        if (chimple) {
          let baseX: number;
          if (idx < 0 || !shouldRunRewardAnimation) {
            // default logic – same as original: next active lesson
            baseX = xValues[idx + 1] ?? xValues[0];
            chimple.setAttribute('x', `${baseX - 87}`);
          } else {
            baseX = xValuesForChimple[idx] ?? xValues[0];
            chimple.setAttribute('x', `${baseX}`);
          }

          chimple.setAttribute('y', `${startPoint.y - 15}`);
          chimple.style.pointerEvents = 'none';

          const riveDiv = document.createElement('div');
          riveDiv.style.width = '100%';
          riveDiv.style.height = '100%';
          chimple.appendChild(riveDiv);
          svg.appendChild(chimple);

          setRiveContainer(riveDiv);
        }

        const endTime = performance.now();
        logger.info(`SVG loaded in ${(endTime - startTime).toFixed(2)}ms`);
      });
    } catch (error) {
      logger.error('Failed to load SVG:', error);
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

  // Fetches all data needed by StickerBookPreviewModal + end-path sticker icon.
  // This is the single place where we resolve next sticker image fallback.
  async function getStickerPreviewPayload(
    forcedStickerId?: string,
    preAwardCollectedStickerIds?: string[],
    persistedBookContext?: {
      stickerBookId?: string | null;
      stickerBookTitle?: string | null;
      stickerBookSvgUrl?: string | null;
    } | null,
  ): Promise<StickerBookModalData | null> {
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
        // Start from the active sticker book and the user's current progress.
        const currentBookWithProgress =
          await api.getCurrentStickerBookWithProgress(currentStudent.id);
        if (!currentBookWithProgress?.book) return null;
        book = currentBookWithProgress.book;
        progress = currentBookWithProgress.progress;
      }

      const collectedStickerIds = Array.isArray(preAwardCollectedStickerIds)
        ? preAwardCollectedStickerIds
        : (progress?.stickers_collected ?? []);
      // For auto-completion popup, use the just-awarded sticker when available.
      // For normal sticker-box preview, use the next winnable sticker.
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

      // Some stickers do not have a standalone image, so derive one from the book SVG.
      if (!nextStickerImage && book.svg_url) {
        try {
          const dataUrl = await getStickerImageFallbackFromBookSvg(
            book.svg_url,
            nextStickerId,
          );
          if (dataUrl) nextStickerImage = dataUrl;
        } catch (err) {
          logger.warn(
            '[StickerBook] Failed to build sticker preview image from book SVG',
            err,
          );
        }
      }

      return {
        source: 'learning_pathway',
        stickerBookId: book.id,
        stickerBookTitle: book.title || 'Sticker Book',
        stickerBookSvgUrl: book.svg_url || '',
        collectedStickerIds: visibleCollectedStickerIds,
        nextStickerId,
        nextStickerName: nextSticker?.name || 'Sticker',
        nextStickerImage,
      };
    } catch (error) {
      logger.error('Failed to build sticker preview payload:', error);
      return null;
    }
  }

  async function getStickerCompletionPayload(): Promise<StickerBookModalData | null> {
    try {
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent?.id) return null;

      const currentBookWithProgress =
        await api.getCurrentStickerBookWithProgress(currentStudent.id);
      if (!currentBookWithProgress?.book) return null;

      const { book, progress } = currentBookWithProgress;
      const collectedStickerIds = progress?.stickers_collected ?? [];
      const totalStickerCount =
        book.total_stickers || book.stickers_metadata?.length || 0;
      const isCompleted =
        progress?.status === 'completed' ||
        (totalStickerCount > 0 &&
          collectedStickerIds.length >= totalStickerCount);

      if (!isCompleted) return null;

      return {
        source: 'learning_pathway',
        stickerBookId: book.id,
        stickerBookTitle: book.title || 'Sticker Book',
        stickerBookSvgUrl: book.svg_url || '',
        collectedStickerIds,
        totalStickerCount,
      };
    } catch (error) {
      logger.error('Failed to build sticker completion payload:', error);
      return null;
    }
  }

  function getPersistedStickerCompletionPayload(
    parsed: any,
  ): StickerBookModalData | null {
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
    };
  }

  async function loadPathwayTemplate(): Promise<string> {
    if (pathwayTemplateCache) return pathwayTemplateCache;

    const local = '/pathwayAssets/English/Pathway.svg';
    const remote = 'remoteAsset/Pathway.svg';

    if (Capacitor.isNativePlatform()) {
      try {
        const text = await fetchLocalFile(remote);
        pathwayTemplateCache = text;
        return text;
      } catch (err) {
        logger.error('Error in loading pathway template ', err);
      }
    }

    const res = await fetch(local);
    const txt = await res.text();
    pathwayTemplateCache = txt;
    return txt;
  }

  async function loadGroupAsset(
    name: string,
    remotePath: string,
    localPath: string,
  ): Promise<SVGGElement | SVGSVGElement> {
    const cached = svgGroupCache[name];
    if (cached) {
      return cached.cloneNode(true) as SVGGElement | SVGSVGElement;
    }

    let group: SVGGElement | SVGSVGElement;
    if (Capacitor.isNativePlatform()) {
      try {
        group = await fetchLocalGroup(remotePath);
      } catch {
        group = await fetchRemoteSVGGroup(localPath);
      }
    } else {
      group = await fetchRemoteSVGGroup(localPath);
    }

    svgGroupCache[name] = group;
    return group.cloneNode(true) as SVGGElement | SVGSVGElement;
  }

  async function loadHalo(): Promise<SVGGElement | SVGSVGElement | string> {
    const cached = svgGroupCache['halo'];
    if (cached) {
      return cached.cloneNode(true) as SVGGElement | SVGSVGElement;
    }

    const local = '/pathwayAssets/English/halo.svg';
    const remote = 'remoteAsset/halo.svg';
    let group: SVGGElement | SVGSVGElement | null = null;

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          group = await fetchLocalGroup(remote);
        } catch (err) {
          logger.warn('Failed to load local halo.svg, fetching remote', err);
        }
      }
      if (!group) {
        group = await fetchRemoteSVGGroup(local);
      }
      svgGroupCache['halo'] = group;
      return group.cloneNode(true) as SVGGElement | SVGSVGElement;
    } catch {
      svgStringCache['halo'] = local;
      return local;
    }
  }

  const placeElement = (element: SVGGElement, x: number, y: number) => {
    element.setAttribute('transform', `translate(${x}, ${y})`);
  };

  async function preloadAllLessonImages(lessons: any[]) {
    Promise.all(
      lessons.map((lesson) => {
        const isValidUrl =
          typeof lesson.image === 'string' &&
          /^(https?:\/\/|\/)/.test(lesson.image);
        const src = isValidUrl ? lesson.image : 'assets/icons/DefaultIcon.png';
        return preloadImage(src);
      }),
    );
  }

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  };

  async function runRewardAnimation(
    newRewardId: string,
    lessons: any[],
    startIndex: number,
    currentIndex: number,
    svg: SVGSVGElement,
    startPoint: DOMPoint,
    xValues: number[],
    chimple: SVGForeignObjectElement,
    pathEndIndex: number,
  ) {
    const rewardRecord =
      await ServiceConfig.getI().apiHandler.getRewardById(newRewardId);
    if (!rewardRecord) return;
    const rewardStateValue = rewardRecord.state_number_input || 1;

    setHasTodayReward(false);

    // The reward flies to the completed lesson's position (currentIndex - 1)
    const completedLessonIndex = lessons.findIndex(
      (_: any, idx: number) => startIndex + idx === currentIndex - 1,
    );
    const destinationX =
      xValues[completedLessonIndex >= 0 ? completedLessonIndex : 0] ?? 0;

    const rewardForeignObject = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'foreignObject',
    );
    rewardForeignObject.setAttribute('width', '140');
    rewardForeignObject.setAttribute('height', '140');
    rewardForeignObject.setAttribute('x', '0');
    rewardForeignObject.setAttribute('y', '0');
    rewardForeignObject.style.display = 'block';
    (rewardForeignObject.style as any).transformBox = 'fill-box';
    rewardForeignObject.style.transformOrigin = '0 0';
    rewardForeignObject.style.willChange = 'transform';
    rewardForeignObject.style.backfaceVisibility = 'hidden';
    (rewardForeignObject.style as any).contain = 'layout paint style';

    const fromX = 570,
      fromY = 110;
    const toX = destinationX - 27,
      toY = startPoint.y - 69;
    const controlX = (fromX + toX) / 2,
      controlY = Math.min(fromY, toY) - 150;

    const duration = 4000;
    const start = performance.now();

    const easeInOutCubic = (val: number) =>
      val < 0.5 ? 4 * val * val * val : 1 - Math.pow(-2 * val + 2, 3) / 2;
    const bezier = (tVal: number, p0: number, p1: number, p2: number) =>
      (1 - tVal) ** 2 * p0 + 2 * (1 - tVal) * tVal * p1 + tVal ** 2 * p2;

    const animateBezier = (now: number) => {
      let t = (now - start) / duration;
      if (t > 1) t = 1;

      const easedT = easeInOutCubic(t);
      const x = bezier(easedT, fromX, controlX, toX);
      const y = bezier(easedT, fromY, controlY, toY);
      rewardForeignObject.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (t < 1) {
        requestAnimationFrame(animateBezier);
      } else {
        onBoxArrival();
      }
    };

    const onBoxArrival = async () => {
      setRewardRiveState(RewardBoxState.BLAST);

      await delay(2000);

      // Step 1: set celebration state (we emulate via global mascot state)
      await invokeMascotCelebration(rewardStateValue);
      window.dispatchEvent(
        new CustomEvent(PATHWAY_REWARD_CELEBRATION_STARTED_EVENT, {
          detail: { rewardId: newRewardId, stateValue: rewardStateValue },
        }),
      );

      await delay(500);
      rewardForeignObject.style.display = 'none';
      await delay(1000);

      // Step 2: revert to new normal state
      await updateMascotToNormalState(newRewardId);

      await delay(500);

      // Step 3: animate mascot movement
      await animateChimpleMovement(
        chimple,
        lessons,
        startIndex,
        currentIndex,
        xValues,
        startPoint,
        pathEndIndex,
      );
      window.dispatchEvent(
        new CustomEvent(PATHWAY_REWARD_AUDIO_READY_EVENT, {
          detail: { rewardId: newRewardId, stateValue: rewardStateValue },
        }),
      );

      await Util.updateUserReward();
    };

    const rewardDiv = document.createElement('div');
    rewardDiv.style.width = '100%';
    rewardDiv.style.height = '100%';
    rewardForeignObject.appendChild(rewardDiv);
    svg.appendChild(rewardForeignObject);
    setRewardRiveContainer(rewardDiv);

    requestAnimationFrame(animateBezier);
  }

  function animateChimpleMovement(
    chimple: SVGForeignObjectElement,
    lessons: any[],
    startIndex: number,
    currentIndex: number,
    xValues: number[],
    startPoint: DOMPoint,
    pathEndIndex: number,
  ): Promise<void> {
    if (!chimple) return Promise.resolve();

    if (currentIndex > pathEndIndex) {
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
      setIsRewardPathLoaded(true);
      return Promise.resolve();
    }

    const currentLessonIndex = lessons.findIndex(
      (_: any, idx: number) => startIndex + idx === currentIndex,
    );
    if (currentLessonIndex < 0) return Promise.resolve();

    const previousLessonIndex = currentLessonIndex - 1;
    if (previousLessonIndex < 0) return Promise.resolve();

    const fromX = xValues[previousLessonIndex] ?? 0;
    const toX = xValues[currentLessonIndex] ?? 0;

    chimple.setAttribute('x', `${toX - 87}`);
    chimple.setAttribute('y', `${startPoint.y - 15}`);

    chimple.style.display = 'block';
    (chimple.style as any).transformBox = 'fill-box';
    chimple.style.transformOrigin = '0 0';
    chimple.style.willChange = 'transform';

    const fromTranslateX = fromX - 97 - (toX - 87);

    chimple.style.transition = 'none';
    chimple.style.transform = `translate(${fromTranslateX}px, 0px)`;
    void chimple.getBoundingClientRect();

    return new Promise((resolve) => {
      let hasResolved = false;
      const finishMovement = () => {
        if (hasResolved) return;
        hasResolved = true;
        window.clearTimeout(fallbackTimer);
        chimple.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      };
      const handleTransitionEnd = (event: TransitionEvent) => {
        if (event.target === chimple && event.propertyName === 'transform') {
          finishMovement();
        }
      };
      const fallbackTimer = window.setTimeout(
        finishMovement,
        CHIMPLE_MOVE_DURATION_MS + CHIMPLE_MOVE_FALLBACK_BUFFER_MS,
      );

      chimple.addEventListener('transitionend', handleTransitionEnd);
      requestAnimationFrame(() => {
        chimple.style.transition = `transform ${CHIMPLE_MOVE_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
        chimple.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  function handleLessonClick(
    lesson: any,
    course: any,
    skillId?: string,
    is_assessment?: boolean,
    assessmentId?: string,
  ) {
    if (!history) return;

    const currentCourse = (window as any).__currentCourseForPathway__;
    const currentChapter = (window as any).__currentChapterForPathway__;

    const lidoLessonId =
      lesson.lido_lesson_id ||
      (lesson.plugin_type === LIDO || lesson.plugin_type === LIDO_ASSESSMENT
        ? lesson.cocos_lesson_id
        : null);

    if (lidoLessonId) {
      const p = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lidoLessonId}`;
      history.replace(PAGES.LIDO_PLAYER + p, {
        lessonId: lidoLessonId,
        courseDocId: course.course_id,
        course: JSON.stringify(currentCourse),
        lesson: JSON.stringify(lesson),
        chapter: JSON.stringify(currentChapter),
        from: history.location.pathname + `?${CONTINUE}=true`,
        learning_path: true,
        skillId: skillId,
        is_assessment: is_assessment,
        assessmentId: assessmentId,
      });
    } else if (lesson.plugin_type === COCOS) {
      const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      history.replace(PAGES.GAME + params, {
        url: 'chimple-lib/index.html' + params,
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course.course_id,
        course: JSON.stringify(currentCourse),
        lesson: JSON.stringify(lesson),
        chapter: JSON.stringify(currentChapter),
        from: history.location.pathname + `?${CONTINUE}=true`,
        learning_path: true,
        skillId: skillId,
        is_assessment: is_assessment,
      });
    } else if (lesson.plugin_type === LIVE_QUIZ) {
      history.replace(
        PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
        {
          courseId: course.course_id,
          lesson: JSON.stringify(lesson),
          from: history.location.pathname + `?${CONTINUE}=true`,
          learning_path: true,
          skillId: skillId,
          is_assessment: is_assessment,
        },
      );
    }
  }

  return {};
}
