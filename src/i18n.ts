import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import { BASE_NAME } from "./common/constants";

i18n
  .use(Backend)
  .use(I18nextBrowserLanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: "en",
    debug: false,
    backend: {
      loadPath: BASE_NAME + "/locales/{{lng}}/{{ns}}.json",
    },

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
