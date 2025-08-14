/*
 * Copyright (C) 2007 Chimple Learning
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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
// @ts-ignore
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { IonLoading } from "@ionic/react";
import { SplashScreen } from "@capacitor/splash-screen";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter } from "react-router-dom";
import { defineCustomElements, JSX as LocalJSX } from "lido-standalone/loader";
import {
  SpeechSynthesis,
  SpeechSynthesisUtterance,
} from "./utility/WindowsSpeech";
import { Util } from "./utility/util";
import { initializeFireBase } from "./services/Firebase";

console.log("Index.tsx called ");

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

// Util.isRespectMode = await Util.checkRespectApp();
// Util.isRespectMode = false;
console.log(
  "Util.isRespectMode = await Util.checkRespectApp();",
  Util.isRespectMode
);

// if(!Util.isRespectMode){

// }
if (!Util.isRespectMode) {
  SqliteApi.getInstance().then(() => {
    ServiceConfig.getInstance(APIMode.SQLITE);
    root.render(
      <>
        <App />
      </>
    );
    initializeFireBase();
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
} else {
  ServiceConfig.getInstance(APIMode.ONEROSTER);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
