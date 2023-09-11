import { IonButton, IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { LANGUAGE, LANG, PAGES } from "../common/constants";
import React from "react";
import Loading from "../components/Loading";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import i18n from "../i18n";
import { changeLanguage, t } from "i18next";
import { chevronForward } from "ionicons/icons";
import { ServiceConfig } from "../services/ServiceConfig";
import NextButton from "../components/common/NextButton";
//import Parent from "./Parent";

// import { Platform } from "react-native";

const AppLangSelection: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [langList, setLangList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  useEffect(() => {
    getLangList();
  }, []);
  async function getLangList() {
    let tempLangList: {
      id: string;
      displayName: string;
    }[] = [];
    const languages = await ServiceConfig.getI().apiHandler.getAllLanguages();
    languages.forEach((element) => {
      tempLangList.push({
        id: element.code,
        displayName: element.title,
      });
    });
    setIsLoading(true);
    setLangList(tempLangList);
    setIsLoading(false);
  }

  // const currentAppLang = localStorage.getItem(APP_LANG) || LANG.ENGLISH;

  return (
    <IonPage id="app-lang">
      {!isLoading ? (
        <div>
          <div id="App-lang-nextButton">
            <NextButton
              disabled={false}
              onClicked={async () => {
                history.replace(PAGES.LOGIN);
                const appLang = localStorage.getItem(LANGUAGE);
                if (!appLang) {
                  const tempLangCode = LANG.ENGLISH;
                  localStorage.setItem(LANGUAGE, tempLangCode);
                  await i18n.changeLanguage(tempLangCode);
                }
              }}
            />
          </div>

          <div>
            <img
              id="app-lang-chimple-logo"
              alt="Chimple Brand Logo"
              // src="assets/Monk.gif"
              src="assets/icons/ChimpleBrandLogo.svg"
            />
          </div>

          <div id="app-lang-element">
            <p id="app-lang-text">{t("Choose your language")}</p>
            <RectangularOutlineDropDown
              placeholder=""
              optionList={langList}
              currentValue={currentAppLang || langList[0]?.id}
              width="26vw"
              onValueChange={async (selectedLang) => {
                console.log("selected Langauage", selectedLang);
                const tempLangCode = selectedLang;
                console.log("tempLangCode", tempLangCode, langList);
                if (!tempLangCode) return;
                localStorage.setItem(LANGUAGE, tempLangCode);
                setCurrentAppLang(tempLangCode);
                console.log("this is the selected lang" + tempLangCode);
                await i18n.changeLanguage(tempLangCode);
                // history.replace(PAGES.LOGIN);
              }}
            ></RectangularOutlineDropDown>
          </div>
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
      {/* </IonInfiniteScrollContent> */}
      {/* </IonInfiniteScroll> */}
    </IonPage>
  );
};

export default AppLangSelection;
