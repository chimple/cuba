import { createRoot } from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import "./index.css";
import "./i18n";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { CHIMPLE_BUNDLE_FOLDER } from "./common/constants";

const container = document.getElementById("root");
const root = createRoot(container!);

const getStoragePermissions = async () => {
  let isPermissionsGranted = false;
  try {
    if (!Capacitor.isNativePlatform()) return false;
    const permissions = await Filesystem.checkPermissions();
    console.log(
      "🚀 ~ file: index.tsx:19 ~ getStoragePermissions ~ permissions:",
      permissions.publicStorage
    );
    if (permissions.publicStorage !== "granted") {
      const reqPermissions = await Filesystem.requestPermissions();
      console.log(
        "🚀 ~ file: index.tsx:22 ~ getStoragePermissions ~ reqPermissions:",
        reqPermissions.publicStorage
      );
      isPermissionsGranted = reqPermissions.publicStorage === "granted";
      console.log(
        "🚀 ~ file: index.tsx:24 ~ getStoragePermissions ~ isPermissionsGranted:",
        isPermissionsGranted
      );
    } else {
      isPermissionsGranted = true;
      console.log(
        "🚀 ~ file: index.tsx:27 ~ getStoragePermissions ~ isPermissionsGranted:",
        isPermissionsGranted
      );
    }
  } catch (error) {
    console.log(
      "🚀 ~ file: index.tsx:26 ~ getStoragePermissions ~ error:",
      JSON.stringify(error)
    );
  }
  console.log(
    "🚀 ~ file: index.tsx:36 ~ getStoragePermissions ~ isPermissionsGranted before:",
    isPermissionsGranted
  );

  if (!isPermissionsGranted) return;
  console.log(
    "🚀 ~ file: index.tsx:36 ~ getStoragePermissions ~ isPermissionsGranted:",
    isPermissionsGranted
  );
  const path = await Filesystem.getUri({
    directory: Directory.ExternalStorage,
    path: "chimple",
  });
  const uri = Capacitor.convertFileSrc(path.uri);
  console.log("path uri", uri);
  localStorage.setItem(CHIMPLE_BUNDLE_FOLDER, uri + "/");
  const result = await fetch(uri + "/puzzle0000/index.js");
  console.log(
    "🚀 ~ file: index.tsx:71 ~ getStoragePermissions ~ result.ok:",
    result.ok
  );
  const file = await Filesystem.readFile({
    path: path.uri + "/puzzle0000/index.js",
  });
  console.log(
    "🚀 ~ file: index.tsx:67 ~ getStoragePermissions ~ file.data:",
    file.data
  );
};
getStoragePermissions();

root.render(
  <>
    <App />
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
