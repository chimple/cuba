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
import { defineCustomElements, JSX as LocalJSX } from "lido-standalone/loader";
import {
  SpeechSynthesis,
  SpeechSynthesisUtterance,
} from "./utility/WindowsSpeech";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import { Util } from "./utility/util";
import { EVENTS, IS_OPS_USER } from "./common/constants";
import { GbProvider } from "./growthbook/Growthbook";

// Extend React's JSX namespace to include Stencil components
declare global {
  namespace JSX {
    interface IntrinsicElements extends LocalJSX.IntrinsicElements {}
  }
}
defineCustomElements(window);

// Conditionally attach only if the native APIs are missing (optional)
if (typeof window !== "undefined") {
  if (!(window as any).speechSynthesis) {
    (window as any).speechSynthesis = new SpeechSynthesis();
  }
  if (!(window as any).SpeechSynthesisUtterance) {
    (window as any).SpeechSynthesisUtterance = SpeechSynthesisUtterance;
  }
}

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

const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: process.env.REACT_APP_GROWTHBOOK_ID,
  enableDevMode: true,
  trackingCallback: (experiment, result) => {
    Util.logEvent(EVENTS.EXPERIMENT_VIEWED, {
      experimentId: experiment.key,
      variationId: result.key,
    });
  },
 });
 gb.init({
  streaming: true,
 });

// Default to Supabase
const serviceInstance = ServiceConfig.getInstance(APIMode.SUPABASE);
const authHandler = ServiceConfig.getI()?.authHandler;
const isUserLoggedIn = await authHandler?.isUserLoggedIn();
// Check role
const isOpsUser = localStorage.getItem(IS_OPS_USER) === 'true';

if (!isOpsUser && isUserLoggedIn) {
  // Initialize SQLite only if needed
  SplashScreen.show();
  await SqliteApi.getInstance();
  serviceInstance.switchMode(APIMode.SQLITE);
  SplashScreen.hide();
}

root.render(
  <GrowthBookProvider growthbook={gb}>
    <GbProvider>
      <App />
    </GbProvider>
  </GrowthBookProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
