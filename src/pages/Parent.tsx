import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import "./Parent.css";
import ParentHeader from "../components/parent/ParentHeader";
import {
  APP_LANG,
  LANG,
  MAX_STUDENTS_ALLOWED,
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
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { FaInstagramSquare } from "react-icons/fa";
import { TfiWorld } from "react-icons/tfi";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import i18n from "../i18n";
import Language from "../models/language";
import { ServiceConfig } from "../services/ServiceConfig";
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>();
  const [musicFlag, setMusicFlag] = useState<boolean>();
  const [userProfile, setUserProfile] = useState<any[]>([]);
  const [langList, setLangList] = useState<string[]>([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  let tempLangList: string[] = [];
  // let langDocIds: Map<string, string> = new Map();
  const localAppLang = localStorage.getItem(APP_LANG);

  useEffect(() => {
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    inti();
  }, []);

  async function inti() {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser != undefined) {
      console.log("User ", currentUser);
      setSoundFlag(currentUser?.soundFlag!);
      setMusicFlag(currentUser?.musicFlag!);

      const allLang = await ServiceConfig.getI().apiHandler.getAllLanguages();
      let tempLangDocIds: Map<string, string> = new Map();
      let keytempLangDocIds: Map<string, string> = new Map();
      for (let i = 0; i < allLang.length; i++) {
        const element = allLang[i];
        tempLangList.push(element.title);
        tempLangDocIds.set(element.title, element.docId);
        keytempLangDocIds.set(element.docId, element.title);
      }

      setLangDocIds(tempLangDocIds);
      setLangList(tempLangList);

      console.log(
        "current Lang",
        langDocIds,
        langDocIds.get(currentUser?.language?.id!),
        keytempLangDocIds.get(currentUser?.language?.id!),
        langDocIds.get(currentUser?.language?.id!) ||
          localAppLang ||
          langList[0]
      );
      setCurrentAppLang(keytempLangDocIds.get(currentUser?.language?.id!));
    }
  }

  function onHeaderIconClick(selectedHeader: any) {
    setCurrentHeader(selectedHeader);
  }

  function profileUI() {
    const userProfilePromise: Promise<User[]> =
      ServiceConfig.getI().apiHandler.getParentStudentProfiles();

    let finalUser: any[] = [];
    userProfilePromise.then((u) => {
      for (let i = 0; i < MAX_STUDENTS_ALLOWED; i++) {
        if (u[i]) {
          finalUser.push(u[i]);
        } else {
          finalUser.push("no user");
        }
      }
      setUserProfile(finalUser);
    });

    return (
      <div id="parent-page-profile">
        {userProfile.map((element) => {
          return (
            <ProfileCard
              width={"27vw"}
              height={"50vh"}
              userType={element?.name ? true : false}
              user={element}
              showText={true}
            />
          );
        })}
      </div>
    );
  }

  function settingUI() {
    
    return (
      <div id="parent-page-setting">
        <div id="parent-page-setting-div">
          <p id="parent-page-setting-lang-text">Language</p>
          <RectangularOutlineDropDown
            optionList={langList}
            currentValue={currentAppLang || langList[0]}
            width="15vw"
            onValueChange={async (selectedLang) => {
              console.log("selected Langauage", selectedLang.detail.value);
              const tempLangCode: string =
                selectedLang.detail.value ?? LANG.ENGLISH;
              setCurrentAppLang(selectedLang.detail.value);
              console.log("UI Lang", selectedLang.detail.value, currentAppLang);
              await i18n.changeLanguage(tempLangCode);
              const currentUser =
                await ServiceConfig.getI().authHandler.getCurrentUser();

              const langId = langDocIds.get(selectedLang.detail.value);

              if (currentUser && langId) {
                ServiceConfig.getI().apiHandler.updateLanguage(
                  currentUser,
                  langId
                );
              }
            }}
          ></RectangularOutlineDropDown>
        </div>
        <div id="parent-page-setting-div">
          <ToggleButton
            flag={soundFlag!}
            title="Sound"
            onIonChangeClick={async (v) => {
              console.log("ion change value ", v.detail.checked);
              setSoundFlag(v.detail.checked);
              const currentUser =
                await ServiceConfig.getI().authHandler.getCurrentUser();

              if (currentUser) {
                ServiceConfig.getI().apiHandler.updateSoundFlag(
                  currentUser,
                  v.detail.checked
                );
              }
            }}
          ></ToggleButton>

          <ToggleButton
            flag={musicFlag!}
            title="Music"
            onIonChangeClick={async (v) => {
              console.log("ion change value ", v.detail.checked);
              setMusicFlag(v.detail.checked);
              const currentUser =
                await ServiceConfig.getI().authHandler.getCurrentUser();

              if (currentUser) {
                ServiceConfig.getI().apiHandler.updateMusicFlag(
                  currentUser,
                  v.detail.checked
                );
              }
            }}
          ></ToggleButton>
        </div>
      </div>
    );
  }

  function helpUI() {
    return (
      <div id="parent-page-help">
        <h1 id="parent-page-help-title">Chimple Help Desk</h1>
        <div id="parent-page-help-title-e1">
          <div id="parent-page-help-share-button">
            <EmailShareButton
              url={"help@sutara.org"}
              subject={"Chimple Kids app- Help Desk"}
              body=""
              className="Demo__some-network__share-button"
            >
              Email Us
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
            Visit Website
            <TfiWorld size={"2vw"} />
            {/* <IonIcon name="globe-outline" size={"2vw"}></IonIcon> */}
          </div>
          <div
            id="parent-page-help-share-button"
            onClick={() => {
              let message = "Hiii !!!!";
              window.open(
                `https://api.whatsapp.com/send?phone=917981611434&text=${message}`,
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
            WhatsApp Us
            <WhatsappIcon size={"2vw"} round />
          </div>
        </div>
        <div id="parent-page-help-title-e2">
          Help Video
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
            Instagram
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
            Fackbook
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
            Twitter
            <TwitterIcon size={"2vw"} round />
          </div>
        </div>
      </div>
    );
  }

  return (
    <IonPage>
      {!isLoading ? (
        <div id="parent-page">
          <ParentHeader
            currentHeader={currentHeader}
            onHeaderIconClick={onHeaderIconClick}
          ></ParentHeader>

          {currentHeader === PARENTHEADERLIST.PROFILE ? (
            <div>{profileUI()}</div>
          ) : null}

          {currentHeader === PARENTHEADERLIST.SETTING ? (
            <div>{settingUI()}</div>
          ) : null}

          {currentHeader === PARENTHEADERLIST.HELP ? (
            <div>{helpUI()}</div>
          ) : null}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Parent;
