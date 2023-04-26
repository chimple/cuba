import { IonButton, IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { APP_LANG, LANG, PAGES } from "../common/constants";
import React from "react";
import Loading from "../components/Loading";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import i18n from "../i18n";
import { t } from "i18next";
import { chevronForward } from "ionicons/icons";
import { ServiceConfig } from "../services/ServiceConfig";

// import { Platform } from "react-native";

const AppLangSelection: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [langList, setLangList] = useState<string[]>([]);
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  useEffect(() => {}, []);

  let tempLangList: string[] = [];
  ServiceConfig.getI()
    .apiHandler.getAllLanguages()
    .then((l) => {
      l.forEach((element) => {
        tempLangList.push(element.title);
      });
      setLangList(tempLangList);
    });

  // const currentAppLang = localStorage.getItem(APP_LANG) || LANG.ENGLISH;

  return (
    <IonPage id="app-lang">
      {!isLoading ? (
        <div>
          <img
            id="app-lang-chimple-logo"
            alt="Chimple Brand Logo"
            // src="assets/Monk.gif"
            src="assets/icons/ChimpleBrandLogo.svg"
          />
          <IonButton
            className="app-lang-next-button"
            // disabled={}
            color="light"
            fill="solid"
            shape="round"
            onClick={async () => {
              history.replace(PAGES.LOGIN);
              const appLang = localStorage.getItem(APP_LANG);
              if (!appLang) {
                const tempLangCode = LANG.ENGLISH;
                localStorage.setItem(APP_LANG, tempLangCode);
                await i18n.changeLanguage(tempLangCode);
              }
            }}
          >
            {t("Next")}
            <IonIcon
              className="app-lang-arrow-icon"
              slot="end"
              icon={chevronForward}
            ></IonIcon>
          </IonButton>
          <div id="app-lang-element">
            <p id="app-lang-text">Select App Language</p>
            <RectangularOutlineDropDown
              optionList={langList}
              currentValue={currentAppLang || langList[0]}
              width="25vw"
              onValueChange={async (selectedLang) => {
                console.log("selected Langauage", selectedLang.detail.value);
                const tempLangCode = selectedLang.detail.value;
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
