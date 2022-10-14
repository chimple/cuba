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
import { BASE_NAME, GAME_URL, LANG, LANGUAGE, PAGES } from "./common/constants";
// import Assignments from "./pages/Assignments";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    console.log("fetching...");
    localStorage.setItem(LANGUAGE, LANG.ENGLISH);
    if (Capacitor.isNativePlatform()) {
      Filesystem.getUri({
        directory: Directory.Cache,
        path: "",
      })
        .catch((ca) => {
          console.log("path error", ca);
        })
        .then((path) => {
          console.log("path ", path, "uri", path?.uri);

          if (path instanceof Object) {
            const uri = Capacitor.convertFileSrc(path.uri); // file:///data/user/0/org.chimple.cuba/files
            console.log("uri", uri); //http://localhost/_capacitor_file_/data/user/0/org.chimple.cuba/files
            localStorage.setItem(GAME_URL, uri + "/");
          }
        });
    }
  }, []);
  return (
    <IonApp>
      <IonReactRouter basename={BASE_NAME}>
        <IonRouterOutlet>
          <Switch>
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
            {/* <Route path="/assignments" exact={true}>
            <Assignments />
          </Route> */}
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
