import { IonLoading, IonPage } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { LANGUAGE, PAGES } from "../common/constants";
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
import BackButton from "../components/common/BackButton";

declare global {
  // eslint-disable-next-line no-var
  var recaptchaVerifier: any;
}

const Login: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sentOtpLoading, setSentOtpLoading] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [showBackButton, setShowBackButton] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<any>("");
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
  const [counter, setCounter] = useState(59);
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [showResendOtp, setShowResendOtp] = useState<boolean>(false);
  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInvalidCode, setIsInvalidCode] = useState<{
    isInvalidCode: boolean;
    isInvalidCodeLength: boolean;
  }>();
  const Buttoncolors = {
    Default: "grey",
    Valid: "yellowgreen",
  };
  const [currentButtonColor, setCurrentButtonColor] = useState<string>(
    phoneNumber.length === 10 ? Buttoncolors.Valid : Buttoncolors.Default
  );
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [currentStudent, setStudent] = useState<User>();

  const otpBtnRef = useRef<any>();
  const getOtpBtnRef = useRef<any>();
  const parentNameRef = useRef<any>();
  const phoneNumberErrorRef = useRef<any>();
  let verificationCodeMessageFlags = {
    isInvalidCode: false,
    isInvalidCodeLength: false,
  };
  useEffect(() => {
    init();
    setIsLoading(true);
    setIsInvalidCode(verificationCodeMessageFlags);

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
      const appLang = localStorage.getItem(LANGUAGE);
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
  React.useEffect(() => {
    if (counter <= 0 && showTimer) {
      setShowResendOtp(true);
    }
    showTimer && counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
  }, [counter, showTimer]);

  const onPhoneNumberSubmit = async () => {
    try {
      setSentOtpLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      if (phoneNumber.length != 10) {
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
      console.log("phoneNumberSignIn authRes", JSON.stringify(authRes));
      if (authRes.user) {
        setIsLoading(false);
        history.replace(PAGES.SELECT_MODE);
        // setShowNameInput(true);
      }
      console.log("verificationIdRes", authRes?.verificationId);
      // setEnabled(false);

      if (authRes) {
        setPhoneNumberSigninRes(authRes);
        setSentOtpLoading(false);
        setShowVerification(true);
        setCounter(59);
        setShowBackButton(true);
        setSpinnerLoading(false);


      } else {
        console.log("Phone Number signin Failed ");
        setSpinnerLoading(false);
        setSentOtpLoading(false);
        alert("Phone Number signin Failed " + authRes);
      }
    } catch (error) {
      console.log("Phone Number signin Failed ");
      setSpinnerLoading(false);
      setSentOtpLoading(false);
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
        verificationCode.trim()
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
        let phoneAuthResult = await FirebaseAuth.i.createPhoneAuthUser(
          res.user
        );
        if (phoneAuthResult) {
          // history.push(PAGES.DISPLAY_STUDENT);
          history.replace(PAGES.SELECT_MODE);
        }
      } else {
        setIsLoading(false);

        console.log("Verification Failed");
        //alert("Verification Failed");
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Verification Failed", error);
      //alert("Please Enter Valid Verification Code");
      setIsInvalidCode({
        isInvalidCode: true,
        isInvalidCodeLength: false,
      });
    }
  };

  function startResendOtpCounter() {
    !showTimer && setShowTimer(true);
    return true;
  }

  async function resendOtpHandler() {

    try {
      setSentOtpLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      setRecaptchaVerifier(undefined);
      let authRes = await authInstance.phoneNumberSignIn(
        phoneNumberWithCountryCode,
        recaptchaVerifier
      );
      if (authRes) {
        setPhoneNumberSigninRes(authRes);
        console.log("Resend Otp Sucessfull");
        setSentOtpLoading(false);
        setShowResendOtp(false);
        setCounter(59);
        setVerificationCode("");
      }
      else {
        setSentOtpLoading(false);
        console.log("Resend Otp failed");

      }
    } catch (error) {
      console.log("Resend Otp Failed With Error " + error);
      setSentOtpLoading(false);
      alert("Resend Otp Failed " + error);
      recaptchaVerifier!.clear();
    }
  }

  return (
    <IonPage id="login-screen">
      {!!showBackButton && (
        <div className="login-class-header">
          <BackButton
            onClicked={() => {
              setShowVerification(false);
              setShowBackButton(false);
              setCurrentButtonColor(Buttoncolors.Valid);
              setVerificationCode("");
              setShowResendOtp(false);
              setShowTimer(false);
              setIsInvalidCode({
                isInvalidCode: false,
                isInvalidCodeLength: false
              });

            }}
          />
        </div>
      )}
      <div className={"header " + isInputFocus ? "scroll-header" : ""}>
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
                <div id="login-screen-input">
                  <div id="login-text-box">
                    <div id="login-text">
                      <TextBox
                        inputText={t("Enter Mobile Number (10-digit)")}
                        inputType={"tel"}
                        maxLength={10}
                        inputValue={phoneNumber}
                        onChange={(input) => {
                          if (input.target.value) {
                            setPhoneNumber(input.target.value);
                            console.log(countryCode + input.target.value);

                            let loginBtnBgColor = currentButtonColor;
                            if (input.target.value.length === 10) {
                              console.log(phoneNumber);
                              setCurrentButtonColor(Buttoncolors.Valid);
                              phoneNumberErrorRef.current.style.display =
                                "none";
                            } else {
                              if (loginBtnBgColor === Buttoncolors.Valid) {
                                setCurrentButtonColor(Buttoncolors.Default);
                              }
                            }
                          } else {
                            setPhoneNumber("");
                            console.log(countryCode + input.target.value);
                          }
                        }}
                      ></TextBox>
                    </div>

                    <p
                      ref={phoneNumberErrorRef}
                      style={{ display: "none" }}
                      className="login-error-message"
                    >
                     {t("Please Enter 10 digit Mobile Number")}
                    </p>
                  </div>
                  <div id="recaptcha-container" />
                  <div
                    ref={otpBtnRef}
                    id="login-continue-button"
                    style={{ backgroundColor: currentButtonColor }}
                    onClick={async () => {
                      console.log(
                        "if (!recaptchaVerifier && !Capacitor.isNativePlatform()) called",
                        recaptchaVerifier
                      );

                      setSpinnerLoading(true);
                      if (phoneNumber.length === 10) {
                        await onPhoneNumberSubmit();
                      } else {
                        phoneNumberErrorRef.current.style.display = "block";
                      }
                      // setShowVerification(true);
                      setSpinnerLoading(false);
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
                <div id="login-google-icon-text">
                  {t("Continue with Google")}
                </div>
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
            ) : !showNameInput && startResendOtpCounter() ? (
              <div>
                <p id="login-otp-sent">{t("Otp Sent To The")}{countryCode + phoneNumber}</p>
                <div id="login-text-box">
                  <div>
                    <TextBox
                      inputText={"Enter 6 Digit Code"}
                      inputType={"tel"}
                      maxLength={6}
                      inputValue={verificationCode.trim()}
                      onChange={(input) => {
                        if (input.target.value) {
                          setVerificationCode(input.target.value);
                          console.log(input.target.value);
                          let otpBtnBgColor =
                            getOtpBtnRef.current.style.backgroundColor;
                          if (input.target.value.length === 6) {
                            getOtpBtnRef.current.style.backgroundColor =
                              Buttoncolors.Valid;
                            setIsInvalidCode({
                              isInvalidCode: false,
                              isInvalidCodeLength: false,
                            });
                          } else {
                            if (otpBtnBgColor === Buttoncolors.Valid) {
                              getOtpBtnRef.current.style.backgroundColor =
                                Buttoncolors.Default;
                            }
                          }
                        } else {
                          setVerificationCode("");
                          console.log(input.target.value);
                        }
                      }}
                    ></TextBox>
                  </div>
                  {isInvalidCode?.isInvalidCodeLength &&
                    <p className="login-verification-error-message">{t("Please Enter 6 Digit Code")}</p>}
                  {isInvalidCode?.isInvalidCode &&
                    <p className="login-verification-error-message">{t("Please Enter Valid Code")}</p>}
                </div>
                <div ref={getOtpBtnRef} id="login-otp-button">
                  <div
                    onClick={() => {
                      if (verificationCode.length === 6) {
                        onVerificationCodeSubmit();
                        setVerificationCode("");
                      } else if (verificationCode.length <= 6) {
                        setVerificationCode("");
                        setIsInvalidCode({
                          isInvalidCode: false,
                          isInvalidCodeLength: true,
                        });
                      }
                      // setIsLoading(false);
                      // setShowNameInput(true);
                      // history.push(PAGES.PARENT);
                      else {
                        onVerificationCodeSubmit();
                      }
                    }}
                  >
                    <div>Get Started</div>
                  </div>
                  <div id="login-resend-otp">
                    <div>
                      <span style={!showResendOtp ? { color: "red" } : { color: "grey" }} id="login-time-remaining">{t("Time Remaining :")} {counter}</span>
                    </div>
                    <span id="login-resend-otp-text" onClick={resendOtpHandler} style={showResendOtp ? { color: "green" } : { color: "grey" }}>{t("Resend OTP")}</span>
                  </div>
                </div>
                {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
              </div>
            ) : (
              <div>
                {/* <div id="login-text-box">
                <TextBox
                  inputText={"Enter Parent Name"}
                  inputType={"text"}
                  maxLength={54}
                  inputValue={displayName}
                  onChange={(input) => {
                    if (input.detail.value) {
                      console.log("" + input.detail.value);
                      // setParentName(input.detail.value);
                    }
                  }}
                ></TextBox>
              </div> */}
                {/* <div
                // ref={parentNameRef}
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
              </div> */}
                {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
      <Loading isLoading={isLoading || sentOtpLoading} />
    </IonPage>
  );
};

export default Login;
