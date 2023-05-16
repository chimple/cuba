import { IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { APP_LANG, PAGES } from "../common/constants";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import TextBox from "../components/TextBox";
import React from "react";
import Loading from "../components/Loading";
import { ConfirmationResult, RecaptchaVerifier, getAuth } from "@firebase/auth";
import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

const Login: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+919553642967"); // Example: "+12133734253".
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier>();
  const [phoneNumberSigninRes, setPhoneNumberSigninRes] = useState<
    ConfirmationResult | SignInWithPhoneNumberResult
  >();

  const authInstance = ServiceConfig.getI().authHandler;

  useEffect(() => {
    const authHandler = ServiceConfig.getI().authHandler;
    authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
      const appLang = localStorage.getItem(APP_LANG);
      console.log(
        "appLang",
        appLang,
        isUserLoggedIn,
        isUserLoggedIn && appLang != undefined
      );

      if (appLang == undefined) {
        console.log("navigating to app lang");
        history.replace(PAGES.APP_LANG_SELECTION);
      }

      if (isUserLoggedIn) {
        console.log("navigating to app lang");
        history.replace(PAGES.HOME);
      }
      // else {
      //   console.log("navigating to home");
      //   history.replace(PAGES.HOME);
      // }
    });
    if (!recaptchaVerifier && !Capacitor.isNativePlatform()) {
      // Note: The 'recaptcha-container' must be rendered by this point, or
      // else Firebase throws 'auth/argument-error'
      const auth = getAuth();
      
      setTimeout(() => {
        const rv = new RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" },
          auth
        );
        setRecaptchaVerifier(rv);
      }, 2000);
    }
  }, [recaptchaVerifier]);

  const onPhoneNumberSubmit = async () => {
    setIsLoading(true);
    let authRes = await authInstance.phoneNumberSignIn(
      phoneNumber,
      recaptchaVerifier
    );
    console.log("verificationIdRes", authRes?.verificationId);

    if (authRes) {
      setPhoneNumberSigninRes(authRes);
      setShowVerification(true);
      setIsLoading(false);
    } else {
      console.log("Phone Number signin Failed");
      alert("Phone Number signin Failed");
    }
  };

  const onVerificationCodeSubmit = async () => {
    setIsLoading(true);
    const res = await authInstance.proceedWithVerificationCode(
      phoneNumberSigninRes,
      verificationCode
    );
    console.log("login res", res);

    if (res) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
      console.log("Verification Failed");
      alert("Verification Failed");
    }
  };

  return (
    <IonPage id="login-screen">
      {!isLoading ? (
        <div>
          <img
            id="login-chimple-logo"
            alt="Chimple Brand Logo"
            src="assets/icons/ChimpleBrandLogo.svg"
          />
          <div id="chimple-brand-text1">Welcome to Chimple!</div>
          <p id="chimple-brand-text2">Discovering the joy of learning with</p>
          <p id="chimple-brand-text2">
            Chimple- where curiosity meets education!
          </p>
          <div id="chimple-brand-text2">
            <br />
          </div>
          <div id="recaptcha-container" />
          {!showVerification ? (
            <div>
              <div>
                <div id="login-text-box">
                  <TextBox
                    inputText={"Enter your Phone Number"}
                    inputType={"tel"}
                    maxLength={10}
                    onChange={(input) => {
                      if (input.detail.value) {
                        setPhoneNumber("+91" + input.detail.value);
                        console.log("+91" + input.detail.value);
                      }
                    }}
                  ></TextBox>
                  <div id="recaptcha-container" />
                </div>

                <div
                  id="login-continue-button"
                  onClick={() => {
                    // recaptchaVerifier.render();
                    onPhoneNumberSubmit();
                    // history.push(PAGES.PARENT);
                  }}
                >
                  Sent the OTP
                </div>
              </div>
              <div id="Google-horizontal-line"></div>
              <div id="Google-horizontal-line2"></div>
              <div id="login-google-icon-text"> Continue with Google</div>
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
                      history.replace(PAGES.DISPLAY_STUDENT);
                    } else {
                      setIsLoading(false);
                    }
                  } catch (error) {
                    setIsLoading(false);
                    console.log("error", error);
                  }
                }}
              />
              <div id="recaptcha-container" />
            </div>
          ) : !showNameInput ? (
            <div>
              <div id="login-text-box">
                <TextBox
                  inputText={"Enter 6 Digit Code"}
                  inputType={"tel"}
                  maxLength={6}
                  onChange={(input) => {
                    if (input.detail.value) {
                      setVerificationCode("" + input.detail.value);
                      console.log("" + input.detail.value);
                    }
                  }}
                ></TextBox>
                <div id="recaptcha-container" />
              </div>
              <div
                id="login-continue-button"
                onClick={() => {
                  onVerificationCodeSubmit();
                  // history.push(PAGES.PARENT);
                }}
              >
                Get Started
              </div>
              <div id="recaptcha-container" />
            </div>
          ) : (
            <div>
              <div id="login-text-box">
                <TextBox
                  inputText={"Enter Parent Name"}
                  inputType={"text"}
                  maxLength={54}
                  onChange={(input) => {
                    if (input.detail.value) {
                      setVerificationCode("" + input.detail.value);
                      console.log("" + input.detail.value);
                    }
                  }}
                ></TextBox>
                <div id="recaptcha-container" />
              </div>
              <div
                id="login-continue-button"
                onClick={() => {
                  // onVerificationCodeSubmit();
                  history.push(PAGES.DISPLAY_STUDENT);
                }}
              >
                Enter Chimple APP
              </div>
              <div id="recaptcha-container" />
            </div>
          )}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
      {/* </IonInfiniteScrollContent> */}
      {/* </IonInfiniteScroll> */}
    </IonPage>
  );
};

export default Login;
