import { createRoot } from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import "./index.css";
import "./i18n";
import { APIMode, ServiceConfig } from "./services/ServiceConfig";
import {
  defineCustomElements as jeepSqlite,
  applyPolyfills,
} from "jeep-sqlite/loader";
import { FirebaseCrashlytics } from "@capacitor-firebase/crashlytics";
import { SqliteApi } from "./services/api/SqliteApi";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { IonLoading } from "@ionic/react";
import { SplashScreen } from "@capacitor/splash-screen";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";

if (Capacitor.isNativePlatform()) {
  await ScreenOrientation.lock({ orientation: "landscape" });
}
applyPolyfills().then(() => {
  jeepSqlite(window);
});
const recordExecption = (message: string, error: string) => {
  if (Capacitor.getPlatform() != "web") {
    FirebaseCrashlytics.recordException({ message: message, domain: error });
  }
};
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  recordExecption(event.reason.toString(), event.type.toString());
};
window.onerror = (message, source, lineno, colno, error) => {
  recordExecption(message.toString, error.toString());
};
SplashScreen.hide();
const container = document.getElementById("root");
const root = createRoot(container!);
GoogleAuth.initialize({
  clientId: process.env.REACT_APP_CLIENT_ID,
  scopes: ["profile", "email"],
  // grantOfflineAccess: true,
});

SqliteApi.getInstance().then(() => {
  ServiceConfig.getInstance(APIMode.ONEROSTER);
  root.render(
    <>
      <App />
    </>
  );
});

root.render(
  <>
    <IonLoading
      message={`<img class="loading" src="assets/loading.gif"></img>`}
      isOpen={true}
      spinner={null}
    />
  </>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
