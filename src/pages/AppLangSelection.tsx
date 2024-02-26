import { IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { LANGUAGE, LANG, PAGES, APP_LANGUAGES } from "../common/constants";
import Loading from "../components/Loading";
import i18n from "../i18n";
import NextButton from "../components/common/NextButton";
import { ServiceConfig } from "../services/ServiceConfig";
import "./AppLangSelection.css";
import { t } from "i18next";
import "./AppLangSelection.css";
import { chevronForward } from "ionicons/icons";
import DropDown from "../components/DropDown";

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
  // const [currentAppLang, setCurrentAppLang] = useState<string>(langList[0]?.id);
  const [currentPage, setCurrentPage] = useState<number>(-1);

  useEffect(() => {
    getLangList();
  }, []);
  async function getLangList() {
    setIsLoading(true);
    let tempLangList: {
      id: string;
      displayName: string;
    }[] = [];
    // const languages = await ServiceConfig.getI().apiHandler.getAllLanguages();
    const languages = Object.keys(APP_LANGUAGES).map((key) => ({
      code: key,
      title: APP_LANGUAGES[key],
    }));
    languages.forEach((element) => {
      tempLangList.push({
        id: element.code,
        displayName: element.title,
      });
    });
    const currLang = localStorage.getItem(LANGUAGE);
    if (!!currLang) {
      await i18n.changeLanguage(currLang);
      setCurrentAppLang(currLang);
    }
    setLangList(tempLangList);
    setIsLoading(false);
  }

  const intermediatePages = [
    {
      text: (
        <div className="intro-text">
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro1.svg"
          />
          <div id="text">
            <p id="header-text1">{t("Login with Phone number or Gmail")}</p>
            <div className="intro-text2">
              <p>
                {t(
                  "Users can now log in with their phone number or Gmail for easy access on different devices."
                )}
              </p>
              <p>
                {t(
                  "Your progress stays synced and consistent across all devices."
                )}
              </p>
            </div>
          </div>
        </div>
      ),
      buttonText: "",
    },
    {
      text: (
        <div className="intro-text">
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro2.svg"
          />
          <div id="text">
            <p id="header-text2">{t("Enhanced kid's profile creation")}</p>
            <div className="intro-text2">
              <p>
                {t(
                  "Kids can now customise their profiles with their class, language of"
                )}
              </p>
              <p>
                {t(
                  "instruction and school board to match their learning needs."
                )}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      text: (
        <div className="intro-text">
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro3.svg"
          />
          <div id="text">
            <p id="header-text3">{t("Advance Home Screen")}</p>
            <div className="intro-text2">
              <p>
                {t(
                  'The home screen has three tabs: "For You" suggests lessons based on'
                )}
              </p>
              <p>
                {t(
                  'progress, "Liked" shows liked lessons and "Played" lists completed ones.'
                )}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNextClick = async () => {
    if (currentPage === -1) {
      setCurrentPage(0);
    } else if (currentPage < intermediatePages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      history.replace(PAGES.LOGIN);
      const appLang = localStorage.getItem(LANGUAGE);
      if (!appLang) {
        const tempLangCode = LANG.ENGLISH;
        localStorage.setItem(LANGUAGE, tempLangCode);
        await i18n.changeLanguage(tempLangCode);
      }
    }
  };

  const handleSkipClick = async () => {
    history.replace(PAGES.LOGIN);
    const appLang = localStorage.getItem(LANGUAGE);
    if (!appLang) {
      const tempLangCode = LANG.ENGLISH;
      localStorage.setItem(LANGUAGE, tempLangCode);
      await i18n.changeLanguage(tempLangCode);
    }
  };

  return (
    <IonPage id="app-lang">
      {!isLoading ? (
        <div
          className={`app-container ${currentPage >= 0 ? "with-content" : ""}`}
        >
          <div className="skip-next">
            {currentPage >= 0 && (
              <div className="top-left">
                <button onClick={handleSkipClick} className="skip-button">
                  {t("Skip")}
                  <IonIcon
                    className="arrow-icon"
                    slot="end"
                    icon={chevronForward}
                  ></IonIcon>
                </button>
              </div>
            )}
            {currentPage >= 0 ? (
              <div className="top-right">
                <div id="App-lang-nextButton">
                  <NextButton disabled={false} onClicked={handleNextClick}>
                    {intermediatePages[currentPage]?.buttonText || ""}
                  </NextButton>
                </div>
              </div>
            ) : (
              <div className="top-right">
                <div id="App-lang-nextButton">
                  <NextButton
                    disabled={false}
                    onClicked={handleNextClick}
                  ></NextButton>
                </div>
              </div>
            )}
          </div>
          {currentPage >= 0 ? (
            <div className="middle-content">
              <div>{intermediatePages[currentPage]?.text || ""}</div>
            </div>
          ) : (
            <div className="middle-content">
              <img
                id="app-lang-chimple-logo"
                alt="Chimple Brand Logo"
                src="assets/icons/ChimpleBrandLogo.svg"
              />
              <div id="app-lang-element">
                <p id="app-lang-text">{t("Choose your language")}</p>
                <DropDown
                  placeholder=""
                  optionList={langList}
                  currentValue={currentAppLang || langList[0]?.id}
                  width="26vw"
                  onValueChange={async (selectedLang) => {
                    console.log("selected Language", selectedLang);
                    const tempLangCode = selectedLang;
                    if (!tempLangCode) return;
                    localStorage.setItem(LANGUAGE, tempLangCode);
                    console.log("Selected language: " + tempLangCode);
                    await i18n.changeLanguage(tempLangCode);
                    setCurrentAppLang(tempLangCode);
                  }}
                />
              </div>
            </div>
          )}
          {/* Navigation Dots */}
          {currentPage >= 0 && (
            <div className="navigation-dots">
              {intermediatePages.map((page, index) => (
                <div
                  key={index}
                  className={`dot ${currentPage === index ? "active" : ""}`}
                  onClick={() => setCurrentPage(index)}
                ></div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default AppLangSelection;
