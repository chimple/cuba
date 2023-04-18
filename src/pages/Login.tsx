import {
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
} from "@ionic/react";
import { useEffect, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { PAGES } from "../common/constants";
import Auth from "../models/auth";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import TextBox from "../components/TextBox";
import React from "react";
import Loading from "../components/Loading";
import RectangularIconButton from "../components/parent/RectangularIconButton";
import Parent from "./Parent";
// import { Platform } from "react-native";

const Login: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const authHandler = ServiceConfig.getI().authHandler;
    authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
      if (isUserLoggedIn) history.replace(PAGES.HOME);
    });
  }, []);
  console.log(
    "Login page",
    Capacitor.getPlatform(),
    Capacitor.getPlatform() === "android"
  );
  return (
    <IonPage id="login-screen">
      <IonContent fullscreen scrollY={true}>
        {/* <IonInfiniteScroll> */}
        {/* <IonInfiniteScrollContent> */}

        {!isLoading ? (
          <div>
            <img
              id="login-chimple-logo"
              alt="Chimple Brand Logo"
              // src="assets/Monk.gif"
              src="assets/icons/ChimpleBrandLogo.svg"
            />
            <div id="login-page-parent-button">
              {/* <RectangularIconButton
                buttonWidth="20%"
                buttonHeight="10%"
                iconSrc="assets/icons/ChimpleBrandLogo.svg"
                rectangularIcon={
                  <img
                    id="login-chimple-logo"
                    alt="Chimple Brand Logo"
                    // src="assets/Monk.gif"
                    src="assets/icons/ChimpleBrandLogo.svg"
                  />
                }
                name="Parent"
              /> */}
            </div>
            <div id="chimple-brand-text1">Welcome to Chimple!</div>
            <p id="chimple-brand-text2">
              Discovering the joy of learning with Chimple- where curiosity
              meets education!
            </p>
            <TextBox
              inputText={"Enter your Phone Number"}
              inputType={"number"}
            ></TextBox>
            <div
              id="login-continue-button"
              // onClick={() => {
              //   history.push(PAGES.PARENT);
              //   // if (window.location.pathname === "/search") {
              //   //   return <Parent />;
              //   // }
              // }}
            >
              Continue
            </div>
            <div id="login-google-icon-text">Continue with Google</div>
            <img
              id="login-google-icon"
              alt="Google Icon"
              src="assets/icons/Google Icon.png"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  console.log("isLoading ", isLoading);
                  const _authHandler = ServiceConfig.getI().authHandler;
                  const result: boolean = await _authHandler.googleSign();
                  console.log(
                    "🚀 ~ file: Login.tsx:44 ~ onClick={ ~ result:",
                    result
                  );
                  if (result) {
                    setIsLoading(false);
                    console.log("isLoading ", isLoading);
                    history.replace(PAGES.HOME);
                  } else {
                    setIsLoading(false);
                  }
                } catch (error) {
                  setIsLoading(false);
                  console.log("error", error);
                }
              }}
            />
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
        {/* </IonInfiniteScrollContent> */}
        {/* </IonInfiniteScroll> */}
      </IonContent>
    </IonPage>
  );
};

export default Login;
