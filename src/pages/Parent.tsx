import { useEffect, useState } from "react";
import "./Parent.css";
import {
  LANGUAGE,
  LANG,
  MAX_STUDENTS_ALLOWED,
  PAGES,
  PARENTHEADERLIST,
} from "../common/constants";
import ProfileCard from "../components/parent/ProfileCard";
import User from "../models/user";
import ToggleButton from "../components/parent/ToggleButton";

// import LeftTitleRectangularIconButton from "../components/parent/LeftTitleRectangularIconButton";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";
import { FaInstagramSquare } from "react-icons/fa";
import { t } from "i18next";
import { TfiWorld } from "react-icons/tfi";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import i18n from "../i18n";
import { ServiceConfig } from "../services/ServiceConfig";
import ParentLogout from "../components/parent/ParentLogout";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { blue, red, green } from "@mui/material/colors";
import { common } from "@mui/material/colors";
import BackButton from "../components/common/BackButton";
import { useHistory } from "react-router-dom";
import CustomAppBar from "../components/studentProgress/CustomAppBar";
import DeleteParentAccount from "../components/parent/DeleteParentAccount";

// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>();
  const [musicFlag, setMusicFlag] = useState<boolean>();
  const [userProfile, setUserProfile] = useState<any[]>([]);
  const [tabIndex, setTabIndex] = useState<any>();

  const [langList, setLangList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();
  //  const [localLangDocId, setLocalLangDocId] = useState<any>();
  const [reloadProfiles , setReloadProfiles] = useState<boolean>(false);
  let tempLangList: {
    id: string;
    displayName: string;
  }[] = [];
  // let langDocIds: Map<string, string> = new Map();
  const localAppLang = localStorage.getItem(LANGUAGE);
  const history = useHistory();
  const parentHeaderIconList = [
    { header: "profile", displayName: "Profile" },
    { header: "setting", displayName: "Setting" },
    { header: "help", displayName: "Help" },
    { header: "faq", displayName: "FAQ" },
  ];

  useEffect(() => {
    setIsLoading(true);
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    inti();
    getStudentProfile();
  }, [reloadProfiles]);
  
  function getStudentProfile(){ 
    console.log("getStudentProfile");
    const userProfilePromise: Promise<User[]> =
    ServiceConfig.getI().apiHandler.getParentStudentProfiles();
    let finalUser: any[] = [];
  userProfilePromise.then((u) => {
    for (let i = 0; i < MAX_STUDENTS_ALLOWED; i++) {
      if (u[i]) {
        finalUser.push(u[i]);
      } else {
        finalUser.push(undefined);
      }
    }
    setUserProfile(finalUser);
    
  });
  }
  async function inti(): Promise<void> {
    const parentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (parentUser != undefined) {
      console.log("User ", parentUser);
      setSoundFlag(parentUser?.soundFlag!);
      setMusicFlag(parentUser?.musicFlag!);

      const allLang = await ServiceConfig.getI().apiHandler.getAllLanguages();
      let tempLangDocIds: Map<string, string> = new Map();
      let keytempLangDocIds: Map<string, string> = new Map();
      for (let i = 0; i < allLang.length; i++) {
        const element = allLang[i];

        tempLangList.push({
          id: element.docId,
          displayName: element.title,
        });
        tempLangDocIds.set(element.title, element.docId);
        keytempLangDocIds.set(element.docId, element.title);
      }

      setLangDocIds(tempLangDocIds);
      setLangList(tempLangList);

      console.log(
        "current Lang",
        langDocIds,
        langDocIds.get(parentUser?.language?.id!),
        keytempLangDocIds.get(parentUser?.language?.id!),
        langDocIds.get(parentUser?.language?.id!) || localAppLang || langList[0]
      );

      //console.log(localAppLang);

      const element = allLang.find((obj) => obj.code === localAppLang);
      if (!element) return;

      setCurrentAppLang(element.docId);

      setIsLoading(false);
    }
  }

  function onHeaderIconClick(selectedHeader: any) {
    setCurrentHeader(selectedHeader);
  }

  function profileUI() {
   
    // setIsLoading(false);

    return (
      <div id="parent-page-profile">
        {userProfile.map((element) => {
          console.log("userProfile",userProfile)
          let studentUserType: boolean = true;
          if  (element === undefined  ){
            console.log("element",element)
            studentUserType = false;
          }
          return (
            <ProfileCard
              width={"27vw"}
              height={"50vh"}
              userType={studentUserType}
              user={element}
              showText={true}
              setReloadProfiles={setReloadProfiles}
            />
          );
        })}
      </div>
    );
  }

  function settingUI() {
    return (
      <div>
        <div id="parent-page-setting">
          <div id="parent-page-setting-div">
            <p id="parent-page-setting-lang-text">{t("Language")}</p>
            <RectangularOutlineDropDown
              currentValue={currentAppLang}
              optionList={langList}
              placeholder="Select Language"
              width="26vw"
              onValueChange={async (selectedLangDocId) => {
                // setIsLoading(true);

                const api = ServiceConfig.getI().apiHandler;
                // api.deleteAllUserData
                // const langDoc = await api.getLanguageWithId(selectedLangDocId);
                const allLang =
                  await ServiceConfig.getI().apiHandler.getAllLanguages();

                const langDoc = allLang.find(
                  (obj) => obj.docId === selectedLangDocId
                );

                if (!langDoc) return;
                localStorage.setItem(LANGUAGE, langDoc.code);
                console.log("langDoc", langDoc);
                await i18n.changeLanguage(langDoc.code);
                console.log("applang", selectedLangDocId);
                const currentUser =
                  await ServiceConfig.getI().authHandler.getCurrentUser();
                setTabIndex(t(parentHeaderIconList[1].header));

                const langId = langDocIds.get(langDoc.code);

                if (currentUser && selectedLangDocId) {
                  ServiceConfig.getI().apiHandler.updateLanguage(
                    currentUser,
                    selectedLangDocId
                  );
                }
                console.log("selectedLangDocId", selectedLangDocId);
                setCurrentAppLang(selectedLangDocId);
              }}
            />
          </div>
          <div id="parent-page-setting-div">
            <ToggleButton
              flag={soundFlag!}
              title={t("Sound")}
              onIonChangeClick={async (v) => {
                console.log("ion change value ", v.detail?.checked);
                setSoundFlag(v.detail?.checked);
                const currentUser =
                  await ServiceConfig.getI().authHandler.getCurrentUser();

                if (currentUser) {
                  ServiceConfig.getI().apiHandler.updateSoundFlag(
                    currentUser,
                    v.detail?.checked
                  );
                }
              }}
            ></ToggleButton>

            <ToggleButton
              flag={musicFlag!}
              title={t("Music")}
              onIonChangeClick={async (v) => {
                console.log("ion change value ", v.detail?.checked);
                setMusicFlag(v.detail?.checked);
                const currentUser =
                  await ServiceConfig.getI().authHandler.getCurrentUser();

                if (currentUser) {
                  ServiceConfig.getI().apiHandler.updateMusicFlag(
                    currentUser,
                    v.detail?.checked
                  );
                }
              }}
            ></ToggleButton>
          </div>
        </div>
        <div id="logout-delete-button">
          <div id="parent-logout">
            <ParentLogout />
          </div>
          <div id="parent-delete">
            <DeleteParentAccount />
          </div>
        </div>
      </div>
    );
  }

  function helpUI() {
    return (
      <div id="parent-page-help">
        <h1 id="parent-page-help-title">{t("Chimple Help Desk")}</h1>
        <div id="parent-page-help-title-container">
          <div id="parent-page-help-title-link">
            <div id="parent-page-help-title-e1">
              <div id="parent-page-help-share-button">
                <EmailShareButton
                  url={"help@sutara.org"}
                  subject={"Chimple Kids app- Help Desk"}
                  body=""
                  className="Demo__some-network__share-button"
                >
                  {/* Email Us */}
                  {t("Email Us")}
                </EmailShareButton>
                <EmailIcon size={"2vw"} round />
              </div>
              <div
                id="parent-page-help-share-button"
                onClick={() => {
                  console.log("Value clicked");
                  window.open("https://www.chimple.org/", "_system");
                }}
              >
                {/* Visit Website */}
                {t("Visit Website")}
                <TfiWorld size={"2vw"} />
                {/* <IonIcon name="globe-outline" size={"2vw"}></IonIcon> */}
              </div>
              <div
                id="parent-page-help-share-button"
                onClick={() => {
                  let message = "Hiii !!!!";
                  window.open(
                    `https://api.whatsapp.com/send?phone=918904515444&text=${message}`,
                    "_system"
                  );
                }}
              >
                {/* <WhatsappShareButton
              // https://api.whatsapp.com/send?phone=917981611434&text=${message}
              url={"send?phone=917981611434&"}
              title={"hi"}
              className="Demo__some-network__share-button"
            >
              WhatsApp Us
            </WhatsappShareButton> */}
                {/* WhatsApp Us */}
                {t("WhatsApp Us")}
                <WhatsappIcon size={"2vw"} round />
              </div>
            </div>
            <div id="parent-page-help-title-e2">
              <div id="help">{t("Help Video")}</div>
              <div id="parent-page-help-title-e2-video">
                <iframe
                  id="parent-page-help-title-e2-video-youtude"
                  className="embed-responsive-item"
                  allowFullScreen={true}
                  // width="50%"
                  // height="50%"
                  src="https://www.youtube.com/embed/Ez9oouE2pOE"
                  title="YouTube video player"
                  // frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  // allowfullscreen
                ></iframe>
              </div>
            </div>
            <div id="parent-page-help-title-e3">
              <div
                id="parent-page-help-share-button-e3"
                onClick={() => {
                  console.log("Value clicked");
                  // let message = "Hiii !!!!";
                  window.open(
                    `https://api.instagram.com/chimple_learning/`,
                    "_system"
                  );
                  // https://api.instagram.com/chimple_learning/

                  // instagram://user?username=its_mee_skanda
                }}
              >
                {/* Instagram */}
                {t("Instagram")}
                <FaInstagramSquare size={"2vw"} />
              </div>
              <div
                id="parent-page-help-share-button-e3"
                onClick={() => {
                  // let message = "Hiii !!!!";
                  window.open(`https://www.facebook.com/chimple`, "_system");
                }}
              >
                {/* <FacebookShareButton
              url={"https://www.facebook.com/chimple"}
              quote={"Chimple Learning"}
              className="Demo__some-network__share-button"
            >
              Fackbook
            </FacebookShareButton> */}
                {/* Facebook */}
                {t("Facebook")}
                <FacebookIcon size={"2vw"} round />
              </div>
              <div
                id="parent-page-help-share-button-e3"
                onClick={() => {
                  // let message = "Hiii !!!!";
                  window.open(`https://twitter.com/chimple_org`, "_system");
                }}
              >
                {/* <TwitterShareButton
              url={"https://twitter.com/chimple_org"}
              title={"Chimple Learning"}
              className="Demo__some-network__share-button"
            >
              Twitter
            </TwitterShareButton> */}
                {/* Twitter */}
                {t("Twitter")}
                <TwitterIcon size={"2vw"} round />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (newValue: string) => {
    const selectedHeader = parentHeaderIconList.find(
      (item) => item.header === newValue
    );
    if (selectedHeader) {
      setCurrentHeader(selectedHeader.header);
    }
    setTabIndex(newValue);
  };

  const handleBackButton = () => {
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  useEffect(() => {
    if (!tabIndex && parentHeaderIconList.length > 0) {
      setTabIndex(t(parentHeaderIconList[0].header));
    }
  }, []);

  return (
    <Box>
      <div>
        <CustomAppBar
          tabNames={parentHeaderIconList.map((item) => t(item.header))}
          value={tabIndex}
          onChange={handleChange}
          handleBackButton={handleBackButton}
        />
        {tabIndex === t("profile") && <div>{profileUI()}</div>}
        {tabIndex === t("setting") && <div>{settingUI()}</div>}
        {tabIndex === t("help") && <div>{helpUI()}</div>}
        {tabIndex === t("faq") && <div></div>}
      </div>
    </Box>
  );
};

export default Parent;
