import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import "./Parent.css";
import ParentHeader from "../components/parent/ParentHeader";
import { PARENTHEADERLIST } from "../common/constants";
import ProfileCard from "../components/parent/ProfileCard";
import User from "../models/user";
import { FirebaseAuth } from "../services/auth/FirebaseAuth";
import DropDown from "../components/DropDown";
import ToggleButton from "../components/parent/ToggleButton";
// import LeftTitleRectangularIconButton from "../components/parent/LeftTitleRectangularIconButton";
import share, {
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
import RectangularOutlineDropDown from "../components/parent/LeftTitleRectangularIconButton";
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>(true);
  const [musicFlag, setMusicFlag] = useState<boolean>(false);

  useEffect(() => {
    // init();
    setCurrentHeader(PARENTHEADERLIST.SETTING);
  }, []);

  function onHeaderIconClick(selectedHeader: any) {
    console.log("Parent selectedHeader ", selectedHeader);
    setCurrentHeader(selectedHeader);
    // localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    console.log(selectedHeader, " Icons is selected");
    // if (selectedHeader === HEADERLIST.RECOMMENDATION) {
    //   setCourse(HEADERLIST.RECOMMENDATION);
    // }
    // if (selectedHeader === HEADERLIST.PROFILE) {
    //   history.push(PAGES.PROFILE);
    // }
  }

  //   async function getAsyncUserProfiles() {
  //     return await FirebaseAuth.i.getUserProfiles();
  //   }

  function profileUI(selectedHeader: any) {
    const userProfilePromise: Promise<User[]> =
      FirebaseAuth.i.getUserProfiles();

    let userProfile: User[];
    userProfilePromise.then((u) => {
      console.log("up", u);
      userProfile = u;
    });
    return (
      <div id="parent-page-profile">
        <ProfileCard
          width={"27vw"}
          height={"40vh"}
          user={userProfilePromise}
          showText={true}
        />
        <ProfileCard
          width={"27vw"}
          height={"40vh"}
          user={userProfilePromise}
          showText={true}
        />
        <ProfileCard
          width={"27vw"}
          height={"40vh"}
          user={userProfilePromise}
          showText={true}
        />
      </div>
    );
  }

  function settingUI(selectedHeader: any) {
    // return (
    //   <ToggleButton
    //     flag={musicFlag}
    //     title="Music"
    //     onIonChangeClick={(v) => {
    //       console.log("ion change value ", v.detail.checked);
    //       setMusicFlag(v.detail.checked);
    //     }}
    //   ></ToggleButton>
    // );

    return (
      <div id="parent-page-setting">
        <div id="parent-page-setting-div">
          <p id="parent-page-setting-lang-text">Language</p>
          <RectangularOutlineDropDown
            optionList={["English", "Hindi", "Karnataka"]}
            currentValue={"English"}
            width="15vw"
            onValueChange={(selectedGrade) => {
              console.log("selected Langauage", selectedGrade);
            }}
          ></RectangularOutlineDropDown>
        </div>
        {/* <div id="parent-page-setting-lang-dropdown">
          <DropDown
            optionList={["English", "Hindi", "Karnataka"]}
            currentValue={"English"}
            width="15vw"
            onValueChange={(selectedGrade) => {
              console.log("selected Langauage", selectedGrade);
            }}
          />
        </div> */}
        <div
          id="parent-page-setting-div"
          // className="parent-page-setting-div-vertical-space"
        >
          <ToggleButton
            flag={soundFlag}
            title="Sound"
            onIonChangeClick={(v) => {
              console.log("ion change value ", v.detail.checked);
              setSoundFlag(v.detail.checked);
            }}
          ></ToggleButton>

          <ToggleButton
            flag={musicFlag}
            title="Music"
            onIonChangeClick={(v) => {
              console.log("ion change value ", v.detail.checked);
              setMusicFlag(v.detail.checked);
            }}
          ></ToggleButton>
        </div>
      </div>
    );
  }

  function helpUI(selectedHeader: any) {
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
          {/* <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Visit Website"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              window.open("https://www.chimple.org/", "_system");
            }}
          ></LeftTitleRectangularIconButton> */}
          <div id="parent-page-help-share-button">
            <WhatsappShareButton
              url={"?phone=918904515444&"}
              title={"title"}
              className="Demo__some-network__share-button"
            >
              WhatsApp Us
            </WhatsappShareButton>
            <WhatsappIcon size={"2vw"} round />
          </div>
          {/* <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"WhatsApp Us"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              let message = "Hiii !!!!";
              window.open(
                `https://api.whatsapp.com/send?phone=917981611434&text=${message}`,
                "_system"
              );
            }}
          ></LeftTitleRectangularIconButton> */}
        </div>
        <div id="parent-page-help-title-e2">
          Help Video
          <div id="parent-page-help-title-e2-video">
            <iframe
              id="parent-page-help-title-e2-video-youtude"
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
          <div id="parent-page-help-share-button-e3">
            <FacebookShareButton
              url={"https://www.facebook.com/chimple"}
              quote={"Chimple Learning"}
              className="Demo__some-network__share-button"
            >
              Fackbook
            </FacebookShareButton>
            <FacebookIcon size={"2vw"} round />
          </div>
          <div id="parent-page-help-share-button-e3">
            <TwitterShareButton
              url={"https://twitter.com/chimple_org"}
              title={"Chimple Learning"}
              className="Demo__some-network__share-button"
            >
              Twitter
            </TwitterShareButton>
            <TwitterIcon size={"2vw"} round />
          </div>
          {/* <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Twiter"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              let message = "Hiii !!!!";
              window.open(
                `https://twitter.com/intent/tweet?text=${message}`,
                "_system"
              );
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton> */}
        </div>
      </div>
    );
  }

  return (
    <IonPage>
      <IonContent>
        {!isLoading ? (
          <div id="parent-page">
            <ParentHeader
              currentHeader={currentHeader}
              onHeaderIconClick={onHeaderIconClick}
            ></ParentHeader>

            {currentHeader === PARENTHEADERLIST.PROFILE ? (
              <div>{profileUI(currentHeader)}</div>
            ) : null}

            {currentHeader === PARENTHEADERLIST.SETTING ? (
              <div>{settingUI(currentHeader)}</div>
            ) : null}

            {currentHeader === PARENTHEADERLIST.HELP ? (
              <div>{helpUI(currentHeader)}</div>
            ) : null}
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default Parent;
