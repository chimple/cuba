import { IonPage, IonHeader, useIonRouter } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import {
  HOMEHEADERLIST,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
  HeaderIconConfig,
  DEFAULT_HEADER_ICON_CONFIGS,
  MODES,
  CONTINUE,
  LIVE_QUIZ,
  SHOW_DAILY_PROGRESS_FLAG,
  IS_CONECTED,
  TableTypes,
  RECOMMENDATIONS,
  STARS_COUNT,
  LANGUAGE,
  LANG,
  IS_REWARD_FEATURE_ON,
  GENERIC_POP_UP,
} from "../common/constants";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
import HomeHeader from "../components/HomeHeader";
import { useHistory, useLocation } from "react-router";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";
import { Util } from "../utility/util";
import { ServiceConfig } from "../services/ServiceConfig";
import { Timestamp } from "firebase/firestore";
import { schoolUtil } from "../utility/schoolUtil";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { t } from "i18next";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import SearchLesson from "./SearchLesson";
import AssignmentPage from "./Assignment";
import Subjects from "./Subjects";
import LiveQuiz from "./LiveQuiz";
import SkeltonLoading from "../components/SkeltonLoading";
import { AvatarObj } from "../components/animation/Avatar";
import LearningPathway from "../components/LearningPathway";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";
import { Device } from "@capacitor/device";
import i18n from "../i18n";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import CampaignPopupGating from "../components/WinterCampaignPopup/WinterCampaignPopupGating";
import WinterCampaignPopupGating from "../components/WinterCampaignPopup/WinterCampaignPopupGating";
import PopupManager from "../components/GenericPopUp/GenericPopUpManager";
import { useGrowthBook } from "@growthbook/growthbook-react";
const localData: any = {};

const Home: FC = () => {
  const [dataCourse, setDataCourse] = useState<TableTypes<"lesson">[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStudentLinked, setIsStudentLinked] = useState<boolean>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [lessonCourseMap, setLessonCourseMap] = useState<{
    [lessonId: string]: { course_id: string };
  }>({});
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [pendingAssignments, setPendingAssignments] = useState<
    TableTypes<"assignment">[]
  >([]);
  const [pendingLiveQuizCount, setPendingLiveQuizCount] = useState<number>(0);
  const [pendingAssignmentCount, setPendingAssignmentCount] =
    useState<number>(0);
  const history = useHistory();
  const { setGbUpdated } = useGbContext();
  const isRewardFeatureOn = useFeatureIsOn(IS_REWARD_FEATURE_ON);

  if (isRewardFeatureOn === true) {
    localStorage.setItem(IS_REWARD_FEATURE_ON, "true");
  } else if (isRewardFeatureOn === false) {
    localStorage.setItem(IS_REWARD_FEATURE_ON, "false");
  }

  let tempPageNumber = 1;
  const location = useLocation();
  const getCanShowAvatar = async () => {
    // const canShowAvatarValue = await Util.getCanShowAvatar();

    setCanShowAvatar(true);
  };
  const urlParams = new URLSearchParams(location.search);
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>(true);
  const [currentHeader, setCurrentHeader] = useState(() => {
    const currPage = urlParams.get("tab");
    if (
      currPage &&
      Object.values(HOMEHEADERLIST).includes(currPage as HOMEHEADERLIST)
    ) {
      return currPage as HOMEHEADERLIST;
    } else {
      return localStorage.getItem("currentHeader") || HOMEHEADERLIST.HOME;
    }
  });
  const appStateChange = (isActive) => {
    Util.onAppStateChange({ isActive });
  };

  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);

  useEffect(() => {
    if (currentHeader) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("tab", currentHeader);
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [currentHeader]);

  const growthbook = useGrowthBook();
  useEffect(() => {
    if (!growthbook) return;

    const popupConfig = growthbook.getFeatureValue(GENERIC_POP_UP, null) as any;

    if (!popupConfig) return;

    if (
      currentHeader &&
      popupConfig.screen_name &&
      currentHeader.toLowerCase() === popupConfig.screen_name.toLowerCase()
    ) {
      PopupManager.onAppOpen(popupConfig);
      PopupManager.onTimeElapsed(popupConfig);
    }
  }, [growthbook, currentHeader]);

  useEffect(() => {
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    const studentDetails = student;
    let parent;
    (async () => {
      // Get Parent Info
      if (!(studentDetails as any).parent_id) {
        parent = await ServiceConfig.getI()?.authHandler.getCurrentUser();
        (studentDetails as any).parent_id = parent?.id;
      }

      // Get Device Info
      const device = await Util.logDeviceInfo();

      // Initial Update with Student and Device info
      updateLocalAttributes({ studentDetails, ...device });
      setGbUpdated(true);
    })();

    localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "true");
    Util.checkDownloadedLessonsFromLocal();
    initData();
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setSubTab(SUBTAB.SUGGESTIONS);
    getCanShowAvatar();
    if (!!urlParams.get(CONTINUE)) {
      setCurrentHeader(currentHeader);
    }
    window.addEventListener("JoinClassListner", handleJoinClassEvent);
    App.addListener("appStateChange", ({ isActive }) =>
      appStateChange(isActive),
    );
    const handlePathwayCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
    };
    window.addEventListener("PathwayCreated", handlePathwayCreated);
    return () => {
      window.removeEventListener("PathwayCreated", handlePathwayCreated);
    };
  }, []);

  useEffect(() => {
    setCurrentHeader(
      currentHeader === HOMEHEADERLIST.PROFILE
        ? HOMEHEADERLIST.HOME
        : currentHeader,
    );
    localStorage.setItem("currentHeader", currentHeader);
    if (currentHeader !== HOMEHEADERLIST.HOME) {
      fetchData();
    }
  }, [currentHeader]);
  // adding background image for learning-pathway
  useEffect(() => {
    Util.loadBackgroundImage();
  }, [currentHeader, canShowAvatar]);
  const handleJoinClassEvent = async (event) => {
    await getAssignments();
    setCanShowAvatar(true);
    setIsStudentLinked(true);
    setRefreshKey((oldKey) => oldKey + 1);
    window.removeEventListener("JoinClassListner", handleJoinClassEvent);
  };
  const initData = async () => {
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    const langDoc = await api.getLanguageWithId(student.language_id ?? "");
    if (langDoc) {
      const tempLangCode = langDoc.code ?? LANG.ENGLISH;
      localStorage.setItem(LANGUAGE, tempLangCode);
      await i18n.changeLanguage(tempLangCode);
    }
    const studentResult = await api.getStudentResultInMap(student.id);
    if (!!studentResult) {
      setLessonResultMap(studentResult);
      const count_of_lessons_played = Object.values(studentResult).filter(
        (item) => item.assignment_id === null,
      );
      const total_assignments_played = Object.values(studentResult).filter(
        (item) => item.assignment_id !== null,
      );
      let latestDate = null;
      for (const lessonId in studentResult) {
        const currentDate: any = studentResult[lessonId].updated_at;
        if (!latestDate || new Date(currentDate) > new Date(latestDate)) {
          latestDate = currentDate;
        }
      }
      const attributes = {
        count_of_lessons_played: count_of_lessons_played.length,
        count_of_assignment_played: total_assignments_played.length,
        last_assignment_played_at: latestDate,
      };
      updateLocalAttributes(attributes);
      setGbUpdated(true);
    }
    const lessonCourseMap = Object.fromEntries(
      Object.entries(studentResult).map(([lessonDocId, details]) => [
        lessonDocId,
        { course_id: details.course_id || "" },
      ]),
    );
    setLessonCourseMap(lessonCourseMap);
    fetchData();
    await isLinked();

    // Call these to ensure attributes are set on Home load
    const updateAtb = async () => {
      await Util.updateSchStdAttb();
      setGbUpdated(true);
    };
    updateAtb();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("page") === PAGES.JOIN_CLASS) {
      setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
      setTimeout(() => {
        setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
      }, 500);
    } else if (urlParams.get("page") === PAGES.LIVE_QUIZ) {
      if (isStudentLinked) setCurrentHeader(HOMEHEADERLIST.LIVEQUIZ);
      else setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
    }
  };

  function sortPlayedLessonDocByDate(playedLessonData: TableTypes<"result">[]) {
    const lessonArray: { lessonDoc: string; combinedTime: number }[] = [];
    for (const lessonDoc of playedLessonData) {
      const lessonDate = Timestamp.fromDate(
        new Date(lessonDoc?.updated_at ?? ""),
      );
      const combinedTime =
        lessonDate.seconds * 1000000000 + lessonDate.nanoseconds;
      lessonArray.push({ lessonDoc: lessonDoc.lesson_id ?? "", combinedTime });
    }
    lessonArray.sort((a, b) => b.combinedTime - a.combinedTime);
    return lessonArray.map((item) => item.lessonDoc);
  }

  const fetchData = async () => {
    setIsLoading(true);
    AvatarObj.getInstance().unlockedRewards =
      (await Util.getAllUnlockedRewards()) || [];
    setIsLoading(false);
  };

  async function isLinked() {
    const student = Util.getCurrentStudent();
    const conectedData = localStorage.getItem(IS_CONECTED);

    const parsedConectedData = conectedData ? JSON.parse(conectedData) : {};
    if (student && parsedConectedData[student.id] != undefined) {
      setIsStudentLinked(parsedConectedData[student.id]);
      // linked = parsedConectedData[student.id];
    }
    if (student) {
      if (isStudentLinked == undefined) {
        var linked = await api.isStudentLinked(student.id);
        parsedConectedData[student.id] = linked;
        setIsStudentLinked(linked);
      } else {
        api.isStudentLinked(student.id).then((value) => {
          parsedConectedData[student.id] = value;
        });
      }

      localStorage.setItem(IS_CONECTED, JSON.stringify(parsedConectedData));
    }
    AvatarObj.getInstance().unlockedRewards =
      (await Util.getAllUnlockedRewards()) || [];
  }

  const api = ServiceConfig.getI().apiHandler;

  async function getAssignments(): Promise<TableTypes<"lesson">[]> {
    let reqLes: TableTypes<"lesson">[] = [];
    // setIsLoading(true);
    const student = Util.getCurrentStudent();
    const linkedData =
      student != null
        ? await api.getStudentClassesAndSchools(student.id)
        : null;
    const classDoc = linkedData?.classes[0];
    if (classDoc?.id) await api.assignmentListner(classDoc?.id, () => {});
    if (student) await api.assignmentUserListner(student.id, () => {});

    if (
      student != null &&
      !!linkedData &&
      !!linkedData.classes &&
      linkedData.classes.length > 0
    ) {
      const allAssignments: TableTypes<"assignment">[] = [];

      await Promise.all(
        linkedData.classes.map(async (_class) => {
          const res = await api.getPendingAssignments(_class.id, student.id);
          allAssignments.push(...res);
        }),
      );
      let assignmentCount = 0;
      let liveQuizCount = 0;

      const counts: Record<string, number> = {};

      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson_id);
          const now = new Date().toISOString();
          if (_assignment.type !== LIVE_QUIZ) {
            assignmentCount++;
            const subject_id = res?.subject_id;
            if (!subject_id) return;
            const key = `count_of_subject_${subject_id}_pending`;
            counts[key] = (counts[key] || 0) + 1;
          } else {
            if (_assignment.ends_at && _assignment.starts_at) {
              if (_assignment.starts_at <= now && _assignment.ends_at > now) {
                liveQuizCount++;
              }
            }
          }
          if (!!res) {
            // res.assignment = _assignment;
            (res as any).course_id = _assignment.course_id || null;
            reqLes.push(res);
          }
        }),
      );

      setPendingLiveQuizCount(liveQuizCount);
      setPendingAssignmentCount(assignmentCount);
      setPendingAssignments(allAssignments);

      const courseCount = allAssignments.reduce((accumulator, current: any) => {
        if (accumulator[current.course_id]) {
          accumulator[current.course_id] += 1;
        } else {
          accumulator[current.course_id] = 1;
        }
        return accumulator;
      }, {});
      const result = Object.keys(courseCount).reduce((acc, courseId) => {
        acc[`count_of_course_${courseId}_pending`] = courseCount[courseId];
        return acc;
      }, {});
      const device = await Util.logDeviceInfo();
      const attributeParams = {
        studentDetails: student,
        schools: linkedData.schools.map((item: any) => item.id),
        school_name: linkedData.schools[0]?.name,
        classes: linkedData.classes.map((item: any) => item.id),
        liveQuizCount: liveQuizCount,
        assignmentCount: assignmentCount,
        pending_course_counts: result,
        pending_subject_counts: counts,
        ...device,
      };
      updateLocalAttributes(attributeParams);
      setGbUpdated(true);
      setDataCourse(reqLes);
      return reqLes;
    } else {
      return [];
    }
  }

  enum SUBTAB {
    SUGGESTIONS,
    FAVOURITES,
    HISTORY,
  }
  const [subTab, setSubTab] = useState(SUBTAB.SUGGESTIONS);

  const handleHomeIconClick = () => {
    setSubTab(SUBTAB.SUGGESTIONS);
  };

  const getHistory = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const studentResult = await api.getStudentResult(currentStudent.id, false);
    const courseCounts: any = {};

    if (studentResult) {
      const playedLessonData = studentResult;
      const sortedLessonDocIds = sortPlayedLessonDocByDate(playedLessonData);
      const allValidPlayedLessonDocIds = sortedLessonDocIds.filter(
        (lessonDoc) => lessonDoc !== undefined,
      );
      for (const course of studentResult) {
        const courseId = course.course_id;
        if (!courseId) {
          continue;
        }
        const key = `${courseId}_course_completed`;
        courseCounts[key] = (courseCounts[key] || 0) + 1;
      }
      updateLocalAttributes({
        courseCounts,
        total_assignments_played: allValidPlayedLessonDocIds.length,
      });
      setGbUpdated(true);
      return allValidPlayedLessonDocIds;
    }
  };

  async function onHeaderIconClick(selectedHeader: any) {
    let reqLes: TableTypes<"lesson">[] = [];
    var headerIconList: HeaderIconConfig[] = [];
    DEFAULT_HEADER_ICON_CONFIGS.forEach((element) => {
      headerIconList.push(element);
    });
    setCurrentHeader(selectedHeader);
    localStorage.setItem("currentHeader", selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    DEFAULT_HEADER_ICON_CONFIGS.get(selectedHeader);
    switch (selectedHeader) {
      case HOMEHEADERLIST.HOME:
        handleHomeIconClick();
        break;
      case HOMEHEADERLIST.PROFILE:
        Util.setPathToBackButton(PAGES.LEADERBOARD, history);
        const body = document.querySelector("body");
        body?.style.removeProperty("background-image");
        break;
      default:
        break;
    }
  }

  return (
    <IonPage id="home-page">
      <IonHeader id="home-header">
        <HomeHeader
          key={refreshKey}
          currentHeader={currentHeader}
          onHeaderIconClick={onHeaderIconClick}
          pendingAssignmentCount={pendingAssignmentCount}
          pendingLiveQuizCount={pendingLiveQuizCount}
        />
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar ? (
              <LearningPathway />
            ) : null}

            {currentHeader === HOMEHEADERLIST.SUBJECTS && <Subjects />}

            {currentHeader === HOMEHEADERLIST.ASSIGNMENT && (
              <AssignmentPage
                assignmentCount={setPendingAssignmentCount}
                onPlayMoreHomework={() => {
                  setCurrentHeader(HOMEHEADERLIST.HOME);
                }}
              />
            )}

            {currentHeader === HOMEHEADERLIST.SEARCH && <SearchLesson />}
            {currentHeader === HOMEHEADERLIST.LIVEQUIZ && (
              <LiveQuiz liveQuizCount={setPendingLiveQuizCount} />
            )}
          </div>
        ) : null}
        <SkeltonLoading isLoading={isLoading} header={currentHeader} />
      </div>
      <WinterCampaignPopupGating />
    </IonPage>
  );
};
export default Home;