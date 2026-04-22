import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './HomeworkPathwayStructure.css';
import { useHistory } from 'react-router';
import { t } from 'i18next';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  CHIMPLE_MASCOT_ANIMATION_IDLE,
  CHIMPLE_MASCOT_INPUT_CELEBRATE,
  CHIMPLE_MASCOT_INPUT_NORMAL,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_CELEBRATE,
  CHIMPLE_MASCOT_STATE_MACHINE_NORMAL,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  HOMEWORK_REMOTE_ASSETS_ENABLED,
  COCOS,
  CONTINUE,
  HOMEWORK_PATHWAY,
  IDLE_REWARD_ID,
  LIDO,
  LIVE_QUIZ,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  PAGES,
  REWARD_LEARNING_PATH,
  REWARD_MODAL_SHOWN_DATE,
  RewardBoxState,
  TableTypes,
  IS_REWARD_FEATURE_ON,
} from '../../common/constants';
import { useReward } from '../../hooks/useReward';
import { Util } from '../../utility/util';
import RewardRive from '../learningPathway/RewardRive';
import PathwayModal from '../learningPathway/PathwayModal';
import ChimpleRiveMascot from '../learningPathway/ChimpleRiveMascot';
import RewardBox from '../learningPathway/RewardBox';
import DailyRewardModal from '../learningPathway/DailyRewardModal';
import { AudioUtil } from '../../utility/AudioUtil';
import logger from '../../utility/logger';

interface HomeworkPathwayStructureProps {
  selectedSubject?: string | null;
  onHomeworkComplete?: () => void;
}

interface HomeworkPathLessonItem {
  lesson: Partial<TableTypes<'lesson'>>;
  course_id: string;
  chapter_id: string;
  assignment_id?: string;
  raw_assignment?: TableTypes<'assignment'>;
}

interface PendingHomeworkRewardTransition {
  completedIndex?: number;
  nextIndex?: number;
  pathSnapshot?: string;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const CROWD_CHEER_AUDIO_URL = '/assets/audios/common/crowd_cheer.mp3';
const HOMEWORK_REWARD_COMPLETED_INDEX_KEY = 'homework_reward_completed_index';
const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';
const MASCOT_X_OFFSET = -163;

const HomeworkPathwayStructure: React.FC<HomeworkPathwayStructureProps> = ({
  selectedSubject,
  onHomeworkComplete,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [riveContainer, setRiveContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [rewardRiveContainer, setRewardRiveContainer] =
    useState<HTMLDivElement | null>(null);

  const [rewardRiveState, setRewardRiveState] = useState<
    RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST
  >(RewardBoxState.IDLE);

  const [chimpleRiveStateMachineName, setChimpleRiveStateMachineName] =
    useState<string>(CHIMPLE_MASCOT_STATE_MACHINE_NORMAL);
  const [chimpleRiveInputName, setChimpleRiveInputName] = useState<string>(
    CHIMPLE_MASCOT_INPUT_NORMAL,
  );
  const [chimpleRiveStateValue, setChimpleRiveStateValue] = useState<number>(1);
  const [chimpleRiveAnimationName, setChimpleRiveAnimationName] = useState<
    string | undefined
  >(CHIMPLE_MASCOT_ANIMATION_IDLE);
  const [mascotKey, setMascotKey] = useState(0);
  const mascotStateRef = useRef<{
    stateMachine: string;
    inputName: string;
    stateValue: number;
    animationName?: string;
  } | null>(null);
  const mascotSpeakRequestIdRef = useRef(0);
  const currentMascotStateValueRef = useRef(1);
  const rewardAudioSequenceRef = useRef({
    rewardId: null as string | null,
    crowdComplete: false,
    rewardReady: false,
    suppressed: false,
    stateValue: null as number | null,
    token: 0,
  });

  const {
    hasTodayReward,
    setHasTodayReward,
    checkAndUpdateReward,
    shouldShowDailyRewardModal,
  } = useReward();

  const [currentCourse, setCurrentCourse] = useState<TableTypes<'course'>>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<'chapter'>>();

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [isRewardPathLoaded, setIsRewardPathLoaded] = useState(false);
  const lessonCacheRef = useRef<Map<string, Partial<TableTypes<'lesson'>>>>(
    new Map(),
  );

  // New state for homework pathway lessons array
  const [homeworkLessons, setHomeworkLessons] = useState<
    HomeworkPathLessonItem[]
  >([]);

  const inactiveText = t(
    'This lesson is locked. Play the current active lesson.',
  );
  const rewardText = t('Complete these lessons to earn rewards.');
  const shouldShowHomeworkRemoteAssets = useFeatureIsOn(
    HOMEWORK_REMOTE_ASSETS_ENABLED,
  );

  const isRewardFeatureOn: boolean =
    localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';

  const shouldAnimate = modalText === rewardText;

  useEffect(() => {
    currentMascotStateValueRef.current = chimpleRiveStateValue;
  }, [chimpleRiveStateValue]);

  const resetRewardAudioSequence = () => {
    rewardAudioSequenceRef.current = {
      ...rewardAudioSequenceRef.current,
      rewardId: null,
      crowdComplete: false,
      rewardReady: false,
      suppressed: false,
      stateValue: null,
    };
  };

  const invokeMascotCelebration = async (stateValue: number) => {
    setChimpleRiveStateMachineName(CHIMPLE_MASCOT_STATE_MACHINE_CELEBRATE);
    setChimpleRiveInputName(CHIMPLE_MASCOT_INPUT_CELEBRATE);
    setChimpleRiveStateValue(stateValue || 1);
    setChimpleRiveAnimationName(undefined);
    setMascotKey((prev) => prev + 1);
  };

  const playMascotAudioFromLocalPath = useCallback(
    async (
      localAudioPath: string,
      stateConfig?: {
        stateMachine?: string;
        inputName?: string;
        stateValue?: number;
        animationName?: string;
      },
    ): Promise<boolean> => {
      const normalizedPath = localAudioPath?.trim();
      if (!normalizedPath) return false;

      const requestId = mascotSpeakRequestIdRef.current + 1;
      mascotSpeakRequestIdRef.current = requestId;

      const previousState = {
        stateMachine: chimpleRiveStateMachineName,
        inputName: chimpleRiveInputName,
        stateValue: chimpleRiveStateValue,
        animationName: chimpleRiveAnimationName,
      };
      mascotStateRef.current = previousState;

      setChimpleRiveStateMachineName(
        stateConfig?.stateMachine ?? previousState.stateMachine,
      );
      setChimpleRiveInputName(
        stateConfig?.inputName ?? previousState.inputName,
      );
      setChimpleRiveStateValue(
        stateConfig?.stateValue ?? previousState.stateValue,
      );
      setChimpleRiveAnimationName(stateConfig?.animationName);
      setMascotKey((prev) => prev + 1);

      const restoreState = () => {
        if (mascotSpeakRequestIdRef.current !== requestId) return;
        const savedState = mascotStateRef.current;
        if (!savedState) return;
        setChimpleRiveStateMachineName(savedState.stateMachine);
        setChimpleRiveInputName(savedState.inputName);
        setChimpleRiveStateValue(savedState.stateValue);
        setChimpleRiveAnimationName(savedState.animationName);
        setMascotKey((prev) => prev + 1);
      };

      return AudioUtil.playAudioOrTts({
        audioUrl: normalizedPath,
        onStop: restoreState,
        onComplete: restoreState,
      });
    },
    [
      chimpleRiveAnimationName,
      chimpleRiveInputName,
      chimpleRiveStateMachineName,
      chimpleRiveStateValue,
    ],
  );

  const playRewardCollectMascotAudio = useCallback(
    async (stateValue?: number) => {
      const localAudioPath = await AudioUtil.getLocalizedAudioUrl(
        'dailyReward',
        'reward',
      );
      if (!localAudioPath) return;

      await playMascotAudioFromLocalPath(localAudioPath, {
        stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
        inputName: CHIMPLE_MASCOT_INPUT_REWARD,
        stateValue: stateValue ?? currentMascotStateValueRef.current ?? 1,
      });
    },
    [playMascotAudioFromLocalPath],
  );

  const fetchLocalSVGGroup = async (
    path: string,
    className?: string,
  ): Promise<SVGGElement> => {
    const file = await Filesystem.readFile({
      path,
      directory: Directory.External,
    });
    const svgText = atob(file.data as string);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.innerHTML = svgText;
    if (className) group.setAttribute('class', className);
    return group;
  };

  const loadHaloAnimation = useCallback(
    async (localPath: string, webPath: string): Promise<string> => {
      if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
        try {
          const file = await Filesystem.readFile({
            path: localPath,
            directory: Directory.External,
          });
          return `data:image/svg+xml;base64,${file.data}`;
        } catch (err) {
          logger.error('Fallback to web asset for:', webPath, err);
          return webPath;
        }
      }
      return webPath;
    },
    [shouldShowHomeworkRemoteAssets],
  );

  const fetchSVGGroup = useCallback(
    async (url: string, className?: string): Promise<SVGGElement> => {
      const res = await fetch(url);
      const svgContent = await res.text();
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.innerHTML = svgContent;
      if (className) group.setAttribute('class', className);
      return group;
    },
    [],
  );

  const tryFetchSVG = useCallback(
    async (localPath: string, webPath: string, name: string) => {
      if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
        try {
          return await fetchLocalSVGGroup(localPath, name);
        } catch {
          return await fetchSVGGroup(webPath, name);
        }
      } else {
        return await fetchSVGGroup(webPath, name);
      }
    },
    [fetchSVGGroup, shouldShowHomeworkRemoteAssets],
  );

  const createSVGImage = (
    href: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    opacity?: number,
  ) => {
    const image = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'image',
    );
    image.setAttribute('href', href);
    if (width) image.setAttribute('width', `${width}`);
    if (height) image.setAttribute('height', `${height}`);
    if (x) image.setAttribute('x', `${x}`);
    if (y) image.setAttribute('y', `${y}`);
    if (opacity !== undefined) {
      image.setAttribute('opacity', opacity.toString());
    }
    image.onerror = () => {
      image.setAttribute('href', 'assets/icons/DefaultIcon.png');
    };
    return image;
  };

  const loadPathwayContent = useCallback(
    async (path: string, webPath: string): Promise<string> => {
      if (shouldShowHomeworkRemoteAssets && Capacitor.isNativePlatform()) {
        try {
          const file = await Filesystem.readFile({
            path,
            directory: Directory.External,
          });
          return atob(file.data as string);
        } catch {
          const res = await fetch(webPath);
          return await res.text();
        }
      } else {
        const res = await fetch(webPath);
        return await res.text();
      }
    },
    [shouldShowHomeworkRemoteAssets],
  );

  const getCachedLesson = useCallback(
    async (lessonId: string): Promise<Partial<TableTypes<'lesson'>>> => {
      const lessonCache = lessonCacheRef.current;
      const existingLesson = lessonCache.get(lessonId);
      if (existingLesson) return existingLesson;
      const key = `lesson_${lessonId}`;
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<TableTypes<'lesson'>>;
        lessonCache.set(lessonId, parsed);
        return parsed;
      }
      try {
        const lesson = await api.getLesson(lessonId);
        if (lesson) {
          lessonCache.set(lessonId, lesson);
          sessionStorage.setItem(key, JSON.stringify(lesson));
          return lesson;
        }
        return {};
      } catch (e) {
        logger.warn('Could not fetch lesson details (offline)', e);
        return {};
      }
    },
    [api],
  );

  const preloadImage = useCallback(
    (src: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to not block
      }),
    [],
  );

  const preloadAllLessonImages = useCallback(
    async (lessons: Array<{ image?: string | null }>) => {
      await Promise.all(
        lessons.map((lesson) => {
          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);
          const src =
            isValidUrl && lesson.image
              ? lesson.image
              : 'assets/icons/DefaultIcon.png';
          return preloadImage(src);
        }),
      );
    },
    [preloadImage],
  );

  const placeElement = useCallback(
    (element: SVGGElement, x: number, y: number) => {
      element.setAttribute('transform', `translate(${x}, ${y})`);
    },
    [],
  );
  // Reads the temporary transition payload used after finishing a homework
  // lesson, so we can render reward flow even if path storage has advanced.
  const getPendingRewardTransition = useCallback(() => {
    const rawTransition = sessionStorage.getItem(
      PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
    );
    if (!rawTransition) return null;
    try {
      const parsed = JSON.parse(
        rawTransition,
      ) as PendingHomeworkRewardTransition;
      if (typeof parsed.pathSnapshot !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const fetchHomeworkLessons = useCallback(async () => {
    try {
      const rewardCompletedIndexRaw = sessionStorage.getItem(
        HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
      );
      const hasValidRewardCompletedIndex =
        rewardCompletedIndexRaw !== null &&
        /^-?\d+$/.test(rewardCompletedIndexRaw);
      const pendingRewardTransition = getPendingRewardTransition();
      const hasPendingRewardTransition =
        hasValidRewardCompletedIndex &&
        pendingRewardTransition !== null &&
        typeof pendingRewardTransition.completedIndex === 'number' &&
        Number.isFinite(pendingRewardTransition.completedIndex) &&
        Number(rewardCompletedIndexRaw) ===
          pendingRewardTransition.completedIndex;

      const normalizeLessonShape = (
        item: unknown,
        fallbackLessons: unknown[],
      ): HomeworkPathLessonItem => {
        const typedItem = item as HomeworkPathLessonItem & {
          lesson_id?: string;
          subject_id?: string;
          id?: string;
        };
        if (typedItem.lesson && typedItem.lesson.id) return typedItem;

        return {
          ...typedItem,
          lesson: {
            id: typedItem.lesson_id ?? '',
            image: 'assets/icons/DefaultIcon.png',
            subject_id:
              typedItem.subject_id ||
              (fallbackLessons[0] as HomeworkPathLessonItem | undefined)?.lesson
                ?.subject_id ||
              null,
          },
          assignment_id: typedItem.assignment_id ?? typedItem.id,
          chapter_id: typedItem.chapter_id,
          course_id: typedItem.course_id,
          raw_assignment: typedItem.raw_assignment,
        };
      };

      if (hasPendingRewardTransition && pendingRewardTransition?.pathSnapshot) {
        try {
          const snapshotPath = JSON.parse(
            pendingRewardTransition.pathSnapshot,
          ) as {
            lessons?: unknown[];
          };
          const snapshotLessons = snapshotPath.lessons ?? [];
          if (snapshotLessons.length > 0) {
            setHomeworkLessons(
              snapshotLessons.map((item) =>
                normalizeLessonShape(item, snapshotLessons),
              ),
            );
            return;
          }
        } catch (error) {
          logger.warn('Invalid pending reward transition snapshot', error);
        }
      }

      const existingPathStr = localStorage.getItem(HOMEWORK_PATHWAY);
      if (existingPathStr) {
        try {
          const existingPath = JSON.parse(existingPathStr) as {
            lessons?: unknown[];
            currentIndex?: number;
          };

          const lessons = existingPath.lessons ?? []; // 👈 safe fallback

          const hasLessons = lessons.length > 0;
          const notFinished =
            typeof existingPath.currentIndex === 'number' &&
            existingPath.currentIndex < lessons.length;

          if (hasLessons && (notFinished || hasPendingRewardTransition)) {
            const normalizedLessons = lessons.map((item) =>
              normalizeLessonShape(item, lessons),
            );
            setHomeworkLessons(normalizedLessons);
            return;
          }

          if (hasPendingRewardTransition) {
            return;
          }

          // ❌ Path empty or finished → remove it
          localStorage.removeItem(HOMEWORK_PATHWAY);
        } catch (err) {
          logger.warn('Invalid cached path, rebuilding...', err);
          if (hasPendingRewardTransition) {
            return;
          }
          localStorage.removeItem(HOMEWORK_PATHWAY);
        }
      }

      if (hasPendingRewardTransition) {
        onHomeworkComplete?.();
        return;
      }

      // If offline and no local storage, this API call will fail, which is expected.
      const currentStudent = Util.getCurrentStudent();
      const currClass = Util.getCurrentClass();
      if (!currentStudent?.id || !currClass?.id) return;

      const all = await api.getPendingAssignments(
        currClass?.id,
        currentStudent.id,
      );
      const pendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

      if (!pendingAssignments || pendingAssignments.length === 0) {
        setHomeworkLessons([]);
        onHomeworkComplete?.();
        return;
      }

      // Grouping logic...
      const pendingBySubject: Record<string, TableTypes<'assignment'>[]> = {};
      for (const assignment of pendingAssignments) {
        const lesson = await getCachedLesson(assignment.lesson_id);
        const subjectId = lesson.subject_id;
        if (!subjectId) continue;
        if (!pendingBySubject[subjectId]) pendingBySubject[subjectId] = [];
        pendingBySubject[subjectId].push(assignment);
      }

      let maxPending = 0;
      let subjectsWithMaxPending: string[] = [];
      Object.keys(pendingBySubject).forEach((subject) => {
        const length = pendingBySubject[subject].length;
        if (length > maxPending) {
          maxPending = length;
          subjectsWithMaxPending = [subject];
        } else if (length === maxPending) {
          subjectsWithMaxPending.push(subject);
        }
      });

      let completedCountBySubject: { [key: string]: number } = {};
      if (subjectsWithMaxPending.length > 1) {
        try {
          const completedCounts =
            await api.getCompletedAssignmentsCountForSubjects(
              currentStudent.id,
              subjectsWithMaxPending,
            );
          completedCountBySubject = completedCounts.reduce(
            (acc, { subject_id, completed_count }) => {
              acc[subject_id] = completed_count;
              return acc;
            },
            {} as { [key: string]: number },
          );
        } catch (e) {
          logger.warn('Could not fetch completed counts (offline)', e);
        }
      }

      const selected = Util.pickFiveHomeworkLessons(
        pendingAssignments,
        completedCountBySubject,
      );

      const lessonsWithDetails = await Promise.all(
        selected.map(async (assignment) => {
          const lesson = await getCachedLesson(assignment.lesson_id);
          return { ...assignment, lesson };
        }),
      );

      const newHomeworkPath = {
        lessons: lessonsWithDetails,
        currentIndex: 0,
      };

      localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(newHomeworkPath));
      setHomeworkLessons(lessonsWithDetails);
    } catch (error) {
      logger.error('Failed to fetch homework lessons:', error);
      setHomeworkLessons([]);
    }
  }, [api, getCachedLesson, getPendingRewardTransition, onHomeworkComplete]);

  const updateMascotToNormalState = useCallback(
    async (rewardId: string) => {
      try {
        const rewardRecord = await api.getRewardById(rewardId);
        if (rewardRecord && rewardRecord.type === 'normal') {
          setChimpleRiveStateMachineName(
            rewardRecord.state_machine || CHIMPLE_MASCOT_STATE_MACHINE_NORMAL,
          );
          setChimpleRiveInputName(
            rewardRecord.state_input_name || CHIMPLE_MASCOT_INPUT_NORMAL,
          );
          setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
          setChimpleRiveAnimationName(undefined);
          setMascotKey((prev) => prev + 1);
        } else {
          setChimpleRiveAnimationName(CHIMPLE_MASCOT_ANIMATION_IDLE);
          setMascotKey((prev) => prev + 1);
        }
      } catch (e) {
        logger.warn('Update mascot failed offline', e);
      }
    },
    [api],
  );

  const initializeHomeworkRewardState = useCallback(async () => {
    try {
      const todaysReward = await Promise.all([
        checkAndUpdateReward(),
        Util.fetchTodaysReward(),
      ]).then(([, result]) => result);

      const currentReward = Util.retrieveUserReward();
      const today = new Date().toISOString().split('T')[0];

      const receivedTodayReward =
        currentReward?.timestamp &&
        new Date(currentReward.timestamp).toISOString().split('T')[0] ===
          today &&
        todaysReward?.id === currentReward?.reward_id;

      setHasTodayReward(!receivedTodayReward);

      if (currentReward.reward_id !== IDLE_REWARD_ID) {
        await updateMascotToNormalState(currentReward.reward_id);
      }
    } catch (err) {
      logger.error('Error in initializeHomeworkRewardState:', err);
    }
  }, [checkAndUpdateReward, setHasTodayReward, updateMascotToNormalState]);

  const loadSVG = useCallback(async () => {
    if (!containerRef.current) return;

    try {
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
      };
      const lessonsToRender: HomeworkPathLessonItem[] = homeworkPath.lessons;
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
        return;
      }

      const firstHomeworkItem = lessonsToRender[0];

      let fetchedCourse: TableTypes<'course'> | undefined;
      let fetchedChapter: TableTypes<'chapter'> | undefined;

      try {
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
        } as any;
        fetchedChapter = {
          id: firstHomeworkItem.chapter_id,
          name: 'Chapter',
        } as any;
      }

      if (!fetchedCourse || !fetchedChapter) {
        logger.error('Could not determine course/chapter data.');
        fetchedCourse = { id: firstHomeworkItem.course_id } as any;
        fetchedChapter = { id: firstHomeworkItem.chapter_id } as any;
      }

      setCurrentCourse(fetchedCourse);
      setCurrentChapter(fetchedChapter);

      const lessons = lessonsToRender.map((item) => item.lesson);

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
      ] = await Promise.all([
        checkAndUpdateReward().catch((e) => {
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
      ]);

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
            : currentCompletedIndexFromPath;

      if (typeof newRewardId !== 'string') {
        sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
        sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
      }

      preloadAllLessonImages(lessons);

      let chimple: SVGForeignObjectElement | null = null;
      chimple = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject',
      );
      chimple.setAttribute('width', '40%');
      chimple.setAttribute('height', '260%');

      requestAnimationFrame(async () => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = svgContent;
        const svg = containerRef.current.querySelector('svg') as SVGSVGElement;
        if (!svg) return;
        svg.style.overflow = 'visible';

        const pathGroups = svg.querySelectorAll('g > path');
        const rawPaths = Array.from(pathGroups) as SVGPathElement[];

        const paths = rawPaths
          .map((p) => ({ path: p, x: p.getBBox().x }))
          .sort((a, b) => a.x - b.x)
          .map((o) => o.path);

        if (!paths.length) return;

        const startPoint = paths[0].getPointAtLength(0);
        const slotXValues = paths.map((path) => path.getPointAtLength(0).x);
        const fragment = document.createDocumentFragment();

        const totalSlots = 5;
        const numLessons = lessonsToRender.length;
        const startIndexOffset = totalSlots - numLessons;

        for (let pathIndex = 0; pathIndex < totalSlots; pathIndex++) {
          const path = paths[pathIndex];
          if (!path) continue;

          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;

          const positionMappings = {
            playedLesson: {
              x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
              y: [flowerY - 4, flowerY - 7, flowerY - 10, flowerY - 5, flowerY],
            },
            activeGroup: { baseX: flowerX - 20, baseY: flowerY - 23 },
            fruitInactive: {
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

          if (pathIndex < startIndexOffset) {
            const lockedFruit = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            lockedFruit.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement,
            );
            // lockedFruit.addEventListener("click", () => {
            //   setModalOpen(true);
            //   setModalText(inactiveText);
            // });
            lockedFruit.setAttribute('style', 'cursor: default;');
            let yOffset = -10;
            if (pathIndex === 4) yOffset = 5;
            if (pathIndex === 2) yOffset += 15;
            let xPos =
              positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
            let yPos =
              (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
              yOffset;
            if (pathIndex === 0) {
              xPos += 21;
              yPos += 15;
            }
            placeElement(lockedFruit as SVGGElement, xPos, yPos);
            fragment.appendChild(lockedFruit);
            continue;
          }

          const lessonIdx = pathIndex - startIndexOffset;
          const { lesson } = lessonsToRender[lessonIdx];

          const isPlayed = lessonIdx < visualCurrentIndex;
          const isActive = lessonIdx === visualCurrentIndex;

          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);

          const lesson_image: string =
            isPlayed || isActive
              ? isValidUrl
                ? (lesson.image ?? 'assets/icons/DefaultIcon.png')
                : 'assets/icons/DefaultIcon.png'
              : 'assets/icons/NextNodeIcon.svg';

          if (lessonIdx < visualCurrentIndex) {
            const playedLesson = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            const lessonImage = createSVGImage(lesson_image, 30, 30, 28, 30);
            playedLesson.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement,
            );
            playedLesson.appendChild(lessonImage);

            let xPos =
              positionMappings.playedLesson.x[pathIndex] ?? flowerX - 20;
            let yPos =
              positionMappings.playedLesson.y[pathIndex] ?? flowerY - 20;

            if (pathIndex === 0) {
              yPos -= 12;
            } else if (pathIndex === 2) {
              yPos += 7;
            } else if (pathIndex === 3) {
              yPos -= 5;
            }

            placeElement(playedLesson as SVGGElement, xPos, yPos);
            fragment.appendChild(playedLesson);
          } else if (lessonIdx === visualCurrentIndex) {
            const activeGroup = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );

            let activeYOffset = -10;
            let activeXOffset = 0;

            if (pathIndex === 1) {
              activeYOffset = 5;
              activeXOffset += 8;
            } else if (pathIndex === 2) {
              activeYOffset += 12;
              activeXOffset += 8;
            } else if (pathIndex === 3) {
              activeYOffset += 15;
              activeXOffset += 8;
            } else if (pathIndex === 0) {
              activeYOffset = -10;
              activeXOffset = 10;
            } else if (pathIndex === 4) {
              activeYOffset = -1;
              activeXOffset = 12;
            }

            activeGroup.setAttribute(
              'transform',
              `translate(${
                positionMappings.activeGroup.baseX + activeXOffset
              }, ${positionMappings.activeGroup.baseY + activeYOffset})`,
            );

            const halo = createSVGImage(haloPath, 140, 140, -15, -12);
            const pointer = createSVGImage(
              '/pathwayAssets/touchpointer.svg',
              30,
              30,
              70,
              90,
            );
            pointer.setAttribute(
              'class',
              'homeworkpathway-structure-animated-pointer',
            );
            const lessonImage = createSVGImage(lesson_image, 30, 30, 40, 40);

            activeGroup.appendChild(halo);
            activeGroup.appendChild(fruitActive.cloneNode(true) as SVGGElement);
            activeGroup.appendChild(lessonImage);
            activeGroup.appendChild(pointer);
            activeGroup.setAttribute('style', 'cursor: pointer;');

            activeGroup.addEventListener('click', () => {
              const shouldMarkRewardLesson =
                isRewardFeatureOn && hasTodayReward;
              const lidoLessonId =
                lesson.lido_lesson_id ||
                (lesson.plugin_type === LIDO ? lesson.cocos_lesson_id : null);

              if (lidoLessonId) {
                const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lidoLessonId}`;
                history.push(PAGES.LIDO_PLAYER + params, {
                  lessonId: lidoLessonId,
                  courseDocId: fetchedCourse?.id,
                  course: JSON.stringify(fetchedCourse),
                  lesson: JSON.stringify(lesson),
                  chapter: JSON.stringify(fetchedChapter),
                  from: history.location.pathname + `?${CONTINUE}=true`,
                  isHomework: true,
                  homeworkIndex: lessonIdx,
                  reward: shouldMarkRewardLesson,
                });
              } else if (lesson.plugin_type === COCOS) {
                const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                history.push(PAGES.GAME + params, {
                  url: 'chimple-lib/index.html' + params,
                  lessonId: lesson.cocos_lesson_id,
                  courseDocId: fetchedCourse?.id,
                  lesson: JSON.stringify(lesson),
                  chapter: JSON.stringify(fetchedChapter),
                  from: history.location.pathname + `?${CONTINUE}=true`,
                  course: JSON.stringify(fetchedCourse),
                  isHomework: true,
                  homeworkIndex: lessonIdx,
                  reward: shouldMarkRewardLesson,
                });
              } else if (lesson.plugin_type === LIVE_QUIZ) {
                history.push(
                  PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
                  {
                    courseId: fetchedCourse?.id,
                    lesson: JSON.stringify(lesson),
                    from: history.location.pathname + `?${CONTINUE}=true`,
                    isHomework: true,
                    homeworkIndex: lessonIdx,
                    reward: shouldMarkRewardLesson,
                  },
                );
              }
            });
            fragment.appendChild(activeGroup);
          } else {
            const flower_Inactive = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );

            const lessonImage = createSVGImage(lesson_image, 30, 30, 27, 29);
            flower_Inactive.appendChild(
              fruitInactive.cloneNode(true) as SVGGElement,
            );
            flower_Inactive.appendChild(lessonImage);

            flower_Inactive.addEventListener('click', () => {
              setModalOpen(true);
              setModalText(inactiveText);
            });

            flower_Inactive.setAttribute(
              'style',
              'cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);',
            );

            let yOffset = -10;
            if (pathIndex === 4) yOffset = 5;
            if (pathIndex === 2) yOffset = 4;
            let extraX = 0;
            let extraY = 0;
            if (pathIndex === 0) {
              extraX = 15;
              extraY -= 100;
            }
            if (pathIndex === 2) {
              yOffset += 1;
            }
            let xPos =
              positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
            let yPos =
              (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
              yOffset;
            placeElement(flower_Inactive as SVGGElement, xPos, yPos);
            if (pathIndex === 0) {
              const prevTransform =
                flower_Inactive.getAttribute('transform') || '';
              flower_Inactive.setAttribute(
                'transform',
                `${prevTransform} translate(${extraX}, ${extraY})`.trim(),
              );
            }
            fragment.appendChild(flower_Inactive);
          }
        }

        const endPath = paths[paths.length - 1];
        if (endPath) {
          const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
          const Gift_Svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g',
          );
          Gift_Svg.setAttribute('style', 'cursor: pointer;');
          Gift_Svg.classList.add(
            'PathwayStructure-end-reward-box',
            'PathwayStructure-end-reward-box--mystery',
          );
          Gift_Svg.appendChild(giftSVG.cloneNode(true));
          placeElement(Gift_Svg, endPoint.x - 25, endPoint.y - 40 + 15);

          if (visualCurrentIndex < pathEndIndex + 1) {
            Gift_Svg.addEventListener('click', () => {
              const replaceGiftContent = (newContent: SVGElement) => {
                while (Gift_Svg.firstChild) {
                  Gift_Svg.removeChild(Gift_Svg.firstChild);
                }
                Gift_Svg.appendChild(newContent.cloneNode(true));
              };
              const animationSequence = [
                { content: giftSVG2, delay: 300 },
                { content: giftSVG3, delay: 500 },
                { content: giftSVG2, delay: 700 },
                { content: giftSVG3, delay: 900 },
                {
                  callback: () => {
                    setModalText(rewardText);
                    setModalOpen(true);
                    replaceGiftContent(giftSVG);
                  },
                  delay: 1100,
                },
              ];
              animationSequence.forEach(({ content, callback, delay }) => {
                setTimeout(() => {
                  if (content) replaceGiftContent(content);
                  if (callback) callback();
                }, delay);
              });
            });
          }
          fragment.appendChild(Gift_Svg);
        }

        const animateChimpleMovement = () => {
          if (!chimple) return;
          const mascotElement = chimple;
          if (currentIndex > pathEndIndex) {
            sessionStorage.removeItem(REWARD_LEARNING_PATH);
            setIsRewardPathLoaded(true);
            return;
          }
          const currentLessonIndex = lessons.findIndex(
            (_, idx) => startIndex + idx === currentIndex,
          );
          if (currentLessonIndex < 0) return;
          const previousLessonIndex =
            typeof completedRewardIndex === 'number'
              ? completedRewardIndex
              : currentLessonIndex - 1;
          if (previousLessonIndex < 0) return;

          const fromPathIndex = startIndexOffset + previousLessonIndex;
          const toPathIndex = startIndexOffset + currentLessonIndex;

          const fromSlotX = slotXValues[fromPathIndex] ?? 0;
          const toSlotX = slotXValues[toPathIndex] ?? 0;

          const fromMascotX = fromSlotX + MASCOT_X_OFFSET;
          const toMascotX = toSlotX + MASCOT_X_OFFSET;

          mascotElement.setAttribute('x', `${toMascotX}`);
          let chimpleAnimY = startPoint.y - 12;
          if (window.innerWidth <= 1024) {
            chimpleAnimY -= 12;
          }
          mascotElement.setAttribute('y', `${chimpleAnimY}`);

          mascotElement.style.display = 'block';
          (
            mascotElement.style as CSSStyleDeclaration & {
              transformBox?: string;
            }
          ).transformBox = 'fill-box';
          mascotElement.style.transformOrigin = '0 0';
          mascotElement.style.willChange = 'transform';
          const fromTranslateX = fromMascotX - toMascotX;
          mascotElement.style.transition = 'none';
          mascotElement.style.transform = `translate(${fromTranslateX}px, 0px)`;
          void mascotElement.getBoundingClientRect();
          return new Promise<void>((resolve) => {
            let hasResolved = false;
            const finishMovement = () => {
              if (hasResolved) return;
              hasResolved = true;
              window.clearTimeout(fallbackTimer);
              mascotElement.removeEventListener(
                'transitionend',
                handleTransitionEnd,
              );
              resolve();
            };
            const handleTransitionEnd = (event: TransitionEvent) => {
              if (
                event.target === mascotElement &&
                event.propertyName === 'transform'
              )
                finishMovement();
            };
            const fallbackTimer = window.setTimeout(finishMovement, 2400);

            mascotElement.addEventListener(
              'transitionend',
              handleTransitionEnd,
            );
            requestAnimationFrame(() => {
              mascotElement.style.transition =
                'transform 2000ms cubic-bezier(0.22, 0.61, 0.36, 1)';
              mascotElement.style.transform = 'translate(0px, 0px)';
            });
          });
        };

        const runRewardAnimation = async (newRewardId: string) => {
          // If offline, this might fail, wrap in try/catch or skip if no internet
          try {
            const rewardRecord = await api.getRewardById(newRewardId);
            if (!rewardRecord) return;
            setHasTodayReward(false);
            const rewardStateValue = rewardRecord.state_number_input || 1;
            const completedLessonIndex =
              typeof completedRewardIndex === 'number'
                ? completedRewardIndex
                : lessons.findIndex(
                    (_, idx) => startIndex + idx === currentIndex - 1,
                  );
            if (completedLessonIndex < 0) {
              sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
              sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
              return;
            }
            const isFinalRewardTransition =
              completedLessonIndex + 1 >= lessonsToRender.length;

            const completedLessonPathIndex =
              startIndexOffset + completedLessonIndex;
            const destinationX = slotXValues[completedLessonPathIndex] ?? 0;

            const rewardForeignObject = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'foreignObject',
            );
            rewardForeignObject.setAttribute('width', '140');
            rewardForeignObject.setAttribute('height', '140');
            rewardForeignObject.setAttribute('x', '0');
            rewardForeignObject.setAttribute('y', '0');
            rewardForeignObject.style.display = 'block';
            (
              rewardForeignObject.style as CSSStyleDeclaration & {
                transformBox?: string;
                contain?: string;
              }
            ).transformBox = 'fill-box';
            rewardForeignObject.style.transformOrigin = '0 0';
            rewardForeignObject.style.willChange = 'transform';
            rewardForeignObject.style.backfaceVisibility = 'hidden';
            (
              rewardForeignObject.style as CSSStyleDeclaration & {
                transformBox?: string;
                contain?: string;
              }
            ).contain = 'layout paint style';
            const fromX = 570,
              fromY = 110;
            const toX = destinationX - 27,
              toY = startPoint.y - 69;
            const controlX = (fromX + toX) / 2,
              controlY = Math.min(fromY, toY) - 150;
            const duration = 4000;
            const start = performance.now();
            const animateBezier = (now: number) => {
              let t = (now - start) / duration;
              if (t > 1) t = 1;
              const easeInOutCubic = (val: number) =>
                val < 0.5
                  ? 4 * val * val * val
                  : 1 - Math.pow(-2 * val + 2, 3) / 2;
              const bezier = (
                tVal: number,
                p0: number,
                p1: number,
                p2: number,
              ) =>
                (1 - tVal) ** 2 * p0 +
                2 * (1 - tVal) * tVal * p1 +
                tVal ** 2 * p2;
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
              await invokeMascotCelebration(rewardStateValue);
              window.dispatchEvent(
                new CustomEvent(PATHWAY_REWARD_CELEBRATION_STARTED_EVENT, {
                  detail: {
                    rewardId: newRewardId,
                    stateValue: rewardStateValue,
                  },
                }),
              );
              await delay(500);
              rewardForeignObject.style.display = 'none';
              await delay(1000);
              await updateMascotToNormalState(newRewardId);
              await delay(500);
              sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
              sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
              if (isFinalRewardTransition) {
                localStorage.removeItem(HOMEWORK_PATHWAY);
                onHomeworkComplete?.();
              } else {
                await animateChimpleMovement();
              }
              window.dispatchEvent(
                new CustomEvent(PATHWAY_REWARD_AUDIO_READY_EVENT, {
                  detail: {
                    rewardId: newRewardId,
                    stateValue: rewardStateValue,
                  },
                }),
              );
            };
            const rewardDiv = document.createElement('div');
            rewardDiv.style.width = '100%';
            rewardDiv.style.height = '100%';
            rewardForeignObject.appendChild(rewardDiv);
            svg.appendChild(rewardForeignObject);
            setRewardRiveState(RewardBoxState.IDLE);
            setRewardRiveContainer(rewardDiv);
            // Let React mount RewardRive into rewardDiv before flight starts.
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
              });
            });
            requestAnimationFrame(animateBezier);
            await Util.updateUserReward();
          } catch (e) {
            logger.warn('Reward animation failed offline', e);
          }
        };

        // (newRewardId is already fetched in Promise.all above)

        svg.appendChild(fragment);

        if (chimple) {
          const currentLessonIdx = lessons.findIndex(
            (_, idx) => startIndex + idx === currentIndex,
          );
          const anchoredCurrentLessonIdx =
            currentLessonIdx >= 0
              ? currentLessonIdx
              : Math.min(
                  Math.max(currentIndex, 0),
                  Math.max(lessons.length - 1, 0),
                );
          const lastCompletedLessonIdx =
            typeof completedRewardIndex === 'number'
              ? completedRewardIndex
              : anchoredCurrentLessonIdx - 1;

          if (
            lastCompletedLessonIdx < 0 ||
            newRewardId == null ||
            !isRewardFeatureOn
          ) {
            const currentPathIndex =
              startIndexOffset + anchoredCurrentLessonIdx;
            const safePathIndex = Math.min(
              Math.max(currentPathIndex, 0),
              slotXValues.length - 1,
            );
            chimple.setAttribute(
              'x',
              `${slotXValues[safePathIndex] + MASCOT_X_OFFSET}`,
            );
          } else {
            const lastCompletedPathIndex =
              startIndexOffset + lastCompletedLessonIdx;
            const safePathIndex = Math.min(
              Math.max(lastCompletedPathIndex, 0),
              slotXValues.length - 1,
            );
            chimple.setAttribute(
              'x',
              `${slotXValues[safePathIndex] + MASCOT_X_OFFSET}`,
            );
          }

          let chimpleBaseY = startPoint.y - 12;
          if (window.innerWidth <= 1024) {
            chimpleBaseY -= 12;
          }
          chimple.setAttribute('y', `${chimpleBaseY}`);
          chimple.style.pointerEvents = 'none';
          const riveWrapper = document.createElement('div');
          riveWrapper.className = 'homeworkpathway-mascot-wrapper';
          riveWrapper.style.width = '100%';
          riveWrapper.style.height = '100%';

          riveWrapper.style.transform = 'scale(1.01)';
          riveWrapper.style.transformOrigin = 'bottom center';
          const riveDiv = document.createElement('div');
          riveDiv.style.width = '100%';
          riveDiv.style.height = '100%';

          riveWrapper.appendChild(riveDiv);
          chimple.appendChild(riveWrapper);
          svg.appendChild(chimple);

          setRiveContainer(riveDiv);
        }

        if (
          newRewardId !== null &&
          typeof newRewardId === 'string' &&
          isRewardFeatureOn
        ) {
          runRewardAnimation(newRewardId);
        }
      });
    } catch (error) {
      logger.error('Failed to load SVG:', error);
    }
  }, [
    api,
    checkAndUpdateReward,
    history,
    fetchSVGGroup,
    hasTodayReward,
    inactiveText,
    isRewardFeatureOn,
    loadHaloAnimation,
    loadPathwayContent,
    placeElement,
    preloadAllLessonImages,
    rewardText,
    setHasTodayReward,
    tryFetchSVG,
    updateMascotToNormalState,
    getPendingRewardTransition,
    onHomeworkComplete,
  ]);

  useEffect(() => {
    fetchHomeworkLessons();
  }, [fetchHomeworkLessons, isRewardPathLoaded]);

  useEffect(() => {
    if (homeworkLessons.length > 0) {
      loadSVG();
    } else {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [homeworkLessons, loadSVG]);

  useEffect(() => {
    if (!isRewardFeatureOn) return;
    initializeHomeworkRewardState();
  }, [initializeHomeworkRewardState, isRewardFeatureOn, isRewardPathLoaded]);

  useEffect(() => {
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
  }, [isRewardFeatureOn, shouldShowDailyRewardModal]);

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
      void playRewardCollectMascotAudio(
        rewardAudioSequence.stateValue ?? currentMascotStateValueRef.current,
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
      rewardAudioSequenceRef.current = {
        rewardId,
        crowdComplete: false,
        rewardReady: false,
        suppressed: false,
        stateValue:
          customEvent.detail?.stateValue ?? currentMascotStateValueRef.current,
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
        currentMascotStateValueRef.current;

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
      rewardAudioSequenceRef.current.token += 1;
      resetRewardAudioSequence();
    };
  }, [
    chimpleRiveAnimationName,
    chimpleRiveInputName,
    chimpleRiveStateMachineName,
    chimpleRiveStateValue,
    playRewardCollectMascotAudio,
  ]);

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());
  };

  const handleOnPlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());
    try {
      const storedHomeworkPath = localStorage.getItem(HOMEWORK_PATHWAY);
      if (!storedHomeworkPath) return;

      const homeworkPath = JSON.parse(storedHomeworkPath) as {
        lessons: HomeworkPathLessonItem[];
        currentIndex: number;
      };

      const activeLessonItem =
        homeworkPath.lessons?.[homeworkPath.currentIndex];
      if (!activeLessonItem) return;
      const fallbackLessonId = activeLessonItem.lesson?.id;
      if (!fallbackLessonId && !activeLessonItem.lesson?.plugin_type) return;

      const lesson =
        activeLessonItem.lesson?.id && activeLessonItem.lesson?.plugin_type
          ? activeLessonItem.lesson
          : await api.getLesson(fallbackLessonId as string);

      if (!lesson) return;

      const courseDocId = activeLessonItem.course_id;
      const chapterDocId = activeLessonItem.chapter_id;

      if (!currentCourse || currentCourse.id !== courseDocId) {
        try {
          const course = await api.getCourse(courseDocId);
          setCurrentCourse(course);
        } catch (error) {
          logger.warn('Failed to refresh homework reward course', error);
        }
      }

      if (!currentChapter || currentChapter.id !== chapterDocId) {
        try {
          const chapter = await api.getChapterById(chapterDocId);
          setCurrentChapter(chapter);
        } catch (error) {
          logger.warn('Failed to refresh homework reward chapter', error);
        }
      }

      const nextCourse =
        currentCourse?.id === courseDocId
          ? currentCourse
          : await api.getCourse(courseDocId).catch(() => currentCourse);
      const nextChapter =
        currentChapter?.id === chapterDocId
          ? currentChapter
          : await api.getChapterById(chapterDocId).catch(() => currentChapter);

      const lidoLessonId =
        lesson.lido_lesson_id ||
        (lesson.plugin_type === LIDO ? lesson.cocos_lesson_id : null);

      if (lidoLessonId) {
        const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lidoLessonId}`;
        history.push(PAGES.LIDO_PLAYER + params, {
          lessonId: lidoLessonId,
          courseDocId,
          course: JSON.stringify(nextCourse),
          lesson: JSON.stringify(lesson),
          chapter: JSON.stringify(nextChapter),
          from: history.location.pathname + `?${CONTINUE}=true`,
          isHomework: true,
          homeworkIndex: homeworkPath.currentIndex,
          reward: true,
        });
      } else if (lesson.plugin_type === COCOS) {
        const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
        history.push(PAGES.GAME + params, {
          url: 'chimple-lib/index.html' + params,
          lessonId: lesson.cocos_lesson_id,
          courseDocId,
          course: JSON.stringify(nextCourse),
          lesson: JSON.stringify(lesson),
          chapter: JSON.stringify(nextChapter),
          from: history.location.pathname + `?${CONTINUE}=true`,
          isHomework: true,
          homeworkIndex: homeworkPath.currentIndex,
          reward: true,
        });
      } else if (lesson.plugin_type === LIVE_QUIZ) {
        history.push(
          PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
          {
            courseId: courseDocId,
            lesson: JSON.stringify(lesson),
            from: history.location.pathname + `?${CONTINUE}=true`,
            isHomework: true,
            homeworkIndex: homeworkPath.currentIndex,
            reward: true,
          },
        );
      }
    } catch (error) {
      logger.error('Error in playLesson:', error);
    }
  };

  return (
    <>
      {isModalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
          audioFolder={
            modalText === inactiveText
              ? 'lessonLocked'
              : modalText === rewardText
                ? 'completeLesson'
                : undefined
          }
          audioClipName={
            modalText === inactiveText
              ? 'lesson_locked'
              : modalText === rewardText
                ? 'complete_lesson_to_get_reward'
                : undefined
          }
        />
      )}
      <div className="homeworkpathway-structure-div" ref={containerRef}></div>
      {riveContainer &&
        ReactDOM.createPortal(
          <div className="homeworkpathway-mascot-wrapper">
            <ChimpleRiveMascot
              key={mascotKey}
              stateMachine={chimpleRiveStateMachineName}
              inputName={chimpleRiveInputName}
              stateValue={chimpleRiveStateValue}
              animationName={chimpleRiveAnimationName}
              overlayRules={[
                {
                  stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
                  inputName: CHIMPLE_MASCOT_INPUT_REWARD,
                },
              ]}
            />
          </div>,
          riveContainer,
        )}

      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleOpen} />
      )}

      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t('Play one lesson and collect your daily reward!')}
          onClose={handleClose}
          onPlay={handleOnPlay}
        />
      )}
    </>
  );
};

export default HomeworkPathwayStructure;
