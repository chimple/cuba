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
import { lazy, Suspense, useEffect, useState } from "react";
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
import {
  HomePage,
  TestPage1,
  TestPage2,
  DisplaySchools,
  ShowChapters,
  SearchLessons,
  AddStudent,
  UserProfile,
  ClassUsers,
  StudentProfile,
  ManageSchools,
  SchoolProfile,
  AddSchool,
  ManageClass,
  EditSchool,
  SubjectSelection,
  EditClass,
  ClassProfile,
  DashBoardDetails,
  AddTeacher,
  TeacherProfile,
} from "./common/chimplePrivatePages";
import LessonDetails from "./chimple-private/pages/LessonDetails";
import DisplayClasses from "./chimple-private/pages/DisplayClasses";
import "./App.css";

setupIonicReact();
interface ExtraData {
  notificationType?: string;
  rewardProfileId?: string;
}
interface WindowEventMap {
  shouldShowModal: CustomEvent<boolean>; 
}
const TIME_LIMIT = 1500; // 25 * 60
const LAST_MODAL_SHOWN_KEY = "lastTimeExceededShown";
const App: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeExceeded, setTimeExceeded] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  useEffect(() => {
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
    };
  }, [online, presentToast]);
  useEffect(() => {
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(false));
    localStorage.setItem(DOWNLOADING_CHAPTER_ID, JSON.stringify(false));
    console.log("fetching...");
    CapApp.addListener("appStateChange", Util.onAppStateChange);
    localStorage.setItem(IS_CUBA, "1");
    if (Capacitor.isNativePlatform()) {
      Filesystem.getUri({
        directory: Directory.External,
        path: "",
      })
        .catch((ca) => {
          console.log("path error", ca);
        })
        .then((path) => {
          console.log("path ", path, "uri", path?.uri);

          if (path instanceof Object) {
            const uri = Capacitor.convertFileSrc(path.uri); // file:///data/user/0/org.chimple.bahama/cache
            console.log("uri", uri); //http://localhost/_capacitor_file_/data/user/0/org.chimple.bahama/cache
            localStorage.setItem(GAME_URL, uri + "/");
          }
        });
      //CapApp.addListener("appStateChange", Util.onAppStateChange);
      // Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });

      const portPlugin = registerPlugin<PortPlugin>("Port");
      portPlugin.addListener("notificationOpened", (data: any) => {
        if (data) {
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
      if (extraData && extraData.notificationType === "reward") {
        const currentStudent = Util.getCurrentStudent();
        const data = extraData as ExtraData;
        const rewardProfileId = data.rewardProfileId;
        if (rewardProfileId)
          if (currentStudent?.id === rewardProfileId) {
            window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME);
          } else {
            await Util.setCurrentStudent(null);
            const students =
              await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
            let matchingUser =
              students.find((user) => user.id === rewardProfileId) ||
              students[0];
            if (matchingUser) {
              await Util.setCurrentStudent(matchingUser, undefined, true);
              window.location.replace(
                PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME
              );
            } else {
              return;
            }
          }
      }
    });
    updateAvatarSuggestionJson();
  }, []);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (Capacitor.isNativePlatform()) {
      const lastShownDate = localStorage.getItem(Util.LAST_MODAL_SHOWN_KEY);
      const today = new Date().toISOString().split("T")[0];
      if (lastShownDate !== today) {
        CapApp.addListener("appStateChange", Util.handleAppStateChange);
        timeoutId = setTimeout(checkTimeExceeded, Util.TIME_LIMIT * 1000);
      }
      const handleShowModalEvent = (event: CustomEvent<boolean>) => {
        setShowModal(event.detail); 
      };
      window.addEventListener("shouldShowModal", handleShowModalEvent as EventListener);
      return () => {
        clearTimeout(timeoutId);
        CapApp.removeAllListeners();
        window.removeEventListener("shouldShowModal", handleShowModalEvent as EventListener);
      };
    }
  }, []);

  const checkTimeExceeded = () => {
    const currentTime = Date.now();
    const startTime = Number(localStorage.getItem("startTime") || "0");
    const timeElapsed = (currentTime - startTime) / 1000; 
    if (timeElapsed >= Util.TIME_LIMIT) {
      const lastShownDate = localStorage.getItem(Util.LAST_MODAL_SHOWN_KEY);
      const today = new Date().toISOString().split("T")[0];
      if (lastShownDate !== today) {
        const event = new CustomEvent("shouldShowModal", { detail: true });
        window.dispatchEvent(event);
        localStorage.setItem(Util.LAST_MODAL_SHOWN_KEY, today);
      }
    }
  };

  const handleContinue = () => {
    setShowModal(false);
    setShowToast(true);
    // Reset the timer
    setStartTime(Date.now());
  };
  const processNotificationData = async (data) => {
    const currentStudent = Util.getCurrentStudent();
    if (data && data.notificationType === "reward") {
      if (data.rewardProfileId) {
        if (currentStudent?.id === data.rewardProfileId) {
          window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME);
          return;
        } else {
          await Util.setCurrentStudent(null);
          const students =
            await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => user.id === data.rewardProfileId) ||
            students[0];
          if (matchingUser) {
            await Util.setCurrentStudent(matchingUser, undefined, true);
            window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME);
            return;
          } else {
            return;
          }
        }
      }
    }
  };
  const getNotificationData = async () => {
    if (!Util.port) Util.port = registerPlugin<PortPlugin>("Port");
    if (Util.port && typeof Util.port.fetchNotificationData === "function") {
      try {
        const data = await Util.port.fetchNotificationData();
        if (data && data.notificationType && data.rewardProfileId) {
          processNotificationData(data);
        }
      } catch (error) {
        console.error("Error retrieving notification data:", error);
      }
    } else {
      console.warn("Util.port or fetchNotificationData is not available.");
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
            <ProtectedRoute path={PAGES.HOME} exact={true}>
              <Home />
            </ProtectedRoute>
            <Route path={PAGES.LOGIN} exact={true}>
              <Login />
            </Route>
            <ProtectedRoute path={PAGES.GAME} exact={true}>
              <CocosGame />
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
              <Suspense>
                <StudentProfile />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_STUDENT} exact={true}>
              <Suspense>
                <AddStudent />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.USER_PROFILE} exact={true}>
              <Suspense>
                <UserProfile />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SUBJECTS_PAGE} exact={true}>
              <Suspense>
                <SubjectSelection />
              </Suspense>
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
            <Route path={PAGES.TEST_PAGE} exact={true}>
              <Suspense>
                <TestPage1 />
              </Suspense>
            </Route>
            <Route path={PAGES.DISPLAY_SCHOOLS} exact={true}>
              <Suspense>
                <DisplaySchools />
              </Suspense>
            </Route>
            <Route path={PAGES.DISPLAY_CLASSES} exact={true}>
              <Suspense>
                <DisplayClasses />
              </Suspense>
            </Route>
            <ProtectedRoute path={PAGES.MANAGE_SCHOOL} exact={true}>
              <Suspense>
                <ManageSchools />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SCHOOL_PROFILE} exact={true}>
              <Suspense>
                <SchoolProfile />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_SCHOOL} exact={true}>
              <Suspense>
                <EditSchool />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.MANAGE_CLASS} exact={true}>
              <Suspense>
                <ManageClass />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.EDIT_SCHOOL} exact={true}>
              <Suspense>
                <EditSchool />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.DASHBOARD_DETAILS} exact={true}>
              <Suspense>
                <DashBoardDetails />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_CLASS} exact={true}>
              <Suspense>
                <EditClass />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.CLASS_PROFILE} exact={true}>
              <Suspense>
                <ClassProfile />
              </Suspense>
            </ProtectedRoute>
            <Route path={PAGES.SHOW_CHAPTERS} exact={true}>
              <Suspense>
                <ShowChapters />
              </Suspense>
            </Route>

            <Route path={PAGES.SEARCH_LESSON} exact={true}>
              <Suspense>
                <SearchLessons />
              </Suspense>
            </Route>

            <Route path={PAGES.LESSON_DETAILS} exact={true}>
              <LessonDetails />
            </Route>
            <Route path={PAGES.TEST_PAGE1} exact={true}>
              <Suspense>
                <TestPage2 />
              </Suspense>
            </Route>
            <ProtectedRoute path={PAGES.HOME_PAGE} exact={true}>
              <Suspense>
                <HomePage />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.CLASS_USERS} exact={true}>
              <Suspense>
                <ClassUsers />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.EDIT_CLASS} exact={true}>
              <Suspense>
                <EditClass />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_TEACHER} exact={true}>
              <Suspense>
                <AddTeacher />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.TEACHER_PROFILE} exact={true}>
              <Suspense>
                <TeacherProfile />
              </Suspense>
            </ProtectedRoute>
          </Switch>
        </IonRouterOutlet>
        <IonAlert
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          header={t("Time for a break!") || ""}
          message={t(
            "You’ve used Chimple for 25 minutes today. Take a break to rest your eyes!"
          ) || ""}
          cssClass="custom-alert"
          buttons={[
            {
              text: t("Continue"),
              role: "cancel",
              cssClass: "time-exceed-continue",
              handler: handleContinue,
            },
          ]}
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