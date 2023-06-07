import { IonButton, IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { APP_LANG, LANG, PAGES } from "../common/constants";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [langList, setLangList] = useState<{
    id: string;
    displayName: string;
  }[]>([]);
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  useEffect(() => {
    let tempLangList: {
      id: string;
      displayName: string;
    }[] = [];
    ServiceConfig.getI()
      .apiHandler.getAllLanguages()
      .then((l) => {
        l.forEach((element) => {
          tempLangList.push({
            id: element.code,
            displayName: element.title,
          });
        });
        setLangList(tempLangList);
      });
  }, []);

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
                const appLang = localStorage.getItem(APP_LANG);
                if (!appLang) {
                  const tempLangCode = LANG.ENGLISH;
                  localStorage.setItem(APP_LANG, tempLangCode);
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
            <p id="app-lang-text">{t("Select App Language")}</p>
            <RectangularOutlineDropDown
              placeholder=""
              optionList={langList}
              currentValue={currentAppLang || langList[0]?.id}
              width="26vw"
              onValueChange={async (selectedLang) => {
                console.log("selected Langauage", selectedLang);
                const tempLangCode = selectedLang
                console.log("tempLangCode", tempLangCode, langList)
                if (!tempLangCode) return;
                localStorage.setItem(APP_LANG, tempLangCode);
                setCurrentAppLang(tempLangCode);
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
