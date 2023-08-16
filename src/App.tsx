import { Route, Switch } from "react-router-dom";
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
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import { App as CapApp } from "@capacitor/app";
import {
  // APP_LANG,
  BASE_NAME,
  CACHE_IMAGE,
  GAME_URL,
  IS_CUBA,
  PAGES,
} from "./common/constants";
import { Util } from "./utility/util";
import Parent from "./pages/Parent";
import EditStudent from "./pages/EditStudent";
import DisplayStudents from "./pages/DisplayStudents";
// import Assignments from "./pages/Assignments";
// import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import DisplaySubjects from "./pages/DisplaySubjects";
import AppLangSelection from "./pages/AppLangSelection";
import StudentProgress from "./pages/StudentProgress";
import SearchLesson from "./pages/SearchLesson";
import Leaderboard from "./pages/Leaderboard";
import AssignmentPage from "./pages/Assignment";
import SelectMode from "./pages/SelectMode";
import { FirebaseRemoteConfig } from "@capacitor-firebase/remote-config";
import HotUpdate from "./pages/HotUpdate";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    console.log("fetching...");
    // localStorage.setItem(LANGUAGE, LANG.ENGLISH);
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
      CapApp.addListener("appStateChange", Util.onAppStateChange);
      // Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
    }

    Filesystem.mkdir({
      path: CACHE_IMAGE,
      directory: Directory.Cache,
    }).catch((_) => {});

    //Checking for flexible update in play-store
    Util.startFlexibleUpdate();

    //Checking for Notification permissions
    Util.checkNotificationPermissions();

    //Listen to network change
    Util.listenToNetwork();

    //Initialize firebase remote config
    FirebaseRemoteConfig.fetchAndActivate();
  }, []);

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
              <AssignmentPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.JOIN_CLASS} exact={true}>
              <AssignmentPage />
            </ProtectedRoute>
            <ProtectedRoute path={PAGES.SELECT_MODE} exact={true}>
              <SelectMode />
            </ProtectedRoute>
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
