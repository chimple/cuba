import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.chimple.cuba",
  appName: "Chimple",
  webDir: "build",
  bundledWebRuntime: false,
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
};

export default config;
