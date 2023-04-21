import { IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { APP_LANG, LANG, PAGES } from "../common/constants";
import React from "react";
import Loading from "../components/Loading";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import i18n from "../i18n";
// import { Platform } from "react-native";

const AppLangSelection: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {}, []);
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
          <div id="app-lang-element">
            <p id="app-lang-text">Select App Language</p>
            <RectangularOutlineDropDown
              optionList={["English", "Hindi", "Karnataka"]}
              currentValue={"English"}
              width="25vw"
              onValueChange={async (selectedLang) => {
                console.log("selected Langauage", selectedLang.detail.value);
                const tempLangCode = selectedLang.detail.value ?? LANG.ENGLISH;
                localStorage.setItem(APP_LANG, tempLangCode);
                await i18n.changeLanguage(tempLangCode);
                history.replace(PAGES.LOGIN);
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
