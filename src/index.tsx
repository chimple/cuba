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
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
import { FirebaseCrashlytics } from "@capacitor-firebase/crashlytics";
import { SqliteApi } from "./services/api/SqliteApi";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { IonLoading } from "@ionic/react";
import { SplashScreen } from "@capacitor/splash-screen";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";
import { defineCustomElements, JSX as LocalJSX } from "lido-standalone/loader";
import {
  SpeechSynthesis,
  SpeechSynthesisUtterance,
} from "./utility/WindowsSpeech";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import { Util } from "./utility/util";
import { CAN_HOT_UPDATE, CURRENT_USER, EVENTS, IS_OPS_USER } from "./common/constants";
import { GbProvider } from "./growthbook/Growthbook";
import { initializeFireBase } from "./services/Firebase";
import * as Sentry from "@sentry/capacitor";
import * as SentryReact from "@sentry/react";

Sentry.init(
  {
    dsn: process.env.REACT_APP_SENTRY_DSN,

    sendDefaultPii: true,
    // enableLogs: true,
    // // Logs requires @sentry/capacitor 2.0.0 or newer.
    // _experiments: {
    //   enableLogs: true,
    //   beforeSendLog: (log) => {
    //     return log;
    //   },
    // },

    integrations: [
      Sentry.browserTracingIntegration(),

      // send console.log, console.warn, and console.error calls as logs to Sentry
      // SentryReact.consoleLoggingIntegration({
      //   levels: ["log", "warn", "error"],
      // }),
    ],
  },
  // Forward the init method from @sentry/react
  SentryReact.init
);
let userId: string = "anonymous";
try {
  const data = localStorage.getItem(CURRENT_USER);
  if (data) {
    const userData = JSON.parse(data);
    userId = userData?.user?.id ?? userData?.id ?? "anonymous";
  }
} catch (error) {
  console.error("Error retrieving user ID for Sentry:", error);
}
if (userId) Sentry.setUser({ id: userId });

if (Capacitor.isNativePlatform()) {
   LiveUpdate.ready().catch(console.error);
}

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
SplashScreen.hide();
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
  recordExecption(message.toString(), error.toString());
};
const container = document.getElementById("root");
const root = createRoot(container!, {
  onUncaughtError: SentryReact.reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),
  onCaughtError: SentryReact.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: SentryReact.reactErrorHandler(),
});
await SocialLogin.initialize({
  google: {
    webClientId: process.env.REACT_APP_CLIENT_ID,
  },
});

const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: process.env.REACT_APP_GROWTHBOOK_ID,
  enableDevMode: true,
  trackingCallback: async (experiment, result) => {
    try {
      const data = localStorage.getItem(CURRENT_USER);
      let userId: string = "anonymous";
      if (data) {
        const userData = JSON.parse(data);
        userId = userData?.user?.id ?? userData?.id ?? "anonymous";
      }
      await Util.logEvent(EVENTS.EXPERIMENT_VIEWED, {
        user_id: userId,
        experiment_id: experiment.key,
        variation_id: result.key,
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

async function checkForUpdate() {
  let majorVersion = "0";
  try {
    if (Capacitor.isNativePlatform() && gb.isOn(CAN_HOT_UPDATE)) {
      const { versionName } = await LiveUpdate.getVersionName();
      majorVersion = versionName.split(".")[0];
      const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle();
      const result = await LiveUpdate.fetchLatestBundle({ channel: `${process.env.REACT_APP_ENV}-${majorVersion}` });
      if (result.bundleId && currentBundleId !== result.bundleId) {
        console.log("🚀 LiveUpdate fetch latest bundle result", result);
        Util.logEvent(EVENTS.LIVE_UPDATE_STARTED, {
          user_id: userId,
          current_bundle_id: currentBundleId,
          new_bundle_id: result.bundleId,
          timestamp: new Date().toISOString(),
          channel_name: `${process.env.REACT_APP_ENV}-${majorVersion}`,
          app_version: versionName,
          update_type: result.artifactType,
        });
        const start = performance.now();
        await LiveUpdate.sync({channel: `${process.env.REACT_APP_ENV}-${majorVersion}`});
        const totalEnd = performance.now();
        Util.logEvent(EVENTS.LIVE_UPDATE_APPLIED, {
          user_id: userId,
          previous_bundle_id: currentBundleId,
          new_bundle_id: result.bundleId,
          timestamp: new Date().toISOString(),
          time_taken_ms: (totalEnd - start).toFixed(2),
          channel_name: `${process.env.REACT_APP_ENV}-${majorVersion}`,
          app_version: versionName,
          update_type: result.artifactType,
        });
        console.log(`🚀 LiveUpdate: Update applied successfully to bundle ${ result.bundleId}`);
        console.log(`⏱️ Total time taken to download and set nextBundle ID: ${( totalEnd - start ).toFixed(2)} ms`);;
      } else {
        console.log("🚀 LiveUpdate: No new update available, Current applied bundleID: ", currentBundleId);
      }
    }
  } catch (err) {
    console.error("LiveUpdate failed❌", err);
    Util.logEvent(EVENTS.LIVE_UPDATE_ERROR, {
      user_id: userId,
      timestamp: new Date().toISOString(),
      channel_name: `${process.env.REACT_APP_ENV}-${majorVersion}`,
      error: JSON.stringify(err),
    });
  } 
}

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
  setTimeout(() => {
      checkForUpdate();
  }, 500);
} else {
  SplashScreen.hide();
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
    setTimeout(() => {
      checkForUpdate();
    }, 500);
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
