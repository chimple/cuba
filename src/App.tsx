import { Route, Switch } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import ViewMessage from "./pages/ViewMessage";

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
import Slider from "./pages/Slider";
import CocosGame from "./pages/CocosGame";
import { End } from "./pages/End";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
// import Assignments from "./pages/Assignments";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    console.log("fetching...");
    if (Capacitor.isNativePlatform()) {
      Filesystem.getUri({
        directory: Directory.Data,
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
            localStorage.setItem("gameUrl", uri + "/");
          }
        });
    }
  }, []);
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            <Route path="/" exact={true}>
              <Login />
              {/* <Redirect to={"/slider"} /> */}
            </Route>
            <Route path="/Home" exact={true}>
              <Home />
            </Route>
            <Route path="/slider" exact={true}>
              <Slider />
            </Route>
            <Route path="/game" exact={true}>
              <CocosGame />
            </Route>
            <Route path="/end" exact={true}>
              <End />
            </Route>
            <Route path="/profile" exact={true}>
              <Profile />
            </Route>
            {/* <Route path="/assignments" exact={true}>
            <Assignments />
          </Route> */}
            <Route path="/message/:id">
              <ViewMessage />
            </Route>
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
