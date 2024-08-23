import { Route, Switch, useHistory } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
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
import TeacherProfile from "./pages/Malta/TeacherProfile";
import React from "react";
import StudentProfile from "./pages/Malta/StudentProfile";
import AddStudent from "./chimple-private/pages/AddStudent";
import Dashboard from "./pages/Malta/Dashboard";
import TeachersStudentDisplay from "./pages/Malta/TeachersStudentDisplay";
import {
  HomePage,
  TestPage1,
  TestPage2,
  DisplaySchools,
  ShowChapters,
  SearchLessons,
} from "./common/chimplePrivatePages";
import LessonDetails from "./chimple-private/pages/LessonDetails";

setupIonicReact();
interface ExtraData {
  notificationType?: string;
  rewardProfileId?: string;
}
const App: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
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
    }).catch((_) => {});

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
            <ProtectedRoute path={PAGES.TEACHER_PROFILE} exact={true}>
              <TeacherProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.STUDENT_PROFILE} exact={true}>
              <StudentProfile />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.ADD_STUDENT} exact={true}>
              <AddStudent />
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
            <Route path={PAGES.HOME_PAGE} exact={true}>
              <Suspense>
                <HomePage />
              </Suspense>
            </Route>
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
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
