import { IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./AppLangSelection.css";
import { useHistory } from "react-router-dom";
import { LANGUAGE, LANG, PAGES } from "../common/constants";
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
    const languages = await ServiceConfig.getI().apiHandler.getAllLanguages();
    languages.forEach((element) => {
      tempLangList.push({
        id: element.code,
        displayName: element.title,
      });
    });
    setLangList(tempLangList);
    setIsLoading(false);
  }

  const intermediatePages = [
    {
      text: (
        <div className="intro-text">
          {/* <div id="login-logo-outer-box"> */}
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro1.svg"
          />
          {/* </div> */}
          <div id="text">
            <p id="header-text1">
              {t("Login with Phone number or Gmail")}
            </p>
            <div className="intro-text2">
              <p>
                {t("Users can now log in using their phone number or Gmail address.")}
              </p>
              <p>
                {t("This allows seamless login across multiple devices")}
              </p>
              <p>
                {t("using the same credentials. Progress synchronized to the")}
              </p>
              <p>
                {t("associated account and remains consistent even when switching devices.")}
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
          {/* <div id="profile-logo-outer-box"> */}
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro2.svg"
          />
          {/* </div> */}
          <div id="text">
            <p id="header-text2">
              {t("Enhanced kids profile creation")}
            </p>
            <div className="intro-text2">
              <p>
                {t("Children now have the option to personalise their profile")}
              </p>
              <p>
                {t("beyond the usual details of Name, Age, Avatar, and Gender.")}
              </p>
              <p>
                {t("They can also select their Class, Medium of Instruction,")}
              </p>
              <p>
                {t("and Board, which will tailor the learning curriculum accordingly.")}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      text: (
        <div className="intro-text">
          {/* <div id="advance-home-logo-outer-box"> */}
          <img
            id="intro-logo"
            alt="Home Screen"
            src="assets/icons/intro3.svg"
          />
          {/* </div> */}
          <div id="text">
            <p id="header-text3">
              {t("Advance Home Screen")}
            </p>
            <div className="intro-text2">
              <p>
                {t("The home screen features three tabs:\"For You\",\"Liked\" and \"Played\".")}
              </p>
              <p>
                {t("The \"For You\" tab offers lesson suggestions based on learning progress.")}
              </p>
              <p>
                {t("The \"liked\" tab displays lessons the child liked after playing, while the played")}
              </p>
              <p>
                {t("tab lists all the child has completed lessons. These tabs collectively guide the child's")}
              </p>
              <p>
                {t("learning journey by indicating what they need to learn and have already played.")}
              </p>
            </div>
          </div>
        </div>
      )
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
        <div className={`app-container ${currentPage >= 0 ? "with-content" : ""}`}>
          <div className="skip-next">
            {currentPage >= 0 && (
              <div className="top-left">
                <button onClick={handleSkipClick} className="skip-button">
                  {t("Skip")}
                  <IonIcon className="arrow-icon" slot="end" icon={chevronForward}></IonIcon>
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
                  <NextButton disabled={false} onClicked={handleNextClick}>

                  </NextButton>
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
                  optionList={langList}
                  currentValue={currentAppLang || langList[0]?.id}
                  width={"26vw"}
                  placeholder={"placeholder"}
                  onValueChange={async (selectedLang) => {
                    console.log("selected Language", selectedLang);
                    const tempLangCode = selectedLang;
                    if (!tempLangCode) return;
                    localStorage.setItem(LANGUAGE, tempLangCode);
                    setCurrentAppLang(tempLangCode);
                    console.log("Selected language: " + tempLangCode);
                    await i18n.changeLanguage(tempLangCode);
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
