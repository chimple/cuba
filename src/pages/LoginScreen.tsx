import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Keyboard } from "@capacitor/keyboard";
import { Toast } from "@capacitor/toast";
import { useHistory } from "react-router-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ConfirmationResult } from "@firebase/auth";
import { IonLoading, IonText } from "@ionic/react";
import { t } from "i18next";
import React, { useEffect, useRef, useState } from "react";

import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import LoginWithStudentID from "../components/signup/LoginWithStudentID";
import LanguageDropdown, {
  LanguageOption,
} from "../components/signup/LanguageDropdown";
import OtpVerification from "../components/signup/OtpVerification";
import LoginWithEmail from "../components/signup/LoginWithEmail";
import LoginWithPhone from "../components/signup/LoginWithPhone";
import LoginSwitch from "../components/signup/LoginSwitch";
import ForgotPass from "../components/signup/ForgotPass";
import { RoleType } from "../interface/modelInterfaces";
import { ServiceConfig } from "../services/ServiceConfig";
import Loading from "../components/Loading";
import { schoolUtil } from "../utility/schoolUtil";
import {
  ACTION,
  CURRENT_USER,
  DOMAIN,
  EVENTS,
  LANGUAGE,
  MODES,
  PAGES,
  USER_DATA,
  USER_ROLE,
} from "../common/constants";
import { APP_LANGUAGES } from "../common/constants";
import "./LoginScreen.css";
import { Util } from "../utility/util";
import i18n from "../i18n";
import { FaArrowLeftLong } from "react-icons/fa6";

const LoginScreen: React.FC = () => {
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [loginType, setLoginType] = useState<
    "phone" | "student" | "email" | "otp" | "forgot-pass"
  >("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(59);
  const [showTimer, setShowTimer] = useState(false);
  const [showResendOtp, setShowResendOtp] = useState(false);
  const [sentOtpLoading, setSentOtpLoading] = useState(false);
  const [checkbox, setCheckbox] = useState(true);
  const [showTandC, setShowTandC] = useState(false);
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [studentPassword, setStudentPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [currentLang, setCurrentLang] = useState<string>(
    Object.keys(APP_LANGUAGES)[0]
  );
  const [isPromptNumbers, setIsPromptNumbers] = useState<boolean>(false);
  const PortPlugin = registerPlugin<any>("Port");
  const phoneNumberErrorRef = useRef<any>();
  const [isInvalidCode, setIsInvalidCode] = useState({
    isInvalidCode: false,
    isInvalidCodeLength: false,
  });
  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState<boolean>(false);
  const [disableOtpButtonIfSameNumber, setDisableOtpButtonIfSameNumber] =
    useState<boolean>(false);
  const [allowSubmittingOtpCounter, setAllowSubmittingOtpCounter] =
    useState<number>(0);
  const [currentPhone, setCurrentPhone] = useState<any>();
  const [title, setTitle] = React.useState("");
  const [userData, setUserData] = useState<any>();
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [otpExpiryCounter, setOtpExpiryCounter] = useState(15);
  const [animatedLoading, setAnimatedLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);

  const loadingMessages = [
    t("Track your learning progress."),
    t("Preparing 400+ fun lessons."),
    t("Customize your profiles."),
    t("Assign or get regular homework."),
  ];
  const loadingAnimations = [
    "/assets/home.gif",
    "/assets/hw-book.gif",
    "/assets/profiles-grid.gif",
    "/assets/subjects-book.gif",
  ];
  const [loadingAnimationsIndex, setLoadingAnimationsIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % loadingMessages.length
      );
      setLoadingAnimationsIndex(
        (prevIndex) => (prevIndex + 1) % loadingAnimations.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  useEffect(() => {
    // Combine all initial async setup in one effect
    const initialize = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: "portrait" });
        }
        const appLang = localStorage.getItem(LANGUAGE);
        if (!appLang) {
          localStorage.setItem(LANGUAGE, "en");
          setCurrentLang("en");
          await i18n.changeLanguage("en");
        } else {
          setCurrentLang(appLang);
          await i18n.changeLanguage(appLang);
        }
        const authHandler = ServiceConfig.getI().authHandler;
        const isUserLoggedIn = await authHandler.isUserLoggedIn();
        if (isUserLoggedIn) {
          history.replace(PAGES.SELECT_MODE);
          return;
        }
        if (Capacitor.isNativePlatform()) {
          document.addEventListener("visibilitychange", handleVisibilityChange);
        }
      } finally {
        setInitializing(false);
      }
    };
    initialize();
    return () => {
      if (Capacitor.isNativePlatform()) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, []);

  // Handle visibility change (when app goes into background or foreground)
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      // App came to foreground
      const authHandler = ServiceConfig.getI().authHandler;
      authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
        if (isUserLoggedIn) {
          history.replace(PAGES.SELECT_MODE);
        }
      });
    }
  };

  const authInstance = ServiceConfig.getI().authHandler;
  const countryCode = "";

  // Timer effect for OTP resend
  useEffect(() => {
 let interval: NodeJS.Timer | null = null;
    
    if (showTimer && counter > 0) {
      interval = setInterval(() => {
        setCounter((prevCounter) => {
          if (prevCounter <= 1) {
            setShowResendOtp(true);
            return 0;
          }
          return prevCounter - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [counter, showTimer]);

  // Timer effect for OTP expiration
  useEffect(() => {
    if (loginType === "otp") {
      const expiryTimer = setInterval(() => {
        setOtpExpiryCounter((prev) => {
          if (prev <= 0) {
            clearInterval(expiryTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(expiryTimer);
    }
  }, [loginType]);

  // Handler for switching login types
  const handleSwitch = (type: string) => {
    if (type === "phone" || type === "student" || type === "email")
      setLoginType(type);
  };

  // Handler for phone next
  const handlePhoneNext = async () => {
    try {
      if (currentPhone === phoneNumber) {
        if (allowSubmittingOtpCounter > 0) {
          await Toast.show({
            text: title,
            duration: "long",
          });
          return;
        }
      } else {
        setDisableOtpButtonIfSameNumber(false);
        setAllowSubmittingOtpCounter(0);
      }

      if (phoneNumber.length !== 10) {
        setErrorMessage(t("Please Enter 10 digit Mobile Number"));
        return;
      }

      setSentOtpLoading(true);
      setSpinnerLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;

      let response = await authInstance.generateOtp(
        phoneNumberWithCountryCode,
        "Chimple"
      );

      if (response) {
        setSentOtpLoading(false);
        setSpinnerLoading(false);
        setCounter(59);
        setShowTimer(true);
        setLoginType("otp");
        setErrorMessage(null);
        setCurrentPhone(phoneNumber);
        setDisableOtpButtonIfSameNumber(true);
        setAllowSubmittingOtpCounter(counter);
      }
    } catch (error) {
      setSentOtpLoading(false);
      setSpinnerLoading(false);
      if (typeof error === "string") {
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
        setErrorMessage(
          t("Phone Number signin Failed. Please try again later.")
        );
      }
    }
  };

  // Handler for going back from OTP
  const handleOtpBack = () => {
    setLoginType("phone");
    setVerificationCode("");
    setPhoneNumber("");
    setShowResendOtp(false);
    setShowTimer(false);
    setErrorMessage(null);
    setOtpExpiryCounter(15); // Reset the expiry counter
  };

  // Handler for OTP verification
  const handleOtpVerification = async (otp: string) => {
    try {
      setAnimatedLoading(true);
      setIsLoading(true);
      setErrorMessage(null); // Clear any previous errors

      let phoneNumberWithCountryCode = countryCode + phoneNumber;

      const res = await authInstance.proceedWithVerificationCode(
        phoneNumberWithCountryCode,
        otp.trim()
      );

      if (!res?.user) {
        // Handle the case where verification succeeded but no user was returned
        throw new Error("Verification failed - no user data");
      }

      // Store user data and proceed with navigation
      setUserData(res.user);
      localStorage.setItem(CURRENT_USER, JSON.stringify(res.user));

      // Log the login event
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_id: res.user.uid,
        user_name: res.user.name,
        user_username: res.user.username,
        phone_number: res.user.username,
        user_type: RoleType.PARENT,
        action_type: ACTION.LOGIN,
        login_type: "phone-number",
      });
      setAnimatedLoading(false);
      // Finally navigate to next screen
      history.replace(PAGES.SELECT_MODE);
    } catch (error) {
      // Handle all state updates for error case at once
      const updates = () => {
        setAnimatedLoading(false);
        setIsLoading(false);
        setVerificationCode("");

        // Set appropriate error message
        if (typeof error === "string" && error.includes("code-expired")) {
          setErrorMessage(
            t("Verification code has expired. Please request a new one.")
          );
        } else {
          setErrorMessage(t("Incorrect OTP - Please check & try again!"));
        }

        // Enable resend OTP option
        setShowResendOtp(true);
        setCounter(0);
      };

      // Execute all state updates together
      updates();
    }
  };

  // Handler for resending OTP
  const handleResendOtp = async () => {
    try {
      if (!(counter <= 0)) {
        return;
      }
      setSentOtpLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;

      let response = await authInstance.resendOtpMsg91(
        phoneNumberWithCountryCode
      );

      if (response) {
        setSentOtpLoading(false);
        setShowResendOtp(false);
        setCounter(59);
        setVerificationCode("");
        setErrorMessage(null);
        setOtpExpiryCounter(15); // Reset the expiry counter
      } else {
        setSentOtpLoading(false);
      }
    } catch (error) {
      setSentOtpLoading(false);
      setErrorMessage(
        t("Resend Otp Failed!! Please try again after some time.")
      );
    }
  };

  // Handler for Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      if (!online) {
        presentToast({
          message: t(
            "Device is offline. Login requires an internet connection"
          ),
          color: "danger",
          duration: 3000,
          position: "bottom",
          buttons: [{ text: "Dismiss", role: "cancel" }],
        });
        return;
      }

      setAnimatedLoading(true);
      setIsLoading(true);
      const result: boolean = await authInstance.googleSign();

      if (result) {
        setAnimatedLoading(false);
        setIsLoading(false);
        const user = JSON.parse(localStorage.getItem(USER_DATA)!);
        const userSchools = await getSchoolsForUser(user);
        await redirectUser(user, userSchools);
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_type: RoleType.PARENT,
          action_type: ACTION.LOGIN,
          login_type: "google-signin",
        });
      } else {
        setAnimatedLoading(false);
        setIsLoading(false);
        setErrorMessage(t("Google sign in failed. Please try again."));
        // Abort the Google sign in process
        setLoginType("phone");
      }
    } catch (error) {
      setAnimatedLoading(false);
      setIsLoading(false);
      setErrorMessage(t("Google sign in failed. Please try again."));
      // Abort the Google sign in process
      setLoginType("phone");
    }
  };

  // Helper function to get schools for user
  async function getSchoolsForUser(user: any) {
    const api = ServiceConfig.getI().apiHandler;
    const userSchools = await api.getSchoolsForUser(user.id);
    if (userSchools && userSchools.length > 0) {
      return userSchools;
    }
    return [];
  }

  // Helper function to redirect user based on role
  async function redirectUser(user: any, userSchools: any[]) {
    const userRole = localStorage.getItem(USER_ROLE);
    if (
      userRole === RoleType.SUPER_ADMIN ||
      userRole === RoleType.OPERATIONAL_DIRECTOR
    ) {
      history.replace(PAGES.SIDEBAR_PAGE);
      return;
    }
    if (userSchools.length > 0) {
      const autoUserSchool = userSchools.find(
        (school) => school.role === RoleType.AUTOUSER
      );

      const isOpsUser = userSchools.some(
        (school) =>
          school.role === RoleType.PROGRAM_MANAGER ||
          school.role === RoleType.FIELD_COORDINATOR
      );

      if (isOpsUser) {
        history.replace(PAGES.SIDEBAR_PAGE);
        return;
      }

      if (autoUserSchool) {
        schoolUtil.setCurrMode(MODES.SCHOOL);
        history.replace(PAGES.SELECT_MODE);
        return;
      }
      schoolUtil.setCurrMode(MODES.TEACHER);
      history.replace(PAGES.DISPLAY_SCHOOLS);
    } else {
      schoolUtil.setCurrMode(MODES.PARENT);
      history.replace(PAGES.DISPLAY_STUDENT);
    }
  }

  // Language dropdown options
  const langOptions: LanguageOption[] = Object.entries(APP_LANGUAGES).map(
    ([id, displayName]) => ({ id, displayName })
  );

  // Handle language change
  const handleLanguageChange = async (selectedLang: string) => {
    if (!selectedLang) return;
    localStorage.setItem(LANGUAGE, selectedLang);
    await i18n.changeLanguage(selectedLang);
    setCurrentLang(selectedLang);
  };

  // Handler for student credentials login
  const handleStudentLogin = async () => {
    try {
      if (!online) {
        presentToast({
          message: t(
            "Device is offline. Login requires an internet connection"
          ),
          color: "danger",
          duration: 3000,
          position: "bottom",
          buttons: [{ text: "Dismiss", role: "cancel" }],
        });
        return;
      }

      setAnimatedLoading(true);
      setIsLoading(true);
      const result: boolean = await authInstance.loginWithEmailAndPassword(
        schoolCode.trimEnd() + studentId.trimEnd() + DOMAIN,
        studentPassword.trimEnd()
      );

      if (result) {
        setAnimatedLoading(false);
        setIsLoading(false);
        const user = JSON.parse(localStorage.getItem(USER_DATA)!);
        const userSchools = await getSchoolsForUser(user);
        await redirectUser(user, userSchools);
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));

        // Log the login event
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: user.uid,
          user_name: user.name,
          user_username: user.username,
          user_type: RoleType.STUDENT,
          action_type: ACTION.LOGIN,
          login_type: "student-credentials",
        });
      } else {
        setAnimatedLoading(false);
        setIsLoading(false);
        setErrorMessage(t("Incorrect credentials - Please check & try again!"));
        // Abort the student login process
        setSchoolCode("");
        setStudentId("");
        setStudentPassword("");
      }
    } catch (error) {
      setAnimatedLoading(false);
      setIsLoading(false);
      setErrorMessage(t("Login unsuccessful. Please try again later."));
      // Abort the student login process
      setSchoolCode("");
      setStudentId("");
      setStudentPassword("");
    }
  };

  // Handler for email login
  const handleEmailLogin = async (email: string, password: string) => {
    try {
      if (!online) {
        presentToast({
          message: t(
            "Device is offline. Login requires an internet connection"
          ),
          color: "danger",
          duration: 3000,
          position: "bottom",
          buttons: [{ text: "Dismiss", role: "cancel" }],
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMessage(t("Please enter a valid email address"));
        return;
      }

      // Password validation
      if (password.length < 6 || /\s/.test(password)) {
        setErrorMessage(
          t("Password must be at least 6 characters")
        );
        return;
      }

      setAnimatedLoading(true);
      setIsLoading(true);
      const result: boolean = await authInstance.signInWithEmail(
        email,
        password
      );

      if (result) {
        setAnimatedLoading(false);
        setIsLoading(false);
        const user = JSON.parse(localStorage.getItem(USER_DATA)!);
        const userSchools = await getSchoolsForUser(user);
        await redirectUser(user, userSchools);
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));

        // Log the login event
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: user.uid,
          user_name: user.name,
          user_username: user.username,
          user_type: RoleType.PARENT,
          action_type: ACTION.LOGIN,
          login_type: "email",
        });
      } else {
        setAnimatedLoading(false);
        setIsLoading(false);
        setErrorMessage(t("Incorrect credentials - Please check & try again!"));
        // Abort the email login process
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setAnimatedLoading(false);
      setIsLoading(false);
      setErrorMessage(t("Login unsuccessful. Please try again later."));
      // Abort the email login process
      setEmail("");
      setPassword("");
    }
  };

  // Add auto phone suggestion functionality
  useEffect(() => {
    initNumberSelectedListner();
  }, []);

  useEffect(() => {
    if (phoneNumber.length === 10) {
      initSmsListner();
    }
  }, [phoneNumber]);

  const retriewPhoneNumber = async () => {
    const phoneNumber = await PortPlugin.numberRetrieve();
    if (phoneNumber.number) {
      if (phoneNumberErrorRef.current) {
        phoneNumberErrorRef.current.style.display = "none";
      }
      setPhoneNumber(phoneNumber.number.toString());
    } 
  };

  const otpEventListener = async (event: Event) => {
    const data = await PortPlugin.otpRetrieve();
    if (data?.otp) {
      setVerificationCode(data.otp.toString());
      // Auto verify when OTP is received
      handleOtpVerification(data.otp.toString());
    }
    document.removeEventListener("otpReceived", otpEventListener);
  };

  const isPhoneNumberEventListener = async (event: Event) => {
    await retriewPhoneNumber();
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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        setIsInputFocus(true);
        setTimeout(() => {
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
  }, []);

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

  return (
    <div className="Loginscreen-login-screen">
      {initializing ? (
        <Loading isLoading={true} />
      ) : (
        animatedLoading ? (
          <div className="Loginscreen-initial-loading-ui">
            <img
              src={loadingAnimations[loadingAnimationsIndex]}
              alt="initial-gif-animations"
              className="Loginscreen-initial-homework-icon"
            />
            <img
              src="/assets/loader-circle.gif"
              alt="initial-loading-gif"
              className="Loginscreen-initial-loading-spinner"
            />
            <IonText className="Loginscreen-initial-loading-text">
              <p>{t(loadingMessages[currentMessageIndex])}</p>
            </IonText>
            <IonText className="Loginscreen-initial-loading-text">
              <p>{t("Hang tight, It's a special occasion!")}</p>
            </IonText>
          </div>
        ) : (
          <>
            <div
              className="Loginscreen-tc-popup"
              style={{ display: showTandC ? "block" : "none" }}
            >
              <div className="Loginscreen-tc-header">
                <button
                  className="Loginscreen-tc-close-button"
                  onClick={() => setShowTandC(false)}
                >
                  <img
                    src="/assets/loginAssets/TermsConditionsClose.svg"
                    alt="Close"
                  />
                </button>
              </div>
              <div className="Loginscreen-tc-content">
                <iframe
                  src="assets/termsandconditions/TermsandConditionsofChimple.html"
                  title="Terms and Conditions"
                  allowFullScreen={true}
                  style={{ height: "80vh", width: "100%", border: "none" }}
                />
              </div>
            </div>
            <div className="Loginscreen-login-header">
              {loginType === "otp" || loginType === "forgot-pass" ? (
                <button
                  className="Loginscreen-otp-back-button"
                  onClick={handleOtpBack}
                  aria-label="Back"
                  type="button"
                >
                  <FaArrowLeftLong style={{color:"#f34d08"}}
                    className="Loginscreen-otp-back-arrow-img"
                  />
                </button>
              ) : (
                <div></div>
              )}
              <LanguageDropdown
                options={langOptions}
                value={currentLang}
                onChange={handleLanguageChange}
              />
            </div>
            {loginType !== "otp" ? (
              <img
                src={"/assets/loginAssets/ChimpleLogo.svg"}
                alt="Chimple Logo"
                className="Loginscreen-chimple-login-logo"
                style={
                  (loginType as string) !== "phone"
                    ? {
                        maxWidth: "138px",
                        marginTop: window.matchMedia("(orientation: landscape)")
                          .matches
                          ? "0"
                          : "35%",
                    }
                    : undefined
                }
              />
            ) : (
              <div className="Loginscreen-chimple-login-logo-otp-container">
                <p>{t("Verify Your Number")}</p>
                <img
                  src={"/assets/loginAssets/MascotForOTP.svg"}
                  alt="Chimple Logo"
                  className="Loginscreen-chimple-login-logo-otp"
                />
              </div>
            )}

            <>
              {loginType === "phone" && (
                <LoginWithPhone
                  onNext={handlePhoneNext}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  errorMessage={errorMessage}
                  checkbox={checkbox}
                  onFocus={async () => {
                    if (
                      Capacitor.getPlatform() === "android" &&
                      !isPromptNumbers
                    ) {
                      const data = await PortPlugin.requestPermission();
                      setIsPromptNumbers(true);
                    }
                  }}
                />
              )}
              {loginType === "student" && (
                <LoginWithStudentID
                  onLogin={handleStudentLogin}
                  schoolCode={schoolCode}
                  setSchoolCode={setSchoolCode}
                  studentId={studentId}
                  setStudentId={setStudentId}
                  studentPassword={studentPassword}
                  setStudentPassword={setStudentPassword}
                  errorMessage={errorMessage}
                  checkbox={checkbox}
                />
              )}
              {loginType === "email" && (
                <LoginWithEmail
                  onLogin={handleEmailLogin}
                  onForgotPasswordChange={() => {
                    setLoginType("forgot-pass");
                  }}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  errorMessage={errorMessage}
                  checkbox={checkbox}
                />
              )}
              {loginType === "otp" && (
                <OtpVerification
                  phoneNumber={phoneNumber}
                  onVerify={handleOtpVerification}
                  onResend={handleResendOtp}
                  errorMessage={errorMessage}
                  counter={counter}
                  showResendOtp={showResendOtp}
                  isLoading={isLoading}
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                />
              )}
              {loginType === "forgot-pass" && (
                <ForgotPass
                  onGoBack={() => {
                    setLoginType("email");
                  }}
                />
              )}
            </>
            <LoginSwitch
              loginType={loginType}
              onSwitch={handleSwitch}
              checkbox={checkbox}
              onCheckboxChange={setCheckbox}
              onTermsClick={() => setShowTandC(true)}
              onGoogleSignIn={handleGoogleSignIn}
              otpExpiryCounter={otpExpiryCounter}
            />
            {isInputFocus && <div ref={scollToRef} id="scroll"></div>}
            <IonLoading
              id="custom-loading"
              message="Loading"
              isOpen={spinnerLoading}
            />
            <Loading isLoading={sentOtpLoading} />
          </>
        )
      )}
    </div>
  );
};

export default LoginScreen;
