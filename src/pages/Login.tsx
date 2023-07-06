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
import { init, t } from "i18next";
import { Util } from "../utility/util";
import User from "../models/user";

declare global {
  // eslint-disable-next-line no-var
  var recaptchaVerifier: any;
}

const Login: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<any>(""); // Example: "+919553642967".
  //const [parentName, setParentName] = useState<any>("");

  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier>();
  const [phoneNumberSigninRes, setPhoneNumberSigninRes] =
    useState<ConfirmationResult>();
  const [userData, setUserData] = useState<any>();

  const authInstance = ServiceConfig.getI().authHandler;
  const countryCode = "+91";
  // let phoneNumber: string = "";
  // let verificationCode: string = "";
  let displayName: string = "";
  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [currentStudent, setStudent] = useState<User>();
  const Buttoncolors = {
    Default: "grey",
    Valid: "yellowgreen",
  };

  const otpBtnRef = useRef<any>();
  const getOtpBtnRef = useRef<any>();
  const parentNameRef = useRef<any>();
  const phoneNumberErrorRef = useRef<any>();

  useEffect(() => {
    init();
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

      async function init() {
        const currentStudent = await Util.getCurrentStudent();
        if (!currentStudent) {
          history.replace(PAGES.HOME);
          return;
        }

        setStudent(currentStudent);
      }

      if (appLang == undefined) {
        console.log("navigating to app lang");
        history.replace(PAGES.APP_LANG_SELECTION);
      }

      if (currentStudent) {
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
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      if (phoneNumber.length != 10) {
        setSpinnerLoading(false);
        alert("Phone Number Invalid " + phoneNumber);
        return;
      }
      console.log("window.recaptchaVerifier", window.recaptchaVerifier);

      // setEnabled(true);
      console.log(
        "onPhoneNumberSubmit called ",
        phoneNumberWithCountryCode,
        recaptchaVerifier
      );
      let authRes = await authInstance.phoneNumberSignIn(
        phoneNumberWithCountryCode,
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
        console.log("Phone Number signin Failed ");
        setSpinnerLoading(false);
        alert("Phone Number signin Failed " + authRes);
      }
    } catch (error) {
      console.log("Phone Number signin Failed ");
      setSpinnerLoading(false);
      alert("Phone Number signin Failed " + error);
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
      if (!res) {
        setIsLoading(false);
        console.log("Verification Failed");
        alert("Something went wrong Verification Failed");
        return;
      }
      setUserData(res.user);
      console.log("login User Data ", res, userData);

      if (res.isUserExist) {
        setIsLoading(false);
        history.replace(PAGES.SELECT_MODE);
        // setShowNameInput(true);
      } else if (!res.isUserExist) {
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
        <div >
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
            <div >
              <div id="login-screen-input">
                <div id="login-text-box">
                  <div id="login-text">
                    <TextBox
                      inputText={t("Enter Mobile Number (10-digit)")}
                      inputType={"tel"}
                      maxLength={10}
                      inputValue={phoneNumber}
                      onChange={(input) => {
                        if (input.detail.value) {
                          setPhoneNumber(input.detail.value);
                          console.log(countryCode + input.detail.value);

                          let loginBtnBgColor = otpBtnRef.current.style.backgroundColor;
                          if (input.detail.value.length === 10) {
                            otpBtnRef.current.style.backgroundColor = Buttoncolors.Valid;
                            phoneNumberErrorRef.current.style.display = "none";
                          }

                          else {
                            if (loginBtnBgColor === Buttoncolors.Valid) {
                              otpBtnRef.current.style.backgroundColor = Buttoncolors.Default;
                            }

                          }

                        }
                        else {
                          setPhoneNumber("");
                          console.log(countryCode + input.detail.value);

                        }

                      }}

                    ></TextBox>
                  </div>
                  <p ref={phoneNumberErrorRef} style={{ display: "none" }} className="error-message">Please Enter 10 digit Mobile Number</p>
                </div>
                <div id="recaptcha-container" />
                <div
                  ref={otpBtnRef}

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

                    setSpinnerLoading(false);
                    if (phoneNumber.length === 10) {
                      onPhoneNumberSubmit();

                    }
                    else {
                      phoneNumberErrorRef.current.style.display = "block";
                    }
                    // setShowVerification(true);
                    // setSpinnerLoading(false);
                  }}
                >
                  {t("Send OTP")}
                </div>
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
              <div id="login-google-icon-text">{t("Continue with Google")}</div>
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
                      // history.replace(PAGES.DISPLAY_STUDENT);
                      history.replace(PAGES.SELECT_MODE);
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
                      setVerificationCode(input.detail.value);
                      console.log(input.detail.value);
                      let otpBtnBgColor = getOtpBtnRef.current.style.backgroundColor;
                      if (input.detail.value.length === 6) {
                        getOtpBtnRef.current.style.backgroundColor = Buttoncolors.Valid;
                      }
                      else {
                        if (otpBtnBgColor === Buttoncolors.Valid) {
                          getOtpBtnRef.current.style.backgroundColor =
                            Buttoncolors.Default;
                        }
                      }
                    }
                    else {
                      setVerificationCode("");
                      console.log(input.detail.value);
                    }
                  }}
                ></TextBox>
              </div>
              <div
                ref={getOtpBtnRef}
                id="login-continue-button"
                onClick={() => {
                  if (verificationCode.length === 6) {
                    onVerificationCodeSubmit();
                  }
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
                      console.log(""+ input.detail.value);
                     // setParentName(input.detail.value);

                    }
                  }}
                ></TextBox>
              </div>
              <div
                ref={parentNameRef}
                id="login-continue-button"
                onClick={async () => {
                  let res = await FirebaseAuth.i.createPhoneAuthUser(
                    userData,
                    phoneNumberSigninRes
                  );
                  if (res) {
                    // history.push(PAGES.DISPLAY_STUDENT);
                    history.replace(PAGES.SELECT_MODE);
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
