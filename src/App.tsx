import { Route, Switch, useHistory } from "react-router-dom";
import {
  IonAlert,
  IonApp,
  IonButton,
  IonModal,
  IonRouterOutlet,
  IonToast,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import Home from "./pages/Home";
import CocosGame from "./pages/CocosGame";
import { End } from "./pages/End";
import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import { App as CapApp } from "@capacitor/app";
import {
  // APP_LANG,
  BASE_NAME,
  CACHE_IMAGE,
  CONTINUE,
  DOWNLOADING_CHAPTER_ID,
  DOWNLOAD_BUTTON_LOADING_STATUS,
  GAME_URL,
  HOMEHEADERLIST,
  IS_CUBA,
  MODES,
  PAGES,
  PortPlugin,
} from "./common/constants";
import { Util } from "./utility/util";
import Parent from "./pages/Parent";
import EditStudent from "./pages/EditStudent";
import DisplayStudents from "./pages/DisplayStudents";
// import Assignments from "./pages/Assignments";
// import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import DisplaySubjects from "./pages/DisplaySubjects";
import AddCourses from "./pages/AddCourses";
import AppLangSelection from "./pages/AppLangSelection";
import StudentProgress from "./pages/StudentProgress";
import SearchLesson from "./pages/SearchLesson";
import Leaderboard from "./pages/Leaderboard";
import AssignmentPage from "./pages/Assignment";
import SelectMode from "./pages/SelectMode";
import { FirebaseRemoteConfig } from "@capacitor-firebase/remote-config";
import HotUpdate from "./pages/HotUpdate";
import TermsAndConditions from "./pages/TermsAndConditions";
import DisplayChapters from "./pages/DisplayChapters";
import LiveQuizRoom from "./pages/LiveQuizRoom";
import LiveQuiz from "./pages/LiveQuiz";
import { AvatarObj } from "./components/animation/Avatar";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "./services/RemoteConfig";
import LiveQuizGame from "./pages/LiveQuizGame";
import LiveQuizRoomResult from "./pages/LiveQuizRoomResult";
import LiveQuizLeaderBoard from "./pages/LiveQuizLeaderBoard";
import { useOnlineOfflineErrorMessageHandler } from "./common/onlineOfflineErrorMessageHandler";
import { t } from "i18next";
import { useTtsAudioPlayer } from "./components/animation/animationUtils";
import { ServiceConfig } from "./services/ServiceConfig";
import User from "./models/user";
// import TeacherProfile from "./pages/Malta/TeacherProfile";
import React from "react";
import Dashboard from "./pages/Malta/Dashboard";
import TeachersStudentDisplay from "./pages/Malta/TeachersStudentDisplay";
import "./App.css";
import { schoolUtil } from "./utility/schoolUtil";
import LidoPlayer from "./pages/LidoPlayer";
import UploadPage from "./ops-console/pages/UploadPage";
import SidebarPage from "./ops-console/pages/SidebarPage";
import { initializeClickListener } from "./analytics/clickUtil";
import ResetPassword from "./pages/ResetPassword";
import DisplayClasses from "./teachers-module/pages/DisplayClasses";
import LessonDetails from "./teachers-module/pages/LessonDetails";
import ShowStudentsInAssignmentPage from "./teachers-module/pages/ShowStudentsInAssignmentPage";
import ReqEditSchool from "./teachers-module/pages/ReqEditSchool";
import StudentProfile from "./teachers-module/pages/StudentProfile";
import AddStudent from "./teachers-module/pages/AddStudent";
import UserProfile from "./teachers-module/pages/UserProfile";
import SubjectSelection from "./teachers-module/pages/SubjectSelection";
import DisplaySchools from "./teachers-module/pages/DisplaySchools";
import StudentReport from "./teachers-module/pages/StudentReport";
import ManageSchools from "./teachers-module/pages/ManageSchools";
import SchoolProfile from "./teachers-module/pages/SchoolProfile";
import ManageClass from "./teachers-module/pages/ManageClass";
import DashBoardDetails from "./teachers-module/pages/DashBoardDetails";
import EditClass from "./teachers-module/pages/EditClass";
import ClassProfile from "./teachers-module/pages/ClassProfile";
import ShowChapters from "./teachers-module/pages/ShowChapters";
import SearchLessons from "./teachers-module/pages/SearchLessons";
import HomePage from "./teachers-module/pages/HomePage";
import ClassUsers from "./teachers-module/pages/ClassUsers";
import AddTeacher from "./teachers-module/pages/AddTeacher";
import TeacherProfile from "./teachers-module/pages/TeacherProfile";
import SchoolUsers from "./teachers-module/pages/SchoolUsers";
import AddSchoolUser from "./teachers-module/pages/AddSchoolUser";
import ProgramsPage from "./ops-console/pages/ProgramPage";
import ProgramDetailPage from "./ops-console/pages/ProgramDetailsPage";
import NewProgram from "./ops-console/components/NewProgram";
import SchoolList from "./ops-console/pages/SchoolList";

setupIonicReact();
interface ExtraData {
  notificationType?: string;
  rewardProfileId?: string;
  classId?: string;
}
interface WindowEventMap {
  shouldShowModal: CustomEvent<boolean>;
}
const TIME_LIMIT = 1500; // 25 * 60
const LAST_MODAL_SHOWN_KEY = "lastTimeExceededShown";
const START_TIME_KEY = "startTime";
const USED_TIME_KEY = "usedTime";
const LAST_ACCESS_DATE_KEY = "lastAccessDate";
const IS_INITIALIZED = "isInitialized";
let timeoutId: NodeJS.Timeout;

const App: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const [startTime, setStartTime] = useState<number>(() => {
    const savedStartTime = localStorage.getItem(START_TIME_KEY);
    const initialTime = savedStartTime ? Number(savedStartTime) : Date.now();
    if (!savedStartTime) {
      localStorage.setItem("startTime", initialTime.toString());
    }
    return initialTime;
  });
  const [timeExceeded, setTimeExceeded] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    const cleanup = initializeClickListener();
    const handleOnline = () => {
      if (!online) {
        setOnline(true);
        presentToast({
          message: "Device is online.",
          color: "success",
          duration: 3000,
          position: "bottom",
          buttons: [
            {
              text: "Dismiss",
              role: "cancel",
            },
          ],
        });
      }
    };

    const handleOffline = () => {
      setOnline(false);
      presentToast({
        message: "Device is offline.",
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      cleanup();
    };
  }, [online, presentToast]);
  useEffect(() => {
    initializeUsage();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    startTimeout();
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(false));
    localStorage.setItem(DOWNLOADING_CHAPTER_ID, JSON.stringify(false));
    CapApp.addListener("appStateChange", Util.onAppStateChange);
    localStorage.setItem(IS_CUBA, "1");
    if (Capacitor.isNativePlatform()) {
      //CapApp.addListener("appStateChange", Util.onAppStateChange);
      // Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });

      const portPlugin = registerPlugin<PortPlugin>("Port");
      portPlugin.addListener("notificationOpened", (data: any) => {
        if (data.fullPayload) {
          const formattedPayload = JSON.parse(data.fullPayload);
          processNotificationData(formattedPayload);
        } else {
          processNotificationData(data);
        }
      });
      CapApp.addListener("appUrlOpen", Util.onAppUrlOpen);
    }

    Filesystem.mkdir({
      path: CACHE_IMAGE,
      directory: Directory.Cache,
    }).catch((_) => { });

    //Checking for flexible update in play-store
    Util.startFlexibleUpdate();

    //Listen to network change
    Util.listenToNetwork();
    fetchData();

    Util.notificationListener(async (extraData: ExtraData | undefined) => {
      if (extraData) {
        Util.navigateTabByNotificationData(extraData);
      }
    });
    updateAvatarSuggestionJson();
    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearExistingTimeout();
    };
  }, []);

  const initializeUsage = () => {
    const currentDate = new Date().toISOString().split("T")[0];
    const lastAccessDate = localStorage.getItem(LAST_ACCESS_DATE_KEY);

    if (!lastAccessDate || lastAccessDate !== currentDate) {
      // First-time use or a new day
      localStorage.setItem(USED_TIME_KEY, "0"); // Reset used time
      localStorage.setItem(START_TIME_KEY, Date.now().toString()); // Reset start time
      localStorage.setItem(LAST_ACCESS_DATE_KEY, currentDate); // Update the last access date
    }

    if (!localStorage.getItem(IS_INITIALIZED)) {
      localStorage.setItem(START_TIME_KEY, Date.now().toString());
      localStorage.setItem(IS_INITIALIZED, "true");
    }
  };

  // Function to calculate the used time and store it
  const calculateUsedTime = () => {
    const currentTime = Date.now();
    const startTime = Number(
      localStorage.getItem(START_TIME_KEY) || currentTime
    ); // Use current time if startTime is missing
    const usedTime = Number(localStorage.getItem(USED_TIME_KEY));
    const sessionTime = (currentTime - startTime) / 1000;
    const usedTimeInMinutes = usedTime / 60;

    return usedTime + sessionTime;
  };

  const saveUsedTime = () => {
    const totalUsedTime = calculateUsedTime();
    localStorage.setItem(USED_TIME_KEY, totalUsedTime.toString());
  };

  const startTimeout = () => {
    clearExistingTimeout();
    const usedTime = Number(localStorage.getItem(USED_TIME_KEY) || 0);
    const remainingTime = Util.TIME_LIMIT - usedTime;
    if (remainingTime > 0) {
      timeoutId = setTimeout(() => {
        checkTimeExceeded();
      }, remainingTime * 1000);
    }
  };

  const clearExistingTimeout = () => {
    clearTimeout(timeoutId);
  };
  const checkTimeExceeded = async () => {
    if (Capacitor.isNativePlatform()) {
      const currMode = await schoolUtil.getCurrMode();
      if (currMode === MODES.PARENT) {
        const today = new Date().toISOString().split("T")[0];
        const lastModalShownDate = localStorage.getItem(LAST_MODAL_SHOWN_KEY);

        if (lastModalShownDate !== today) {
          setShowModal(true);
          const event = new CustomEvent("shouldShowModal", { detail: true });
          window.dispatchEvent(event);
          localStorage.setItem(LAST_MODAL_SHOWN_KEY, today);
        }
      }
    }
  };

  // Function to handle visibility change (when app goes into background or foreground)
  const handleVisibilityChange = () => {
    const currentTime = Date.now();
    if (document.visibilityState === "visible") {
      if (!localStorage.getItem(START_TIME_KEY)) {
        localStorage.setItem(START_TIME_KEY, currentTime.toString());
      }
      startTimeout();
    } else {
      saveUsedTime();
      localStorage.removeItem(START_TIME_KEY);
      clearExistingTimeout();
    }
  };

  // useEffect(() => {
  //   initializeUsage();
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   startTimeout();
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     clearExistingTimeout();
  //   };
  // }, []);

  const handleContinue = () => {
    setShowModal(false);
    setShowToast(true);
    setStartTime(Date.now());
    localStorage.setItem(START_TIME_KEY, Date.now().toString());
  };
  const processNotificationData = async (data) => {
    Util.navigateTabByNotificationData(data);
  };
  const getNotificationData = async () => {
    if (Capacitor.isNativePlatform()) {
      if (!Util.port) Util.port = registerPlugin<PortPlugin>("Port");
      if (Util.port && typeof Util.port.fetchNotificationData === "function") {
        try {
          const data = await Util.port.fetchNotificationData();
          if (data) {
            processNotificationData(data);
          }
        } catch (error) {
          console.error("Error retrieving notification data:", error);
        }
      } else {
        console.warn("Util.port or fetchNotificationData is not available.");
      }
    }
  };
  const fetchData = async () => {
    await getNotificationData();
  };

  async function updateAvatarSuggestionJson() {
    // Update Avatar Suggestion local Json
    try {
      //Initialize firebase remote config
      // await FirebaseRemoteConfig.fetchAndActivate();
      // const CAN_UPDATE_AVATAR_SUGGESTION_JSON = await RemoteConfig.getString(
      //   REMOTE_CONFIG_KEYS.CAN_UPDATED_AVATAR_SUGGESTION_URL
      // );
      // Util.migrateLocalJsonFile(
      //   // "assets/animation/avatarSugguestions.json",
      //   CAN_UPDATE_AVATAR_SUGGESTION_JSON,
      //   "assets/animation/avatarSugguestions.json",
      //   "assets/avatarSugguestions.json",
      //   "avatarSuggestionJsonLocation"
      // );
      // // localStorage.setItem(AvatarObj._i.suggestionConstant(), "0");
    } catch (error) {
      console.error("Util.migrateLocalJsonFile failed ", error);
    }
  }
  return (
    <IonApp>
      <IonReactRouter basename={BASE_NAME}>
        <IonRouterOutlet>
          <Switch>
            <Route path={PAGES.APP_UPDATE} exact={true}>
              <HotUpdate />
            </Route>
            <Route path={PAGES.RESET_PASSWORD} exact={true}>
              <ResetPassword />
            </Route>
            <ProtectedRoute path={PAGES.HOME} exact={true}>
              <Home />
            </ProtectedRoute>
            <Route path={PAGES.LOGIN} exact={true}>
              <Login />
            </Route>
            <ProtectedRoute path={PAGES.GAME} exact={true}>
              <CocosGame />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LIDO_PLAYER} exact={true}>
              <LidoPlayer />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.END} exact={true}>
              <End />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.PROFILE} exact={true}>
              <Profile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.PARENT} exact={true}>
              <Parent />
            </ProtectedRoute>
            <Route path={PAGES.APP_LANG_SELECTION} exact={true}>
              <AppLangSelection />
            </Route>
            <ProtectedRoute path={PAGES.CREATE_STUDENT} exact={true}>
              <EditStudent />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.EDIT_STUDENT} exact={true}>
              <EditStudent />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DISPLAY_STUDENT} exact={true}>
              <DisplayStudents />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DISPLAY_SUBJECTS} exact={true}>
              <DisplaySubjects />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_SUBJECTS} exact={true}>
              <AddCourses />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DISPLAY_CHAPTERS} exact={true}>
              <DisplayChapters />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.STUDENT_PROGRESS} exact={true}>
              <StudentProgress />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SEARCH} exact={true}>
              <SearchLesson />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LEADERBOARD} exact={true}>
              <Leaderboard />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ASSIGNMENT} exact={true}>
              <Home />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LIVE_QUIZ} exact={true}>
              <Home />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.JOIN_CLASS} exact={true}>
              <Home />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SELECT_MODE} exact={true}>
              <SelectMode />
            </ProtectedRoute>
            {/* <ProtectedRoute path={PAGES.TEACHER_PROFILE} exact={true}>
              <TeacherProfile />
            </ProtectedRoute> */}
            <ProtectedRoute path={PAGES.STUDENT_PROFILE} exact={true}>
              <StudentProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_STUDENT} exact={true}>
              <AddStudent />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.USER_PROFILE} exact={true}>
              <UserProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SUBJECTS_PAGE} exact={true}>
              <SubjectSelection />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LIVE_QUIZ_JOIN} exact={true}>
              <LiveQuizRoom />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LIVE_QUIZ_GAME} exact={true}>
              <LiveQuizGame />
            </ProtectedRoute>
            <Route path={PAGES.TERMS_AND_CONDITIONS} exact={true}>
              <TermsAndConditions />
            </Route>
            <ProtectedRoute path={PAGES.LIVE_QUIZ_ROOM_RESULT} exact={true}>
              <LiveQuizRoomResult />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.LIVE_QUIZ_LEADERBOARD} exact={true}>
              <LiveQuizLeaderBoard />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DISPLAY_SCHOOLS} exact={true}>
              <DisplaySchools />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.STUDENT_REPORT} exact={true}>
              <StudentReport />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DISPLAY_CLASSES} exact={true}>
              <DisplayClasses />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.MANAGE_SCHOOL} exact={true}>
              <ManageSchools />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SCHOOL_PROFILE} exact={true}>
              <SchoolProfile />
            </ProtectedRoute>
            {/* <ProtectedRoute path={PAGES.ADD_SCHOOL} exact={true}>
              
                <EditSchool />
              
            </ProtectedRoute> */}
            <ProtectedRoute path={PAGES.REQ_ADD_SCHOOL} exact={true}>
              <ReqEditSchool />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.MANAGE_CLASS} exact={true}>
              <ManageClass />
            </ProtectedRoute>
            {/* <ProtectedRoute path={PAGES.EDIT_SCHOOL} exact={true}>
              
                <EditSchool />
              
            </ProtectedRoute> */}
            <ProtectedRoute path={PAGES.REQ_EDIT_SCHOOL} exact={true}>
              <ReqEditSchool />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DASHBOARD_DETAILS} exact={true}>
              <DashBoardDetails />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_CLASS} exact={true}>
              <EditClass />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.CLASS_PROFILE} exact={true}>
              <ClassProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SHOW_CHAPTERS} exact={true}>
              <ShowChapters />
            </ProtectedRoute>

            <ProtectedRoute path={PAGES.SEARCH_LESSON} exact={true}>
              <SearchLessons />
            </ProtectedRoute>

            <ProtectedRoute path={PAGES.LESSON_DETAILS} exact={true}>
              <LessonDetails />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.HOME_PAGE} exact={true}>
              <HomePage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.CLASS_USERS} exact={true}>
              <ClassUsers />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.EDIT_CLASS} exact={true}>
              <EditClass />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SCHOOL_LIST} exact={true}>
              <SchoolList />
            </ProtectedRoute>
            <ProtectedRoute
              path={PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE}
              exact={true}
            >
              <ShowStudentsInAssignmentPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_TEACHER} exact={true}>
              <AddTeacher />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.TEACHER_PROFILE} exact={true}>
              <TeacherProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SCHOOL_USERS} exact={true}>
              <SchoolUsers />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_PRINCIPAL} exact={true}>
              <AddSchoolUser />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_COORDINATOR} exact={true}>
              <AddSchoolUser />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_SPONSOR} exact={true}>
              <AddSchoolUser />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.UPLOAD_PAGE} exact={true}>
              <UploadPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.PROGRAM_PAGE} exact={true}>
              <ProgramsPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.PROGRAM_DETAIL_PAGE} exact={true}>
              <ProgramDetailPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SIDEBAR_PAGE}>
              <SidebarPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.NEW_PROGRAM} exact={true}>
              <NewProgram />
            </ProtectedRoute>
          </Switch>
        </IonRouterOutlet>
        <IonAlert
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          header={t("Time for a break!") || ""}
          message={
            t(
              "You’ve used Chimple for 25 minutes today. Take a break to rest your eyes!"
            ) || ""
          }
          cssClass="custom-alert"
          buttons={[
            {
              text: t("Continue"),
              role: "cancel",
              cssClass: "time-exceed-continue",
              handler: handleContinue,
            },
          ]}
          backdropDismiss={false}
        />
        {/*Toast notification for acknowledgment */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="You have resumed after exceeding the time limit."
          duration={3000}
        />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
