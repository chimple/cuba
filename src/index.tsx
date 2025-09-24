/*
 * Copyright (C) 2015 Chimple
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
// import reportWebVitals from "./reportWebVitals";
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
import { CURRENT_USER, EVENTS, IS_OPS_USER } from "./common/constants";
import { GbProvider } from "./growthbook/Growthbook";
import { initializeFireBase } from "./services/Firebase";

// Extend React's JSX namespace to include Stencil components
declare global {
  namespace JSX {
    interface IntrinsicElements extends LocalJSX.IntrinsicElements {}
  }
}
defineCustomElements(window);

initializeFireBase();

// Conditionally attach only if the native APIs are missing (optional)
if (typeof window !== "undefined") {
  if (!(window as any).speechSynthesis) {
    (window as any).speechSynthesis = new SpeechSynthesis();
  }
  if (!(window as any).SpeechSynthesisUtterance) {
    (window as any).SpeechSynthesisUtterance = SpeechSynthesisUtterance;
  }
}
SplashScreen.show();
if (Capacitor.isNativePlatform()) {
  await ScreenOrientation.lock({ orientation: "landscape" });
}
jeepSqlite(window);

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
  trackingCallback: async (experiment, result) => {
    try {
      const userData = localStorage.getItem(CURRENT_USER);
      const userId = userData ? JSON.parse(userData).id : undefined;
      await Util.logEvent(EVENTS.EXPERIMENT_VIEWED, {
        user_id: userId,
        experimentId: experiment.key,
        variationId: result.key,
      });
    } catch (error) {
      console.error("Error in GrowthBook tracking callback:", error);
    }
  },
});
gb.init({
  streaming: true,
});
const isOpsUser = localStorage.getItem(IS_OPS_USER) === "true";
const serviceInstance = ServiceConfig.getInstance(APIMode.SQLITE);

if (isOpsUser) {
  serviceInstance.switchMode(APIMode.SUPABASE);

  root.render(
    <GrowthBookProvider growthbook={gb}>
      <GbProvider>
        <App />
      </GbProvider>
    </GrowthBookProvider>
  );

  SplashScreen.hide();
} else {
  SplashScreen.show();

  SqliteApi.getInstance().then(() => {
    serviceInstance.switchMode(APIMode.SQLITE);

    root.render(
      <GrowthBookProvider growthbook={gb}>
        <GbProvider>
          <App />
        </GbProvider>
      </GrowthBookProvider>
    );

    SplashScreen.hide();
  });
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
