module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // ignore node-only worker in lido-standalone
    },
  },
  jest: {
    configure: {
      testEnvironment: "jsdom",

      setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

      testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],

      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,

      watch: false,
      watchman: false,
      bail: 1,

      moduleNameMapper: {
        "^@ionic/react$": "<rootDir>/src/tests/__mocks__/@ionic/react.tsx",
        "^@ionic/react-router$":
          "<rootDir>/src/tests/__mocks__/@ionic/react-router.tsx",

        "^@algolia/autocomplete-theme-classic$":
          "<rootDir>/src/tests/__mocks__/@algolia/autocomplete-theme-classic.ts",

        "^@capacitor/app$": "<rootDir>/src/tests/__mocks__/@capacitor/app.ts",
        "^@capacitor/core$": "<rootDir>/src/tests/__mocks__/@capacitor/core.ts",
        "^@capacitor/filesystem$":
          "<rootDir>/src/tests/__mocks__/@capacitor/filesystem.ts",
        "^@capacitor/local-notifications$":
          "<rootDir>/src/tests/__mocks__/@capacitor/local-notifications.ts",
        "^@capacitor/keyboard$":
          "<rootDir>/src/tests/__mocks__/@capacitor/keyboard.ts",
        "^@capacitor/preferences$":
          "<rootDir>/src/tests/__mocks__/@capacitor/preferences.ts",
        "^@capacitor/haptics$":
          "<rootDir>/src/tests/__mocks__/@capacitor/haptics.ts",
        "^@capacitor/device$":
          "<rootDir>/src/tests/__mocks__/@capacitor/device.ts",
        "^@capacitor/geolocation$":
          "<rootDir>/src/tests/__mocks__/@capacitor/geolocation.ts",
        "^@capacitor/screen-orientation$":
          "<rootDir>/src/tests/__mocks__/@capacitor/screen-orientation.ts",
        "^@capacitor/splash-screen$":
          "<rootDir>/src/tests/__mocks__/@capacitor/splash-screen.ts",
        "^@capacitor/status-bar$":
          "<rootDir>/src/tests/__mocks__/@capacitor/status-bar.ts",
        "^@capacitor/toast$":
          "<rootDir>/src/tests/__mocks__/@capacitor/toast.ts",
        "^@capacitor/browser$":
          "<rootDir>/src/tests/__mocks__/@capacitor/browser.ts",
        "^@capacitor/barcode-scanner$":
          "<rootDir>/src/tests/__mocks__/@capacitor/barcode-scanner.ts",

        "^@capacitor-community/firebase-analytics$":
          "<rootDir>/src/tests/__mocks__/@capacitor-community/firebase-analytics.ts",
        "^@capacitor-community/sqlite$":
          "<rootDir>/src/tests/__mocks__/@capacitor-community/sqlite.ts",
        "^@capacitor-community/text-to-speech$":
          "<rootDir>/src/tests/__mocks__/@capacitor-community/text-to-speech.ts",
        "^@capacitor-community/in-app-review$":
          "<rootDir>/src/tests/__mocks__/@capacitor-community/in-app-review.ts",
        "^@capacitor-community/http$":
          "<rootDir>/src/tests/__mocks__/@capacitor-community/http.ts",

        "^@capacitor-firebase/authentication$":
          "<rootDir>/src/tests/__mocks__/@capacitor-firebase/authentication.ts",
        "^@capacitor-firebase/crashlytics$":
          "<rootDir>/src/tests/__mocks__/@capacitor-firebase/crashlytics.ts",
        "^@capacitor-firebase/messaging$":
          "<rootDir>/src/tests/__mocks__/@capacitor-firebase/messaging.ts",
        "^@capacitor-firebase/remote-config$":
          "<rootDir>/src/tests/__mocks__/@capacitor-firebase/remote-config.ts",

        "^@capawesome/capacitor-app-update$":
          "<rootDir>/src/tests/__mocks__/@capawesome/capacitor-app-update.ts",
        "^@capawesome/capacitor-live-update$":
          "<rootDir>/src/tests/__mocks__/@capawesome/capacitor-live-update.ts",

        "^@capgo/capacitor-social-login$":
          "<rootDir>/src/tests/__mocks__/@capgo/capacitor-social-login.ts",

        "^@chimple/palau-recommendation$":
          "<rootDir>/src/tests/__mocks__/@chimple/palau-recommendation.ts",

        "^@growthbook/growthbook-react$":
          "<rootDir>/src/tests/__mocks__/@growthbook/growthbook-react.ts",

        "^@splidejs/react-splide/css/core$":
          "<rootDir>/src/tests/__mocks__/@splidejs/react-splide/css/core.ts",
        "^@splidejs/react-splide/css$":
          "<rootDir>/src/tests/__mocks__/@splidejs/react-splide/css.ts",
        "^react-leaflet$": "<rootDir>/src/tests/__mocks__/react-leaflet.tsx",
        "^leaflet$": "<rootDir>/src/tests/__mocks__/leaflet.ts",

        "^query-string$": "<rootDir>/src/tests/__mocks__/query-string.ts",
        "^uuid$": "<rootDir>/src/tests/__mocks__/uuid.ts",
        "^@ffmpeg/ffmpeg$":
          "<rootDir>/src/tests/__mocks__/@ffmpeg/ffmpeg.ts",
        "^@ffmpeg/util$": "<rootDir>/src/tests/__mocks__/@ffmpeg/util.ts",
        "^@/(.*)$": "<rootDir>/src/$1",
        ".+\\.(css|styl|less|sass|scss|gif|png|jpg|jpeg|svg|webp|ttf|woff|woff2)$":
          "identity-obj-proxy",
        "\\.(ttf|woff|woff2|wasm)$":
          "<rootDir>/src/tests/__mocks__/fileMock.ts",
      },

      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
      },

      transformIgnorePatterns: [
        "node_modules/(?!(\
          @ionic|\
          @capacitor|\
          @capacitor-community|\
          @capacitor-firebase|\
          @capawesome|\
          @capgo|\
          @stencil|\
          ionicons|\
          @splidejs|\
          @algolia\
        )/)",
      ],

      testPathIgnorePatterns: [
        "/node_modules/",
        "/android/",
        "/build/",
        "/storybook-static/",
      ],
      collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/index.tsx",
        "!src/serviceWorker.ts",
        "!src/**/__mocks__/**",
        "!src/stories/**",
        "!src/common/constants.ts",
        "!src/common/courseConstants.ts",
      ],

      coverageDirectory: "<rootDir>/coverage",

      coverageReporters: ["text", "lcov", "json-summary"],

      coverageThreshold: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0,
        },
      },
    },
  },
};