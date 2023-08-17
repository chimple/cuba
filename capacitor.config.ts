import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.chimple.bahama",
  appName: "Chimple",
  webDir: "build",
  bundledWebRuntime: false,
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
  },
};

export default config;
