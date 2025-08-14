/*
 * Copyright (C) 2015 Chimple
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
import { initializeFireBase } from "./services/Firebase";
import { APIMode, ServiceConfig } from "./services/ServiceConfig";
import { Util } from "./utility/util";
import React from "react";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <>
    <App />
  </>
);
initializeFireBase();
ServiceConfig.getInstance(APIMode.FIREBASE);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();