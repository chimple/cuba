import { IonLoading, IonPage } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import {
  APP_NAME,
  AT_SYMBOL_RESTRICTION,
  CURRENT_USER,
  DOMAIN,
  LANGUAGE,
  NUMBER_REGEX,
  PAGES,
} from "../common/constants";
import { Capacitor, registerPlugin } from "@capacitor/core";
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
import { Toast } from "@capacitor/toast";
import { title } from "process";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import {
  IoCallOutline,
  IoLockClosedOutline,
  IoReaderOutline,
  IoSchool,
  IoSchoolOutline,
} from "react-icons/io5";
import { once } from "events";
import PhoneNumberPopup from "../components/login/PhoneNumberPopup";

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
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPromptNumbers, setIsPromptNumbers] = useState<boolean>(false);
  let verificationCodeMessageFlags = {
    isInvalidCode: false,
    isInvalidCodeLength: false,
  };
  const [allowSubmittingOtpCounter, setAllowSubmittingOtpCounter] =
    useState<number>(0);
  const [disableOtpButtonIfSameNumber, setDisableOtpButtonIfSameNumber] =
    useState<boolean>(false);
  const [currentPhone, setCurrentPhone] = useState<any>();
  const [title, setTitle] = React.useState("");
  //let errorMessage;
  const [errorMessage, setErrorMessage] = useState<string | null>();
  const [studentId, setStudentId] = useState<string>("");
  const [studentPassword, setStudenPassword] = useState<string>("");
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [showStudentCredentialtLogin, setStudentCredentialLogin] =
    useState<boolean>(false);
  const [promptPhonNumbers, setPromptPhonNumbers] = useState<Array<string>>([]);
  // const [showPhoneNumberPopUp, setShowPhoneNumberPopUp] =
  //   useState<boolean>(false);
  const PortPlugin = registerPlugin<any>("Port");

  useEffect(() => {
    initNumberSelectedListner();
  }, []);
  useEffect(() => {
    if (phoneNumber.length == 10) {
      initSmsListner();
    }
  }, [phoneNumber]);
  useEffect(() => {
    // init();
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
        setIsLoading(false);
        history.replace(PAGES.SELECT_MODE);
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

  const retriewPhoneNumber = async () => {
    const phoneNumber = await PortPlugin.numberRetrieve();
    if (phoneNumber.number) {
      phoneNumberErrorRef.current.style.display = "none";
      setPhoneNumber(phoneNumber.number.toString());
      setCurrentButtonColor(Buttoncolors.Valid);
    }
  };

  const otpEventListener = async (event: Event) => {
    const data = await PortPlugin.otpRetrieve();

    if (data.otp) {
      setVerificationCode(data.otp.toString());
      onVerificationCodeSubmit(data.otp.toString());
      setIsInvalidCode({
        isInvalidCode: false,
        isInvalidCodeLength: false,
      });
    }
    document.removeEventListener("otpReceived", otpEventListener);
  };
  const isPhoneNumberEventListener = async (event: Event) => {
    retriewPhoneNumber();
    document.removeEventListener(
      "isPhoneNumberSelected",
      isPhoneNumberEventListener
    );
  };
  const initNumberSelectedListner = async () => {
    document.addEventListener(
      "isPhoneNumberSelected",
      isPhoneNumberEventListener,
      {
        once: true,
      }
    );
  };
  const initSmsListner = async () => {
    document.addEventListener("otpReceived", otpEventListener, { once: true });
  };
  React.useEffect(() => {
    if (counter <= 0 && showTimer) {
      setShowResendOtp(true);
    }
    showTimer && counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
  }, [counter, showTimer]);
  useEffect(() => {
    disableOtpButtonIfSameNumber &&
      allowSubmittingOtpCounter > 0 &&
      setTimeout(
        () => setAllowSubmittingOtpCounter(allowSubmittingOtpCounter - 1),
        1000
      );
    let str = t(`Send OTP button will be enabled in x seconds`).replace(
      `x`,
      allowSubmittingOtpCounter.toString()
    );
    setTitle(str);
  }, [allowSubmittingOtpCounter]);

  const onPhoneNumberSubmit = async (phoneNumber) => {
    try {
      if (currentPhone == phoneNumber) {
        if (allowSubmittingOtpCounter > 0) {
          // await Toast.show({
          //   text: title,
          //   duration: "long",
          // });
          presentToast({
            message: title,
            color: "light",
            duration: 3000,
            position: "bottom",
            buttons: [
              {
                text: "Dismiss",
                role: "cancel",
              },
            ],
          });
          return;
        }
      } else {
        setDisableOtpButtonIfSameNumber(false);
        setAllowSubmittingOtpCounter(0);
      }
      console.log("");
      setSentOtpLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      if (phoneNumber.length != 10) {
        setErrorMessage(t("Incorrect phone number format"));
        //alert("Phone Number Invalid " + phoneNumber);
        return;
      }
      console.log("window.recaptchaVerifier", window.recaptchaVerifier);

      // setEnabled(true);
      let response = await authInstance.msg91OtpGenerate(
        phoneNumberWithCountryCode,
        APP_NAME
      );
      if (response) {
        setShowBackButton(true);
        setSpinnerLoading(false);
        setSentOtpLoading(false);
        setCounter(59);
        setShowVerification(true);
      } else {
        presentToast({
          message: t("Please wait 60 seconds before retrying"),
          color: "light",
          duration: 3000,
          position: "bottom",
          buttons: [
            {
              text: "Dismiss",
              role: "cancel",
            },
          ],
        });
        setSpinnerLoading(false);
        setSentOtpLoading(false);
      }
      // let authRes = await authInstance.phoneNumberSignIn(
      //   phoneNumberWithCountryCode,
      //   recaptchaVerifier
      // );
      // console.log("phoneNumberSignIn authRes", JSON.stringify(authRes));
      // if (authRes.user) {
      //   setIsLoading(false);
      //   history.replace(PAGES.SELECT_MODE);
      //   // setShowNameInput(true);
      // }
      // console.log("verificationIdRes", authRes?.verificationId);
      // setEnabled(false);

      // if (authRes) {
      //   setPhoneNumberSigninRes(authRes);
      // setSentOtpLoading(false);
      //   setShowVerification(true);
      //   setCounter(59);
      //   setShowBackButton(true);
      //   setSpinnerLoading(false);
      // } else {
      //   console.log("Phone Number signin Failed ");
      //   setSpinnerLoading(false);
      //   setSentOtpLoading(false);
      //   setErrorMessage(
      //     t("Phone Number signin Failed. Please try again later")
      //   );
      //   //alert("Phone Number signin Failed " + authRes);
      // }
    } catch (error) {
      console.log("Phone Number signin Failed ");
      setSpinnerLoading(false);
      setSentOtpLoading(false);

      if (typeof error === "string") {
        // Handle the error as a string
        // errorMessage = "Phone Number signin Failed. Something went wrong. Please try again later.";

        if (
          error.includes("blocked all requests") ||
          error.includes("Timed out waiting for SMS")
        ) {
          setErrorMessage(
            t("Something went wrong. Please try again after some time.")
          );
        } else if (error.includes("E.164 format")) {
          setErrorMessage(t("Incorrect phone number format"));
        }
      } else {
        // Default error message for non-string errors
        setErrorMessage(
          t("Phone Number signin Failed. Please try again later.")
        );
      }

      console.log("window.recaptchaVerifier", recaptchaVerifier!);
      //@ts-ignore
      recaptchaVerifier!.clear();
      //@ts-ignore
      // window.recaptchaVerifier.clear();
    }
  };

  const onVerificationCodeSubmit = async (otp) => {
    try {
      setIsLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      const res = await authInstance.proceedWithVerificationCode(
        phoneNumberWithCountryCode,
        otp.trim()
      );
      console.log("login User Data ", res, userData);
      if (!res) {
        setIsLoading(false);
        console.log("Verification Failed");
        setErrorMessage(t("Something went wrong Verification Failed"));
        // alert("Something went wrong Verification Failed");
        return;
      }
      setUserData(res.user);
      console.log("login User Data ", res, userData);

      if (res.isUserExist) {
        setIsLoading(false);
        history.replace(PAGES.SELECT_MODE);
        localStorage.setItem(CURRENT_USER, JSON.stringify(res.user));
        console.log("isUserExist", localStorage.getItem(CURRENT_USER));

        // setShowNameInput(true);
      } else if (!res.isUserExist) {
        setIsLoading(false);
        let phoneAuthResult = await FirebaseAuth.i.createPhoneAuthUser(
          res.user
        );
        if (phoneAuthResult) {
          // history.push(PAGES.DISPLAY_STUDENT);
          history.replace(PAGES.SELECT_MODE);
          localStorage.setItem(CURRENT_USER, JSON.stringify(phoneAuthResult));
          console.log("new user", localStorage.getItem(CURRENT_USER));
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
      if (typeof error === "string") {
        if (error.includes("code-expired")) {
          setIsInvalidCode({
            isInvalidCode: false,
            isInvalidCodeLength: false,
          });
          setErrorMessage(
            t("Verification code has expired. Please request a new one.")
          );
        }
      }
    }
  };

  function startResendOtpCounter() {
    !showTimer && setShowTimer(true);
    return true;
  }

  async function resendOtpHandler() {
    try {
      if (!(counter <= 0)) {
        return;
      }
      setSentOtpLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      // setRecaptchaVerifier(undefined);
      let response = await authInstance.resendOtpMsg91(
        phoneNumberWithCountryCode
      );
      // let authRes = await authInstance.phoneNumberSignIn(
      //   phoneNumberWithCountryCode,
      //   recaptchaVerifier
      // );
      if (response) {
        // setPhoneNumberSigninRes(authRes);
        setSentOtpLoading(false);
        setShowResendOtp(false);
        setCounter(59);
        setVerificationCode("");
      } else {
        setSentOtpLoading(false);
        console.log("Resend Otp failed");
      }
    } catch (error) {
      console.log("Resend Otp Failed With Error " + error);
      setSentOtpLoading(false);
      //When Resend OTP Failed
      setErrorMessage(
        t("Resend Otp Failed!! Please try again after some time.")
      );
      //alert(t("Resend Otp Failed!! You have entered the OTP incorrectly many times. Please try again after some time."));
      recaptchaVerifier!.clear();
    }
  }

  const handleLoginWithStudentCredentials = async () => {
    setStudentCredentialLogin(false);
    try {
      setIsLoading(true);
      const _authHandler = ServiceConfig.getI().authHandler;
      const result: boolean = await _authHandler.loginWithEmailAndPassword(
        schoolCode + studentId + DOMAIN,
        studentPassword
      );
      if (result) {
        setIsLoading(false);
        history.replace(PAGES.SELECT_MODE);
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));
      } else {
        setStudentCredentialLogin(true);
        setErrorMessage(t("User not Found. Please verify your credentials."));
        setIsLoading(false);
      }
    } catch (error) {
      setStudentCredentialLogin(true);
      setIsLoading(false);
      setErrorMessage(t("Login unsuccessful. Please try again later."));
      console.log("error", error);
    }
  };

  function loinWithStudentCredentialsButton() {
    setShowBackButton(true);
    setShowVerification(true);
    setShowNameInput(true);
    setStudentCredentialLogin(true);
  }
  useEffect(() => {
    if (
      schoolCode.length != 0 &&
      studentId.length != 0 &&
      studentPassword.length! >= 6
    ) {
      setCurrentButtonColor(Buttoncolors.Valid);
    } else {
      setCurrentButtonColor(Buttoncolors.Default);
    }
  }, [schoolCode, studentId, studentPassword]);
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
              setCurrentPhone(phoneNumber);
              setDisableOtpButtonIfSameNumber(true);
              setAllowSubmittingOtpCounter(counter);
              setIsInvalidCode({
                isInvalidCode: false,
                isInvalidCodeLength: false,
              });
              setErrorMessage("");
              setStudentCredentialLogin(false);
              setShowNameInput(false);
            }}
          />
        </div>
      )}
      <div className={"header " + isInputFocus ? "scroll-header" : ""}>
        {!isLoading ? (
          <div>
            <img
              aria-hidden="true"
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
                        ref={inputRef}
                        inputText={t("Enter Mobile Number (10-digit)")}
                        inputType={"tel"}
                        aria-label={t("Enter Mobile Number (10-digit)")}
                        onFocus={async () => {
                          if (
                            Capacitor.getPlatform() === "android" &&
                            !isPromptNumbers
                          ) {
                            const data = await PortPlugin.requestPermission();
                            setIsPromptNumbers(true);
                          }
                        }}
                        maxLength={10}
                        inputValue={phoneNumber}
                        icon={<IoCallOutline id="text-box-icon" />}
                        onChange={(input) => {
                          if (input.target.value) {
                            if (!NUMBER_REGEX.test(input.target.value)) {
                              return;
                            }

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
                      <p className="login-verification-error-message">
                        {errorMessage}
                      </p>
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
                      if (!online) {
                        presentToast({
                          message: t(
                            `Device is offline. Login requires an internet connection`
                          ),
                          color: "danger",
                          duration: 3000,
                          position: "bottom",
                          buttons: [
                            {
                              text: "Dismiss",
                              role: "cancel",
                            },
                          ],
                        });
                        return;
                      }
                      console.log(
                        "if (!recaptchaVerifier && !Capacitor.isNativePlatform()) called",
                        recaptchaVerifier
                      );

                      // setSpinnerLoading(true);
                      if (phoneNumber.length === 10) {
                        await onPhoneNumberSubmit(phoneNumber);
                      } else {
                        phoneNumberErrorRef.current.style.display = "block";
                      }
                      // setShowVerification(true);
                      setSpinnerLoading(false);
                      setErrorMessage("");
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

                <div id="Google-horizontal-line-main-container">
                  <div id="Google-horizontal-line"></div>
                  <div id="login-google-icon-text">
                    {t("Continue with Google or Student ID")}
                  </div>
                  <div id="Google-horizontal-line2"></div>
                </div>
                <div className="login-with-google-or-student-credentials-container">
                  <img
                    id="login-google-icon"
                    aria-label={String(t("Google Sign In"))}
                    alt="Google Icon"
                    src="assets/icons/Google Icon.png"
                    onClick={async () => {
                      if (!online) {
                        presentToast({
                          message: t(
                            `Device is offline. Login requires an internet connection`
                          ),
                          color: "danger",
                          duration: 3000,
                          position: "bottom",
                          buttons: [
                            {
                              text: "Dismiss",
                              role: "cancel",
                            },
                          ],
                        });
                        return;
                      }
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
                          localStorage.setItem(
                            CURRENT_USER,
                            JSON.stringify(result)
                          );
                          console.log(
                            "google...",
                            localStorage.getItem(CURRENT_USER)
                          );
                        } else {
                          setIsLoading(false);
                        }
                      } catch (error) {
                        setIsLoading(false);
                        console.log("error", error);
                      }
                    }}
                  />
                  <div className="google-or-student-credentials-button">OR</div>
                  {!showVerification ? (
                    <div
                      className="login-with-student-credentials"
                      aria-label={String(t("Student-credentials Sign In"))}
                      onClick={loinWithStudentCredentialsButton}
                    >
                      <IoSchool className="school-icon" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : !showNameInput && startResendOtpCounter() ? (
              <div>
                <p id="login-otp-sent">
                  {t("OTP Sent To The")} {countryCode + phoneNumber}
                </p>
                <div id="login-text-box">
                  <div>
                    <TextBox
                      inputText={t("Enter 6 Digit Code")}
                      inputType={"tel"}
                      maxLength={6}
                      inputValue={verificationCode.trim()}
                      icon={<IoCallOutline id="text-box-icon" />}
                      onChange={(input) => {
                        if (input.target.value) {
                          if (!NUMBER_REGEX.test(input.target.value)) {
                            return;
                          }
                          setVerificationCode(input.target.value.trim());
                          console.log(input.target.value);
                          setIsInvalidCode({
                            isInvalidCode: false,
                            isInvalidCodeLength: false,
                          });
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
                  {errorMessage ? (
                    <p className="login-verification-error-message">
                      {errorMessage}
                    </p>
                  ) : isInvalidCode?.isInvalidCodeLength ? (
                    <p className="login-verification-error-message">
                      {t("Please Enter 6 Digit Code")}
                    </p>
                  ) : isInvalidCode?.isInvalidCode ? (
                    <p className="login-verification-error-message">
                      {t("Please Enter Valid Code")}
                    </p>
                  ) : null}
                </div>
                <div ref={getOtpBtnRef} id="login-otp-button">
                  <div
                    onClick={() => {
                      if (verificationCode.length === 6) {
                        onVerificationCodeSubmit(verificationCode);
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
                        onVerificationCodeSubmit(verificationCode);
                        setIsInvalidCode({
                          isInvalidCode: false,
                          isInvalidCodeLength: false,
                        });
                      }
                      setErrorMessage("");
                    }}
                  >
                    <div>{t("Get Started")}</div>
                  </div>
                  <div id="login-resend-otp">
                    <div>
                      <span
                        style={
                          !showResendOtp ? { color: "red" } : { color: "grey" }
                        }
                        id="login-time-remaining"
                      >
                        {t("Time Remaining :")} {counter}
                      </span>
                    </div>
                    <span
                      id="login-resend-otp-text"
                      onClick={resendOtpHandler}
                      style={
                        showResendOtp ? { color: "green" } : { color: "grey" }
                      }
                    >
                      {t("Resend OTP")}
                    </span>
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

                {/* {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null} */}
              </div>
            )}
          </div>
        ) : null}
        {showStudentCredentialtLogin ? (
          <div className="student-credentials-container">
            <div className="student-credentials-text-box-container">
              <TextBox
                inputText={t("Enter school code")}
                inputType={"text"}
                maxLength={100}
                inputValue={schoolCode.trim()}
                icon={<IoSchoolOutline id="text-box-icon" />}
                onChange={(input) => {
                  setErrorMessage("");
                  if (input.target.value) {
                    if (AT_SYMBOL_RESTRICTION.test(input.target.value)) {
                      return;
                    }
                    setSchoolCode(input.target.value);
                    console.log(input.target.value);
                  } else {
                    setSchoolCode("");
                  }
                }}
              ></TextBox>

              <TextBox
                inputText={t("Enter student id")}
                inputType={"text"}
                maxLength={100}
                inputValue={studentId.trim()}
                icon={<IoReaderOutline id="text-box-icon" />}
                onChange={(input) => {
                  setErrorMessage("");
                  if (input.target.value) {
                    if (AT_SYMBOL_RESTRICTION.test(input.target.value)) {
                      return;
                    }
                    setStudentId(input.target.value);
                    console.log(input.target.value);
                  } else {
                    setStudentId("");
                  }
                }}
              ></TextBox>

              <div>
                <TextBox
                  inputText={t("Enter  Password")}
                  inputType={"password"}
                  maxLength={100}
                  inputValue={studentPassword.trim()}
                  icon={<IoLockClosedOutline id="text-box-icon" />}
                  onChange={(input) => {
                    setErrorMessage("");
                    if (input.target.value) {
                      setStudenPassword(input.target.value);
                      console.log(input.target.value);
                    } else setStudenPassword("");
                  }}
                ></TextBox>
                {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
              </div>
            </div>
            <div>
              {errorMessage && (
                <p className="student-login-verification-error-message">
                  {errorMessage}
                </p>
              )}
            </div>
            <div
              id="login-with-student-credentials"
              style={{ backgroundColor: currentButtonColor }}
              onClick={() => {
                if (!online) {
                  presentToast({
                    message: t(
                      `Device is offline. Login requires an internet connection`
                    ),
                    color: "danger",
                    duration: 3000,
                    position: "bottom",
                    buttons: [
                      {
                        text: "Dismiss",
                        role: "cancel",
                      },
                    ],
                  });
                  return;
                }
                if (
                  schoolCode.length !== 0 &&
                  studentId.length !== 0 &&
                  studentPassword.length >= 6
                ) {
                  handleLoginWithStudentCredentials();
                } else if (
                  schoolCode.length == 0 ||
                  studentId.length == 0 ||
                  studentPassword.length == 0
                ) {
                  setErrorMessage(t("Please fill in all fields."));
                } else if (studentPassword.length < 6) {
                  setErrorMessage(t("Password is too short."));
                }
              }}
            >
              {t("Get Started")}
            </div>
          </div>
        ) : null}

        {/* {showPhoneNumberPopUp ? (
          <PhoneNumberPopup
            showPopUp={showPhoneNumberPopUp}
            onPopUpClose={() => {
              setShowPhoneNumberPopUp(!showPhoneNumberPopUp);
            }}
            onNoneSelect={() => {
              setShowPhoneNumberPopUp(!showPhoneNumberPopUp);
              setPhoneNumber("");
              setCurrentButtonColor(Buttoncolors.Default);
            }}
            onNumberSelect={(number) => {
              setShowPhoneNumberPopUp(!showPhoneNumberPopUp);
              setPhoneNumber(number.toString());
              setCurrentButtonColor(Buttoncolors.Valid);
              phoneNumberErrorRef.current.style.display = "none";
            }}
            phoneNumbers={promptPhonNumbers}
          />
        ) : null} */}
      </div>
      <Loading isLoading={isLoading || sentOtpLoading} />
    </IonPage>
  );
};

export default Login;
