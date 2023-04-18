import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import "./Parent.css";
import ParentHeader from "../components/parent/ParentHeader";
import { PARENTHEADERLIST } from "../common/constants";
import ProfileCard from "../components/parent/ProfileCard";
import User from "../models/user";
import { FirebaseAuth } from "../services/auth/FirebaseAuth";
import GradeDropDown from "../components/GradeDropDown";
import ToggleButton from "../components/parent/ToggleButton";
import LeftTitleRectangularIconButton from "../components/parent/LeftTitleRectangularIconButton";
import share, {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
} from "react-share";
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>(true);
  const [musicFlag, setMusicFlag] = useState<boolean>(false);

  useEffect(() => {
    // init();
    setCurrentHeader(PARENTHEADERLIST.HELP);
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
          width={"25vw"}
          height={"45vh"}
          user={userProfilePromise}
          showText={true}
        />
        <ProfileCard
          width={"25vw"}
          height={"45vh"}
          user={userProfilePromise}
          showText={true}
        />
        <ProfileCard
          width={"25vw"}
          height={"45vh"}
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
        <div id="parent-page-setting-lang-dropdown">
          <GradeDropDown
            grades={["English", "Hindi", "Karnataka"]}
            currentGrade={"English"}
            onGradeChange={(selectedGrade) => {
              console.log("selected Langauage", selectedGrade);
            }}
          />
        </div>
        <div id="parent-page-setting-toggle">
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
    let email = {
      to: "skanda@sutara.org",
      cc: ["prakash@sutara.org", "vinay@sutara.org"],
      // bcc: ["john@doe.com", "jane@doe.com"],
      // attachments: [
      //   "file://img/logo.png",
      //   "res://icon.png",
      //   "base64:icon.png//iVBORw0KGgoAAAANSUhEUg...",
      //   "file://README.pdf",
      // ],
      subject: "Testing Testing",
      body: "Em Chestunnav ra leyyy",
      isHtml: true,
    };

    // Send a text message using default options
    const shareUrl = "http://github.com";
    const title = "GitHub";

    return (
      <div id="parent-page-help">
        <h1 id="parent-page-help-title">Chimple Help Desk</h1>
        <div id="parent-page-help-title-e1">
          <EmailShareButton
            url={"shareUrl"}
            subject={"title"}
            body="body"
            className="Demo__some-network__share-button"
          >
            <EmailIcon size={32} round />
          </EmailShareButton>
          <FacebookShareButton
            url={shareUrl}
            quote={title}
            className="Demo__some-network__share-button"
          >
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Email Us"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              // console.log(
              //   "eMAIL clicked",
              //   EmailComposer,
              //   EmailComposer.isAvailable()
              // );
              // EmailComposer.isAvailable().then((available: boolean) => {
              //   console.log("available", available);
              //   if (available) {
              //     //Now we know we can send
              //     EmailComposer.open(email);
              //   }
              // });
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton>
          <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Visit Website"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              window.open("https://www.chimple.org/", "_system");
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton>
          <LeftTitleRectangularIconButton
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
          ></LeftTitleRectangularIconButton>
        </div>
        <div id="parent-page-help-title-e2">
          <iframe
            id="responsive-iframe"
            // width="50%"
            // height="50%"
            src="https://www.youtube.com/embed/Ez9oouE2pOE"
            title="YouTube video player"
            // frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            // allowfullscreen
          ></iframe>
        </div>
        <div id="parent-page-help-title-e3">
          <LeftTitleRectangularIconButton
            buttonWidth={15}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Instagram"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              // Linking.openURL("https://www.instagram.com/chimple_learning/");
              // window.open(
              //   "https://www.instagram.com/chimple_learning/",
              //   "_system"
              // );
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton>
          <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Facebook"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              window.open("https://www.facebook.com/chimple/", "_system");
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton>
          <LeftTitleRectangularIconButton
            buttonWidth={20}
            buttonHeight={7}
            iconSrc={"assets/icons/favicon.png"}
            name={"Twiter"}
            isButtonEnable={true}
            onHeaderIconClick={() => {
              console.log("Value clicked");
              window.open("https://twitter.com/chimple_org/", "_system");
              // if (currentHeader != element.headerList) {
              //   onHeaderIconClick(element.headerList);
              // }
            }}
          ></LeftTitleRectangularIconButton>
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
