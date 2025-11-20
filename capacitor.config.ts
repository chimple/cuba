import { CapacitorConfig } from "@capacitor/cli";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const config: CapacitorConfig = {
  appId: "org.chimple.bahama",
  appName: "Chimple",
  webDir: "build",
  // bundledWebRuntime: false,
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "phone"],
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      // resize: KeyboardResize.Body,
      // style: KeyboardStyle.Dark,
      // resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: "chimple_monkey_icon",
    },
    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: false,
    },
    LiveUpdate: {
      appId: process.env.REACT_APP_CAPACITOR_HOT_UPDATE_APP_ID,
      autoDeleteBundles: true,
      readyTimeout: 50000,
    }
  },
};

export default config;
