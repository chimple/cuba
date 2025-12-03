import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Keyboard } from "@capacitor/keyboard";
import { Toast } from "@capacitor/toast";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { IonText } from "@ionic/react";
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
import { APIMode, ServiceConfig } from "../services/ServiceConfig";
import Loading from "../components/Loading";
import { schoolUtil } from "../utility/schoolUtil";
import {
  ACTION,
  DOMAIN,
  EVENTS,
  IS_OPS_USER,
  LANGUAGE,
  MODES,
  PAGES,
  USER_DATA,
  USER_ROLE,
  CURRENT_USER,
  LOGIN_TYPES,
} from "../common/constants";
import { APP_LANGUAGES } from "../common/constants";
import "./LoginScreen.css";
import { Util } from "../utility/util";
import i18n from "../i18n";
import { FaArrowLeftLong } from "react-icons/fa6";
import { SqliteApi } from "../services/api/SqliteApi";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";
import { useHistory } from "react-router-dom";

const LoginScreen: React.FC = () => {
  const history = useHistory();
  const { setGbUpdated } = useGbContext();
  const api = ServiceConfig.getI().apiHandler;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [loginType, setLoginType] = useState<
    | LOGIN_TYPES.PHONE
    | LOGIN_TYPES.STUDENT
    | LOGIN_TYPES.EMAIL
    | LOGIN_TYPES.OTP
    | LOGIN_TYPES.FORGET_PASS
  >(LOGIN_TYPES.PHONE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  // Separate error states for each login component
  const [phoneErrorMessage, setPhoneErrorMessage] = useState<string | null>(
    null
  );
  const [studentErrorMessage, setStudentErrorMessage] = useState<string | null>(
    null
  );
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(
    null
  );
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
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
  const phoneNumberErrorRef = useRef<any>(null);

  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState<boolean>(false);
  const [disableOtpButtonIfSameNumber, setDisableOtpButtonIfSameNumber] =
    useState<boolean>(false);
  const [allowSubmittingOtpCounter, setAllowSubmittingOtpCounter] =
    useState<number>(0);
  const [currentPhone, setCurrentPhone] = useState<any>();
  const [title, setTitle] = React.useState("");
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [otpExpiryCounter, setOtpExpiryCounter] = useState(15);
  const [animatedLoading, setAnimatedLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);
  const [showStudentCredentialLogin, setStudentCredentialLogin] =
    useState<boolean>(false);

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
    const initialize = async () => {
      try {
        // lock orientation if native
        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: "portrait" });
        }

        // language
        const appLang = localStorage.getItem(LANGUAGE);
        if (!appLang) {
          localStorage.setItem(LANGUAGE, "en");
          setCurrentLang("en");
          await i18n.changeLanguage("en");
        } else {
          setCurrentLang(appLang);
          await i18n.changeLanguage(appLang);
        }

        // if already logged in, jump straight to select‐mode
        const authHandler = ServiceConfig.getI().authHandler;
        if (await authHandler.isUserLoggedIn()) {
          history.replace(PAGES.SELECT_MODE);
          return;
        }
      } finally {
        setInitializing(false);
      }
    };
    initialize();

    return () => {
      if (Capacitor.isNativePlatform()) {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
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
    let interval: NodeJS.Timeout | null = null;
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
  }, [showTimer, counter]);

  // Timer effect for OTP expiration
  useEffect(() => {
    if (loginType === LOGIN_TYPES.OTP) {
      const expiryTimer = setInterval(() => {
        setOtpExpiryCounter((prev) => {
          if (prev <= 0) {
            clearInterval(expiryTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
      return () => clearInterval(expiryTimer);
    }
  }, [loginType]);

  // Handler for switching login types
  const handleSwitch = (type: string) => {
    if (
      type === LOGIN_TYPES.PHONE ||
      type === LOGIN_TYPES.STUDENT ||
      type === LOGIN_TYPES.EMAIL
    )
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
        setPhoneErrorMessage(t("Please Enter 10 digit Mobile Number"));
        return;
      }

      setSentOtpLoading(true);
      setSpinnerLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      initSmsListner();
      let result = await authInstance.generateOtp(
        phoneNumberWithCountryCode,
        "Chimple"
      );

      if (result.success) {
        setSentOtpLoading(false);
        setSpinnerLoading(false);
        setCounter(59);
        setShowTimer(true);
        setLoginType(LOGIN_TYPES.OTP);
        setPhoneErrorMessage(null);
        setCurrentPhone(phoneNumber);
        setDisableOtpButtonIfSameNumber(true);
        setAllowSubmittingOtpCounter(counter);
      } else {
        setSentOtpLoading(false);
        setSpinnerLoading(false);
        const errorMessage = result.error;
        if (errorMessage) {
          setPhoneErrorMessage(
            t("Kindly wait for 1 minute and then try logging in again.")
          );
        } else {
          setPhoneErrorMessage(
            t("Phone Number signin Failed. Please try again later.")
          );
        }
      }
    } catch (error: any) {
      setSentOtpLoading(false);
      setSpinnerLoading(false);
      // This catch block handles unexpected exceptions from generateOtp, not errors returned in the 'result' object.
      let displayErrorMessage = t(
        "Phone Number signin Failed. Please try again later."
      );
      if (error && typeof error === "string") {
        displayErrorMessage = error;
      } else if (error && error.message) {
        displayErrorMessage = error.message;
      }
      setPhoneErrorMessage(displayErrorMessage);
    }
  };

  // Handler for going back from OTP
  const handleOtpBack = () => {
    if (loginType === LOGIN_TYPES.OTP) {
      setLoginType(LOGIN_TYPES.PHONE);
      setVerificationCode("");
      setPhoneNumber("");
      setShowResendOtp(false);
      setShowTimer(false);
      setOtpErrorMessage(null);
      setOtpExpiryCounter(15); // Reset the expiry counter
    } else if (loginType === LOGIN_TYPES.FORGET_PASS) {
      setLoginType(LOGIN_TYPES.EMAIL);
      setEmailErrorMessage("");
    }
  };

  // Handler for OTP verification
  const handleOtpVerification = async (otp: string) => {
    try {
      setAnimatedLoading(true);
      setIsLoading(true);
      setOtpErrorMessage(null); // Clear any previous errors

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
      const user = res.user;
      localStorage.setItem(CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      let studentDetails = user?.user;
      studentDetails.parent_id = user?.user.id;
      studentDetails.last_sign_in_at = user.last_login_at;
      studentDetails.login_method = "phone-number";
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_id: user.uid,
        user_name: user.name,
        user_username: user.username,
        phone_number: user.username,
        user_type: RoleType.PARENT,
        action_type: ACTION.LOGIN,
        login_type: "phone-number",
      });

      const userSchools = await getSchoolsForUser(user.user.id);
      await redirectUser(userSchools, res.isSpl);

      setAnimatedLoading(false);
    } catch (error) {
      // Handle all state updates for error case at once
      const updates = () => {
        setAnimatedLoading(false);
        setIsLoading(false);
        setVerificationCode("");

        // Set appropriate error message
        if (typeof error === "string" && error.includes("code-expired")) {
          setOtpErrorMessage(
            "Verification code has expired. Please request a new one."
          );
        } else {
          setOtpErrorMessage("Incorrect OTP - Please check & try again!");
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
        setOtpErrorMessage(null);
        setOtpExpiryCounter(15); // Reset the expiry counter
      } else {
        setSentOtpLoading(false);
      }
    } catch (error) {
      setSentOtpLoading(false);
      setOtpErrorMessage(
        "Resend Otp Failed!! Please try again after some time."
      );
    }
  };

  // Handler for Google Sign In
  const handleGoogleSignIn = async () => {
    if (!online) {
      return presentToast({
        message: t("Device is offline. Login requires an internet connection"),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [{ text: "Dismiss", role: "cancel" }],
      });
    }
    setAnimatedLoading(true);
    try {
      const ok = await authInstance.googleSign();
      if (!ok.success) throw new Error("Google sign in failed");

      const user: any = await authInstance.getCurrentUser();
      if (!user) throw new Error("No user returned from auth handler");

      localStorage.setItem(CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      let studentDetails: any = user;
      studentDetails.parent_id = user.id;
      studentDetails.last_sign_in_at = user.last_login_at;
      studentDetails.login_method = "google-signin";
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_type: RoleType.PARENT,
        action_type: ACTION.LOGIN,
        login_type: "google-signin",
      });

      // now safe to use user.id
      const schools = await getSchoolsForUser(user.id);
      await redirectUser(schools, ok.isSpl);
    } catch (e) {
      presentToast({
        message: t("Google sign in failed. Please try again."),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [{ text: "Dismiss", role: "cancel" }],
      });
      setLoginType(LOGIN_TYPES.PHONE);
    } finally {
      setAnimatedLoading(false);
    }
  };

  const getSchoolsForUser = async (userId: string) => {
    return (await api.getSchoolsForUser(userId)) || [];
  };

  const redirectUser = async (
    schools: { role: RoleType }[],
    isOpsUser: boolean
  ) => {
    if (isOpsUser) {
      localStorage.setItem(IS_OPS_USER, "true");
      await ScreenOrientation.unlock();
      schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
      return history.replace(PAGES.SIDEBAR_PAGE);
    } else {
      if (schools.length === 0) {
        schoolUtil.setCurrMode(MODES.PARENT);
        return history.replace(PAGES.DISPLAY_STUDENT);
      }

      // AUTOUSER → school‐mode
      const auto = schools.find((s) => s.role === RoleType.AUTOUSER);
      if (auto) {
        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: "landscape" });
          schoolUtil.setCurrMode(MODES.SCHOOL);
          return history.replace(PAGES.SELECT_MODE);
        } else {
          schoolUtil.setCurrMode(MODES.SCHOOL);
          return history.replace(PAGES.SELECT_MODE);
        }
      }

      // else teacher
      schoolUtil.setCurrMode(MODES.TEACHER);
      return history.replace(PAGES.DISPLAY_SCHOOLS);
    }
  };

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
    setStudentCredentialLogin(false);
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
      const { success: result, isSpl: isOps } =
        await authInstance.loginWithEmailAndPassword(
          schoolCode.trimEnd() + studentId.trimEnd() + DOMAIN,
          studentPassword.trimEnd()
        );
      if (!result) {
        setStudentCredentialLogin(true);
        setAnimatedLoading(false);
        setIsLoading(false);
        setStudentErrorMessage(
          "Incorrect credentials - Please check & try again!"
        );
      }
      setAnimatedLoading(false);
      setIsLoading(false);
      localStorage.setItem(CURRENT_USER, JSON.stringify(result));
      const user = JSON.parse(localStorage.getItem(USER_DATA)!);
      const userSchools = await getSchoolsForUser(user.id);
      await redirectUser(userSchools, isOps);
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      let studentDetails: any = user;
      studentDetails.parent_id = user.uid;
      studentDetails.last_sign_in_at = user.last_login_at;
      studentDetails.login_method = "student-credentials";
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      // Log the login event
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_id: user.uid,
        user_name: user.name,
        user_username: user.username,
        user_type: RoleType.STUDENT,
        action_type: ACTION.LOGIN,
        login_type: "student-credentials",
      });
    } catch (error) {
      setStudentCredentialLogin(true);
      setAnimatedLoading(false);
      setIsLoading(false);
      setStudentErrorMessage("Login unsuccessful. Please try again later.");
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
        setEmailErrorMessage("Please enter a valid email address");
        return;
      }

      // Password validation
      if (password.length < 6 || /\s/.test(password)) {
        setEmailErrorMessage("Password must be at least 6 characters");
        return;
      }

      setAnimatedLoading(true);
      setIsLoading(true);
      const { success: result, isSpl: isOpsUser } =
        await authInstance.signInWithEmail(email, password);

      if (result) {
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));
        localStorage.setItem(USER_DATA, JSON.stringify(result));
        setIsLoading(false);
        const user: any =
          await ServiceConfig.getI().authHandler.getCurrentUser();
        if (user) {
          const userSchools = await getSchoolsForUser(user.id);
          await redirectUser(userSchools, isOpsUser);
        }
        setAnimatedLoading(false);
        let studentDetails: any = user;
        studentDetails.parent_id = user.uid;
        studentDetails.last_sign_in_at = user.last_login_at;
        studentDetails.login_method = "email-password";
        updateLocalAttributes({
          studentDetails,
        });
        setGbUpdated(true);
        // Log the login event
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: user.uid,
          user_name: user.name,
          user_username: user.username,
          user_type: RoleType.PARENT,
          action_type: ACTION.LOGIN,
          login_type: LOGIN_TYPES.EMAIL,
        });
      } else {
        setAnimatedLoading(false);
        setIsLoading(false);
        setEmailErrorMessage(
          "Incorrect credentials - Please check & try again!"
        );
        // Abort the email login process
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setAnimatedLoading(false);
      setIsLoading(false);
      setEmailErrorMessage("Login unsuccessful. Please try again later.");
      // Abort the email login process
      setEmail("");
      setPassword("");
    }
  };

  // Add auto phone suggestion functionality
  useEffect(() => {
    initNumberSelectedListner();
  }, []);

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
      ) : animatedLoading ? (
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
            {loginType === LOGIN_TYPES.OTP ||
              loginType === LOGIN_TYPES.FORGET_PASS ? (
              <button
                className="Loginscreen-otp-back-button"
                onClick={handleOtpBack}
                aria-label="Back"
                type="button"
              >
                <FaArrowLeftLong
                  style={{ color: "#f34d08" }}
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
          {loginType !== LOGIN_TYPES.OTP ? (
            <img
              src={"/assets/loginAssets/ChimpleLogo.svg"}
              alt="Chimple Logo"
              className="Loginscreen-chimple-login-logo"
              style={
                (loginType as string) !== LOGIN_TYPES.PHONE
                  ? {
                    maxWidth: window.matchMedia("(orientation: landscape)")
                      .matches
                      ? "120px"
                      : "138px",
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
            {loginType === LOGIN_TYPES.PHONE && (
              <LoginWithPhone
                onNext={handlePhoneNext}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                errorMessage={phoneErrorMessage && t(phoneErrorMessage)}
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
            {loginType === LOGIN_TYPES.STUDENT && (
              <LoginWithStudentID
                onLogin={handleStudentLogin}
                schoolCode={schoolCode}
                setSchoolCode={setSchoolCode}
                studentId={studentId}
                setStudentId={setStudentId}
                studentPassword={studentPassword}
                setStudentPassword={setStudentPassword}
                errorMessage={studentErrorMessage && t(studentErrorMessage)}
                checkbox={checkbox}
              />
            )}
            {loginType === LOGIN_TYPES.EMAIL && (
              <LoginWithEmail
                onLogin={handleEmailLogin}
                onForgotPasswordChange={() => {
                  setLoginType(LOGIN_TYPES.FORGET_PASS);
                }}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                errorMessage={emailErrorMessage && t(emailErrorMessage)}
                checkbox={checkbox}
              />
            )}
            {loginType === LOGIN_TYPES.OTP && (
              <OtpVerification
                phoneNumber={phoneNumber}
                onVerify={handleOtpVerification}
                errorMessage={otpErrorMessage && t(otpErrorMessage)}
                isLoading={isLoading}
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
              />
            )}
            {loginType === LOGIN_TYPES.FORGET_PASS && (
              <ForgotPass
                onGoBack={() => {
                  setLoginType(LOGIN_TYPES.EMAIL);
                }}
              />
            )}
          </>
          <LoginSwitch
            loginType={loginType}
            onSwitch={handleSwitch}
            checkbox={checkbox}
            onCheckboxChange={setCheckbox}
            onResend={
              loginType === LOGIN_TYPES.OTP ? handleResendOtp : () => { }
            }
            showResendOtp={showResendOtp}
            counter={counter}
            onTermsClick={() => setShowTandC(true)}
            onGoogleSignIn={handleGoogleSignIn}
            otpExpiryCounter={otpExpiryCounter}
          />
          {isInputFocus && <div ref={scollToRef} id="scroll"></div>}
          <Loading isLoading={sentOtpLoading} />
        </>
      )}
    </div>
  );
};

export default LoginScreen;
