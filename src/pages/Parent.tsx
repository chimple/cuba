import { useEffect, useState } from "react";
import "./Parent.css";
import {
  APP_LANG,
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
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>();
  const [musicFlag, setMusicFlag] = useState<boolean>();
  const [userProfile, setUserProfile] = useState<any[]>([]);
  const [langList, setLangList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  let tempLangList: {
    id: string;
    displayName: string;
  }[] = [];
  // let langDocIds: Map<string, string> = new Map();
  const localAppLang = localStorage.getItem(APP_LANG);
  const history = useHistory();

  useEffect(() => {
    setIsLoading(true);
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    inti();
  }, []);

  async function inti() {
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
      setCurrentAppLang(keytempLangDocIds.get(parentUser?.language?.id!));
      setIsLoading(false);
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
    // setIsLoading(false);

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
      <div>
        <div id="parent-page-setting">
          <div id="parent-page-setting-div">
            <p id="parent-page-setting-lang-text">Language</p>
            <RectangularOutlineDropDown
              placeholder=""
              optionList={langList}
              currentValue={currentAppLang || langList[0].id}
              width="26vw"
              onValueChange={async (selectedLang) => {
                console.log("selected Langauage", selectedLang.detail.value);
                const tempLangCode: string =
                  selectedLang.detail.value ?? LANG.ENGLISH;
                setCurrentAppLang(selectedLang.detail.value);
                console.log(
                  "UI Lang",
                  selectedLang.detail.value,
                  currentAppLang
                );
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
        <div id="parent-logout">
          <ParentLogout />
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

  const [tabIndex, setTabIndex] = useState("profile");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // setValue(newValue);
    setTabIndex(newValue);
  };

  return (
    // <IonPage>
    //   {!isLoading ? (
    //     <div id="parent-page">
    //       <ParentHeader
    //         currentHeader={currentHeader}
    //         onHeaderIconClick={onHeaderIconClick}
    //       ></ParentHeader>

    //       {currentHeader === PARENTHEADERLIST.PROFILE ? (
    //         <div>{profileUI()}</div>
    //       ) : null}

    //       {currentHeader === PARENTHEADERLIST.SETTING ? (
    //         <div>{settingUI()}</div>
    //       ) : null}

    //       {currentHeader === PARENTHEADERLIST.HELP ? (
    //         <div>{helpUI()}</div>
    //       ) : null}
    //     </div>
    //   ) : null}
    //   <Loading isLoading={isLoading} />
    // </IonPage>
    <Box>
      <Box>
        <AppBar
          position="static"
          sx={{
            flexDirection: "inherit",
            justifyContent: "space-between",
            padding: "1vh 1vw",
            backgroundColor: "#FF7925 !important",
            boxShadow: "0px 0px 0px 0px !important",
          }}
        >
          <BackButton
            // iconSize={"8vh"}
            onClicked={() => {
              history.replace(PAGES.DISPLAY_STUDENT);
            }}
          ></BackButton>
          <Tabs
            value={tabIndex}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="secondary tabs example"
            // variant="scrollable"
            scrollButtons="auto"
            // aria-label="scrollable auto tabs example"
            centered
            sx={{
              // "& .MuiAppBar-root": { backgroundColor: "#FF7925 !important" },
              "& .MuiTabs-indicator": { backgroundColor: "#FFFFFF" },
              "& .MuiTab-root": { color: "#000000" },
              "& .Mui-selected": { color: "#FFFFFF" },
            }}
          >
            <Tab
              value="profile"
              label="profile"
              id="parent-page-tab-bar"
              // sx={{
              //   // fontSize:"5vh"
              //   marginRight: "5vw",
              // }}
            />
            <Tab id="parent-page-tab-bar" value="setting" label="setting" />
            <Tab id="parent-page-tab-bar" value="help" label="help" />
            <Tab id="parent-page-tab-bar" value="faq" label="faq" />
          </Tabs>
          <div></div>
        </AppBar>
      </Box>
      <Box sx={{}}>
        {tabIndex === "profile" && (
          <Box>
            <div>{profileUI()}</div>
          </Box>
        )}
        {tabIndex === "setting" && (
          <Box>
            <div>{settingUI()}</div>
          </Box>
        )}
        {tabIndex === "help" && (
          <Box>
            <div>{helpUI()}</div>
          </Box>
        )}
        {tabIndex === "faq" && (
          <Box>
            <div></div>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Parent;
