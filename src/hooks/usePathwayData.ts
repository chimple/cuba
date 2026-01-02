import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { t } from "i18next";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

import {
  CAN_ACCESS_REMOTE_ASSETS,
  IDLE_REWARD_ID,
  IS_REWARD_FEATURE_ON,
  REWARD_MODAL_SHOWN_DATE,
  RewardBoxState,
  TableTypes,
  COCOS,
  LIVE_QUIZ,
  LIDO,
  PAGES,
  CONTINUE,
  COURSE_CHANGED,
  CAMPAIGN_SEQUENCE_FINISHED,
} from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { useReward } from "./useReward";
import { schoolUtil } from "../utility/schoolUtil";

export interface MascotProps {
  stateMachine: string;
  inputName: string;
  stateValue: number;
  animationName?: string;
}

export const usePathwayData = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  // Portal containers
  const [riveContainer, setRiveContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [rewardRiveContainer, setRewardRiveContainer] =
    useState<HTMLDivElement | null>(null);

  // Reward rive
  const [rewardRiveState, setRewardRiveState] = useState<
    RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST
  >(RewardBoxState.IDLE);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");

  const inactiveText = t(
    "This lesson is locked. Play the current active lesson."
  );
  const rewardText = t("Complete these 5 lessons to earn rewards");
  const shouldAnimate = modalText === rewardText;

  const shouldShowRemoteAssets = useFeatureIsOn(CAN_ACCESS_REMOTE_ASSETS);
  const isRewardFeatureOn: boolean =
    localStorage.getItem(IS_REWARD_FEATURE_ON) === "true";

  const {
    hasTodayReward,
    setHasTodayReward,
    checkAndUpdateReward,
    shouldShowDailyRewardModal,
  } = useReward();

  // Course + chapter
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<"chapter">>();

  // Reward modal
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [isRewardPathLoaded, setIsRewardPathLoaded] = useState(false);
  const [isCampaignFinished, setIsCampaignFinished] = useState(false);

  // Mascot state
  const [chimpleRiveStateMachineName, setChimpleRiveStateMachineName] =
    useState<string>("State Machine 3");
  const [chimpleRiveInputName, setChimpleRiveInputName] =
    useState<string>("Number 2");
  const [chimpleRiveStateValue, setChimpleRiveStateValue] = useState<number>(1);
  const [chimpleRiveAnimationName, setChimpleRiveAnimationName] = useState<
    string | undefined
  >("id");

  const [mascotKey, setMascotKey] = useState(0);

  // Lesson cache
  const lessonCacheRef = useRef<Map<string, any>>(new Map());

  const getCachedLesson = async (lessonId: string): Promise<any> => {
    const lessonCache = lessonCacheRef.current;
    if (lessonCache.has(lessonId)) return lessonCache.get(lessonId);

    const key = `lesson_${lessonId}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      lessonCache.set(lessonId, parsed);
      return parsed;
    }

    const lesson = await api.getLesson(lessonId);
    lessonCache.set(lessonId, lesson);
    sessionStorage.setItem(key, JSON.stringify(lesson));
    return lesson;
  };

  //  MASCOT: NORMAL STATE (IDLE)
  const updateMascotToNormalState = async (rewardId: string) => {
    const rewardRecord = await api.getRewardById(rewardId);
    if (rewardRecord && rewardRecord.type === "normal") {
      setChimpleRiveStateMachineName(
        rewardRecord.state_machine || "State Machine 3"
      );
      setChimpleRiveInputName(rewardRecord.state_input_name || "Number 2");
      setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
      setChimpleRiveAnimationName(undefined);
      setMascotKey((prev) => prev + 1);
    } else {
      setChimpleRiveAnimationName("id");
      setMascotKey((prev) => prev + 1);
    }
  };

  //  MASCOT: CELEBRATION STATE
  const invokeMascotCelebration = async (state_number_input: number) => {
    setChimpleRiveStateMachineName("State Machine 2");
    setChimpleRiveInputName("Number 1");
    setChimpleRiveStateValue(state_number_input || 1);
    setChimpleRiveAnimationName(undefined);
    setMascotKey((prev) => prev + 1);
  };

  // INITIALIZE PATHWAY
  const initializePathway = async () => {
    try {
      const todaysReward = await Promise.all([
        checkAndUpdateReward(),
        Util.fetchTodaysReward(),
      ]).then(([, result]) => result);

      const currentReward = Util.retrieveUserReward();
      const today = new Date().toISOString().split("T")[0];

      const receivedTodayReward =
        currentReward?.timestamp &&
        new Date(currentReward.timestamp).toISOString().split("T")[0] ===
          today &&
        todaysReward?.id === currentReward?.reward_id;

      setHasTodayReward(!receivedTodayReward);

      if (currentReward.reward_id !== IDLE_REWARD_ID) {
        await updateMascotToNormalState(currentReward.reward_id);
      }
    } catch (err) {
      console.error("Error in initializePathway:", err);
    }
  };

  // 🟡 Decide campaign applicability per student
  useEffect(() => {
    const student = Util.getCurrentStudent();
    const school = schoolUtil.getCurrentClass();

    // No student → campaign irrelevant
    if (!student?.id) {
      setIsCampaignFinished(true);
      return;
    }

    // Student exists but no school → campaign irrelevant
    if (!school?.school_id) {
      setIsCampaignFinished(true);
      return;
    }

    // Student has a school → wait for WinterCampaignPopupGating
    setIsCampaignFinished(false);
  }, [Util.getCurrentStudent()?.id]);

  // COURSE CHANGE RELOAD
  useEffect(() => {
    const handleCourseChange = () => {
      (window as any).__triggerPathwayReload__?.();
    };
    window.addEventListener(COURSE_CHANGED, handleCourseChange);
    return () => window.removeEventListener(COURSE_CHANGED, handleCourseChange);
  }, []);

  useEffect(() => {
    const handleFinished = () => {
      setIsCampaignFinished(true);
    };
    window.addEventListener(CAMPAIGN_SEQUENCE_FINISHED, handleFinished);
    return () =>
      window.removeEventListener(CAMPAIGN_SEQUENCE_FINISHED, handleFinished);
  }, []);

  // INITIALIZE REWARD PATH
  useEffect(() => {
    if (isRewardFeatureOn) {
      initializePathway();
    }
  }, [isRewardPathLoaded, isRewardFeatureOn]);

  // DAILY REWARD MODAL
  const hasRunDailyCheckRef = useRef(false);

  useEffect(() => {
    if (!isRewardFeatureOn) return;
    if (!isCampaignFinished) return;

    if (hasRunDailyCheckRef.current) return;

    hasRunDailyCheckRef.current = true;

    const showModalIfNeeded = async () => {
      const showModal = await shouldShowDailyRewardModal();
      setRewardModalOpen(showModal);
      hasRunDailyCheckRef.current = true;
    };

    showModalIfNeeded();
  }, [isCampaignFinished, isRewardFeatureOn]);

  const handleRewardBoxOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const today = new Date().toISOString().split("T")[0];
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, today);
    setRewardModalOpen(true);
  };

  const handleRewardModalClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());
  };

  const handleRewardModalPlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());

    try {
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent?.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];
      const { currentIndex } = course;
      const pathItem = course.path[currentIndex];
      const isAssessment = pathItem?.is_assessment

      const lesson = await api.getLesson(course.path[currentIndex].lesson_id);
      if (!lesson) return;

      // Navigate based on plugin type
      if (lesson.plugin_type === COCOS) {
        const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
        history.replace(PAGES.GAME + params, {
          url: "chimple-lib/index.html" + params,
          lessonId: lesson.cocos_lesson_id,
          courseDocId: course.course_id,
          course: JSON.stringify(currentCourse),
          lesson: JSON.stringify(lesson),
          chapter: JSON.stringify(currentChapter),
          from: history.location.pathname + `?${CONTINUE}=true`,
          learning_path: true,
          reward: true,
          skillId: course.path[currentIndex]?.skill_id,
          is_assessment: isAssessment
        });
      } else if (lesson.plugin_type === LIVE_QUIZ) {
        history.replace(
          PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
          {
            courseId: course.course_id,
            lesson: JSON.stringify(lesson),
            from: history.location.pathname + `?${CONTINUE}=true`,
            learning_path: true,
            reward: true,
            skillId: course.path[currentIndex]?.skill_id,
            is_assessment: isAssessment
          }
        );
      } else if (lesson.plugin_type === LIDO) {
        const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
        history.replace(PAGES.LIDO_PLAYER + params, {
          lessonId: lesson.cocos_lesson_id,
          courseDocId: course.course_id,
          course: JSON.stringify(currentCourse),
          lesson: JSON.stringify(lesson),
          chapter: JSON.stringify(currentChapter),
          from: history.location.pathname + `?${CONTINUE}=true`,
          learning_path: true,
          reward: true,
          skillId: course.path[currentIndex]?.skill_id,
          is_assessment: isAssessment
        });
      }
    } catch (error) {
      console.error("Error in playLesson:", error);
    }
  };

  const mascotProps: MascotProps = {
    stateMachine: chimpleRiveStateMachineName,
    inputName: chimpleRiveInputName,
    stateValue: chimpleRiveStateValue,
    animationName: chimpleRiveAnimationName,
  };

  return {
    containerRef,

    // For SVG hook
    getCachedLesson,
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
    checkAndUpdateReward,

    // Mascot UI
    mascotKey,
    mascotProps,

    // Reward
    rewardRiveContainer,
    riveContainer,
    rewardRiveState,
    hasTodayReward,
    isRewardFeatureOn,

    // Modals
    modalOpen,
    modalText,
    setModalOpen,
    setModalText,
    shouldAnimate,
    rewardModalOpen,
    isCampaignFinished,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,

    // Misc
    inactiveText,
    rewardText,
    shouldShowRemoteAssets,
  };
};
