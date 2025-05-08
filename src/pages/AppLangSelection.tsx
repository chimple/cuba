import { IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { LANGUAGE, LANG, PAGES, APP_LANGUAGES } from "../common/constants";
import Loading from "../components/Loading";
import i18n from "../i18n";
import NextButton from "../components/common/NextButton";
import { chevronForward } from "ionicons/icons";
import DropDown from "../components/DropDown";

const AppLangSelection: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [langList, setLangList] = useState<{ id: string; displayName: string }[]>([]);
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  useEffect(() => {
    getLangList();
  }, []);

  async function getLangList() {
    setIsLoading(true);
    const languages = Object.keys(APP_LANGUAGES).map((key) => ({
      id: key,
      displayName: APP_LANGUAGES[key],
    }));

    const currLang = localStorage.getItem(LANGUAGE);
    if (!!currLang) {
      await i18n.changeLanguage(currLang);
      setCurrentAppLang(currLang);
    }

    setLangList(languages);
    setIsLoading(false);
  }

  const handleNextClick = async () => {
    const appLang = localStorage.getItem(LANGUAGE);
    if (!appLang) {
      const tempLangCode = LANG.ENGLISH;
      localStorage.setItem(LANGUAGE, tempLangCode);
      await i18n.changeLanguage(tempLangCode);
    }
    history.replace(PAGES.LOGIN);
  };

  return (
    <IonPage id="app-lang">
      {!isLoading ? (
        <div className="app-container">
          <div className="top-right">
            <div id="App-lang-nextButton">
              <NextButton disabled={false} onClicked={handleNextClick} />
            </div>
          </div>
          <div className="middle-content">
            <img
              id="app-lang-chimple-logo"
              alt="Chimple Brand Logo"
              src="assets/icons/ChimpleBrandLogo.svg"
            />
            <div id="app-lang-element">
              <p id="app-lang-text">{i18n.t("Choose your language")}</p>
              <DropDown
                placeholder=""
                optionList={langList}
                currentValue={currentAppLang || langList[0]?.id}
                width="26vw"
                onValueChange={async (selectedLang) => {
                  if (!selectedLang) return;
                  localStorage.setItem(LANGUAGE, selectedLang);
                  await i18n.changeLanguage(selectedLang);
                  setCurrentAppLang(selectedLang);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default AppLangSelection;
