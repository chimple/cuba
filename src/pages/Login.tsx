import { IonLoading, IonPage } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { APP_LANG, PAGES } from "../common/constants";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import TextBox from "../components/TextBox";
import React from "react";
import Loading from "../components/Loading";
import { ConfirmationResult, RecaptchaVerifier, getAuth } from "@firebase/auth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";
// import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
// import { setEnabled } from "@red-mobile/cordova-plugin-background-mode/www/background-mode";
import { FirebaseAuth } from "../services/auth/FirebaseAuth";
import { Keyboard } from "@capacitor/keyboard";
import { initializeApp } from "firebase/app";
import { t } from "i18next";
import { Util } from "../utility/util";

declare global {
  // eslint-disable-next-line no-var
  var recaptchaVerifier: any;
}

const Login: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  // const [verificationCode, setVerificationCode] = useState<string>("");
  // const [phoneNumber, setPhoneNumber] = useState("+91"); // Example: "+919553642967".
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier>();
  const [phoneNumberSigninRes, setPhoneNumberSigninRes] = useState<
    ConfirmationResult 
  >();
  const [userData, setUserData] = useState<any>("");

  const authInstance = ServiceConfig.getI().authHandler;
  const countryCode = "+91";
  let phoneNumber: string = "";
  let verificationCode: string = "";
  let displayName: string = "";
  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        console.log("info", JSON.stringify(info));
        setIsInputFocus(true);
        setTimeout(() => {
          //@ts-ignore
          scollToRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }, 50);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setIsInputFocus(false);
      });
    }
    const authHandler = ServiceConfig.getI().authHandler;
    authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
      const apiHandler = ServiceConfig.getI().apiHandler;
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

      if (Util.getCurrentStudent()) {
        setIsLoading(false);
        history.replace(PAGES.DISPLAY_STUDENT);
      }
      if (isUserLoggedIn) {
        console.log("navigating to app lang");
        setIsLoading(false);
        history.replace(PAGES.HOME);
      }
      setIsLoading(false);
    });
    if (!recaptchaVerifier && !Capacitor.isNativePlatform()) {
      // Note: The 'recaptcha-container' must be rendered by this point, or
      // else Firebase throws 'auth/argument-error'
      const auth = getAuth();
      console.log("auth in recaptcha ", auth);

      const rv = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("// reCAPTCHA solved, allow signInWithPhoneNumber.");
          },
          "expired-callback": () => {
            // Reset reCAPTCHA?
            console.log("// Reset reCAPTCHA?");
          },
        },
        auth
      );
      console.log("setRecaptchaVerifier(rv);", rv);

      setRecaptchaVerifier(rv);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" },
          auth
        );
      }
    }
  }, [recaptchaVerifier]);

  const onPhoneNumberSubmit = async () => {
    // setIsLoading(true);
    try {
      phoneNumber = countryCode + phoneNumber;
      if (phoneNumber.length <= 10) {
        setSpinnerLoading(false);
        alert("Phone Number Invalid " + phoneNumber);
        return;
      }
      console.log("window.recaptchaVerifier", window.recaptchaVerifier);

      // setEnabled(true);
      console.log(
        "onPhoneNumberSubmit called ",
        phoneNumber,
        recaptchaVerifier
      );
      let authRes = await authInstance.phoneNumberSignIn(
        phoneNumber,
        recaptchaVerifier
      );
      console.log("verificationIdRes", authRes?.verificationId);
      // setEnabled(false);

      if (authRes) {
        setPhoneNumberSigninRes(authRes);
        setShowVerification(true);
        setSpinnerLoading(false);
        // setIsLoading(false);
      } else {
        console.log("Phone Number signin Failed");
        setSpinnerLoading(false);
        alert("Phone Number signin Failed" + authRes);
      }
    } catch (error) {
      console.log("Phone Number signin Failed");
      setSpinnerLoading(false);
      alert("Phone Number signin Failed" + error);
      console.log(
        "window.recaptchaVerifier",
        // window.recaptchaVerifier,
        recaptchaVerifier!
      );

      // //@ts-ignore
      recaptchaVerifier!.clear();
      // //@ts-ignore
      // window.recaptchaVerifier.clear();
    }
  };

  const onVerificationCodeSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await authInstance.proceedWithVerificationCode(
        phoneNumberSigninRes,
        verificationCode
      );
      console.log("login User Data ", res, userData);
      setUserData(res);
      console.log("login User Data ", res, userData);

      if (res) {
        setIsLoading(false);
        setShowNameInput(true);
      } else {
        setIsLoading(false);
        console.log("Verification Failed");
        alert("Verification Failed");
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Verification Failed", error);
      alert("Verification Failed" + error);
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
          <div id="chimple-brand-text1">{t("Welcome to Chimple!")}</div>
          <p id="chimple-brand-text2">
            {t("Discovering the joy of learning with")}
          </p>
          <p id="chimple-brand-text2">
            {t("Chimple- where curiosity meets education!")}
          </p>
          <div id="chimple-brand-text2">
            <br />
          </div>
          {!showVerification ? (
            <div>
              <div id="login-text-box">
                <TextBox
                  inputText={t("Enter your Phone Number")}
                  inputType={"tel"}
                  maxLength={10}
                  inputValue={phoneNumber}
                  onChange={(input) => {
                    if (input.detail.value) {
                      // setPhoneNumber(countryCode + input.detail.value);
                      phoneNumber = input.detail.value;
                      console.log(countryCode + phoneNumber);
                    }
                  }}
                ></TextBox>
              </div>

              <div id="recaptcha-container" />
              <div
                id="login-continue-button"
                onClick={() => {
                  // //@ts-ignore
                  // window.recaptchaVerifier = new RecaptchaVerifier(
                  //   "sign-in-button",
                  //   {
                  //     size: "normal",
                  //     callback: (response) => {
                  //       console.log("prepared phone auth process");
                  //     },
                  //   },
                  //   getAuth()
                  // );
                  console.log(
                    "if (!recaptchaVerifier && !Capacitor.isNativePlatform()) called",
                    recaptchaVerifier
                  );
                  setSpinnerLoading(true);
                  onPhoneNumberSubmit();
                  // setShowVerification(true);
                  // setSpinnerLoading(false);
                }}
              >
                {t("Sent the OTP")}
              </div>
              {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
              <IonLoading
                id="custom-loading"
                // trigger="open-loading"
                message="Loading"
                // duration={3000}
                isOpen={spinnerLoading}
              />

              <div id="Google-horizontal-line"></div>
              <div id="Google-horizontal-line2"></div>
              <div id="login-google-icon-text"> {t("Continue with Google")}</div>
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
            </div>
          ) : !showNameInput ? (
            <div>
              <div id="login-text-box">
                <TextBox
                  inputText={"Enter 6 Digit Code"}
                  inputType={"tel"}
                  maxLength={6}
                  inputValue={verificationCode}
                  onChange={(input) => {
                    if (input.detail.value) {
                      // setVerificationCode("" + input.detail.value);
                      verificationCode = input.detail.value;
                      console.log("" + input.detail.value);
                    }
                  }}
                ></TextBox>
              </div>
              <div
                id="login-continue-button"
                onClick={() => {
                  onVerificationCodeSubmit();
                  // setIsLoading(false);
                  // setShowNameInput(true);
                  // history.push(PAGES.PARENT);
                }}
              >
                Get Started
              </div>
              {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
            </div>
          ) : (
            <div>
              <div id="login-text-box">
                <TextBox
                  inputText={"Enter Parent Name"}
                  inputType={"text"}
                  maxLength={54}
                  inputValue={displayName}
                  onChange={(input) => {
                    if (input.detail.value) {
                      console.log("" + input.detail.value);
                      displayName = input.detail.value;
                    }
                  }}
                ></TextBox>
              </div>
              <div
                id="login-continue-button"
                onClick={async () => {
                  setUserData((userData.displayName = displayName));
                  let res = await FirebaseAuth.i.createPhoneAuthUser(
                    userData,
                    phoneNumberSigninRes
                  );
                  if (res) {
                    history.push(PAGES.DISPLAY_STUDENT);
                  }
                }}
              >
                Enter Chimple APP
              </div>
              {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
            </div>
          )}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Login;
function setIsInputFocus(arg0: boolean) {
  throw new Error("Function not implemented.");
}
