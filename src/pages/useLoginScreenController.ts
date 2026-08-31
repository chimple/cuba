import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Keyboard } from '@capacitor/keyboard';
import { Toast } from '@capacitor/toast';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useFeatureValue } from '@growthbook/growthbook-react';
import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import { LanguageOption } from '../components/signup/LanguageDropdown';
import { RoleType } from '../interface/modelInterfaces';
import { ServiceConfig } from '../services/ServiceConfig';
import { schoolUtil } from '../utility/schoolUtil';
import {
  ACTION,
  DOMAIN,
  EVENTS,
  LATEST_TC_VERSION,
  LANGUAGE,
  MODES,
  PAGES,
  LOGIN_TYPES,
  TC_HTML_URL,
} from '../common/constants';
import { APP_LANGUAGES } from '../common/constants';
import { Util } from '../utility/util';
import i18n from '../i18n';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import { useHistory } from 'react-router-dom';
// redux store, slice, hook imports
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { RootState } from '../redux/store';
import {
  AuthState,
  setAuthError,
  setAuthLoading,
  setAuthUser,
  setIsOpsUser,
  setRoles,
  setUser,
} from '../redux/slices/auth/authSlice';
import logger from '../utility/logger';
import {
  buildTermsUrl,
  normalizeTcVersion,
  resolveTermsBaseUrl,
} from '../utility/termsAndConditions';
import { isTeacherAppRole } from '../utility/roleUtil';
import { createLoginCredentialAuthHandlers } from './LoginScreen.credentialAuth';
import { createLoginPrimaryAuthHandlers } from './LoginScreen.primaryAuth';

const NATIVE_LOADING_ANIMATIONS = ['/assets/home.gif'];
const WEB_LOADING_ANIMATIONS = [
  '/assets/home.gif',
  '/assets/hw-book.gif',
  '/assets/profiles-grid.gif',
  '/assets/subjects-book.gif',
];

export const useLoginScreenController = () => {
  const history = useHistory();
  const tcHtmlUrlFeature = useFeatureValue<string>(TC_HTML_URL, '');
  const latestTcVersionFeature = useFeatureValue<number>(LATEST_TC_VERSION, 0);
  const latestTcVersion = normalizeTcVersion(latestTcVersionFeature);
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const { error: authErrors, loading: isLoading } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const dispatch = useAppDispatch();

  const [counter, setCounter] = useState(59);
  const [showTimer, setShowTimer] = useState(false);
  const [showResendOtp, setShowResendOtp] = useState(false);
  const [sentOtpLoading, setSentOtpLoading] = useState(false);
  const [checkbox, setCheckbox] = useState(true);
  const [showTandC, setShowTandC] = useState(false);
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currentLang, setCurrentLang] = useState<string>(
    Object.keys(APP_LANGUAGES)[0],
  );
  const [isPromptNumbers, setIsPromptNumbers] = useState<boolean>(false);
  const PortPlugin = registerPlugin<any>('Port');
  const phoneNumberErrorRef = useRef<any>(null);

  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState<boolean>(false);
  const [disableOtpButtonIfSameNumber, setDisableOtpButtonIfSameNumber] =
    useState<boolean>(false);
  const [allowSubmittingOtpCounter, setAllowSubmittingOtpCounter] =
    useState<number>(0);
  const [currentPhone, setCurrentPhone] = useState<any>();
  const [title, setTitle] = React.useState('');
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [otpExpiryCounter, setOtpExpiryCounter] = useState(15);
  const [animatedLoading, setAnimatedLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);
  const [showStudentCredentialLogin, setStudentCredentialLogin] =
    useState<boolean>(false);

  const loginTermsBaseUrl = resolveTermsBaseUrl(tcHtmlUrlFeature);
  const loginTermsUrl = loginTermsBaseUrl
    ? buildTermsUrl(loginTermsBaseUrl, currentLang)
    : 'assets/termsandconditions/TermsandConditionsofChimple.html';
  const isNativePlatform = Capacitor.isNativePlatform();

  const loadingMessages = [
    t('Track your learning progress.'),
    t('Preparing 400+ fun lessons.'),
    t('Customize your profiles.'),
    t('Assign or get regular homework.'),
  ];
  // Native WebView GIF decoding happens beside Capacitor bridge work, so keep
  // Android on one animation instead of cycling through every large GIF.
  const loadingAnimations = isNativePlatform
    ? NATIVE_LOADING_ANIMATIONS
    : WEB_LOADING_ANIMATIONS;
  const [loadingAnimationsIndex, setLoadingAnimationsIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % loadingMessages.length,
      );
      setLoadingAnimationsIndex(
        (prevIndex) => (prevIndex + 1) % loadingAnimations.length,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [loadingAnimations.length, loadingMessages.length]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // lock orientation if native
        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: 'portrait' });
        }

        // language
        const appLang = localStorage.getItem(LANGUAGE);
        if (!appLang) {
          localStorage.setItem(LANGUAGE, 'en');
          setCurrentLang('en');
          await i18n.changeLanguage('en');
        } else {
          setCurrentLang(appLang);
          await i18n.changeLanguage(appLang);
        }

        const authHandler = ServiceConfig.getI().authHandler;
        let isLoggedIn = await authHandler.isUserLoggedIn();

        if (!isLoggedIn) {
          Util.migrateSupabaseSession();
          isLoggedIn = await authHandler.isUserLoggedIn();
        }

        if (isLoggedIn) {
          await redirectAuthenticatedUser();
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
          'visibilitychange',
          handleVisibilityChange,
        );
      }
    };
  }, []);

  // Handle visibility change (when app goes into background or foreground)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // App came to foreground
      const authHandler = ServiceConfig.getI().authHandler;
      authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
        if (isUserLoggedIn) {
          void redirectAuthenticatedUser();
        }
      });
    }
  };

  const authInstance = ServiceConfig.getI().authHandler;
  const countryCode = '';

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

  const setUserRoles = async (userId: string) => {
    try {
      const userRoles = await api.getUserSpecialRoles(userId);
      if (userRoles.length > 0) {
        dispatch(setRoles(userRoles));
      }
    } catch (e) {
      logger.error('Error fetching user roles:', e);
    }
  };

  const getSchoolsForUser = async (userId: string) => {
    return (await api.getSchoolsForUser(userId)) || [];
  };

  const redirectAuthenticatedUser = async (): Promise<void> => {
    const currentUser = await authInstance.getCurrentUser();
    if (!currentUser?.id) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const isOpsUser = await api.isSplUser();
    const schools = await getSchoolsForUser(currentUser.id);
    await redirectUser(schools, isOpsUser);
  };

  const redirectUser = async (
    schools: { role: RoleType }[],
    isOpsUser: boolean,
  ) => {
    if (isOpsUser) {
      await ScreenOrientation.unlock();
      schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
      return history.replace(PAGES.SIDEBAR_PAGE);
    } else {
      if (schools.length === 0) {
        schoolUtil.setCurrMode(MODES.PARENT);
        return history.replace(PAGES.DISPLAY_STUDENT);
      }

      // AUTOUSER ? school-mode
      const hasTeacherAppRole = schools.some((school) =>
        isTeacherAppRole(school.role),
      );
      if (hasTeacherAppRole) {
        const authHandler = ServiceConfig.getI()?.authHandler;
        const currentUser = await authHandler?.getCurrentUser();

        schoolUtil.setCurrMode(MODES.TEACHER);
        if (!currentUser?.name || currentUser.name.trim() === '') {
          return history.replace(PAGES.ADD_TEACHER_NAME);
        }
        return history.replace(PAGES.DISPLAY_SCHOOLS);
      }

      const auto = schools.find((s) => s.role === RoleType.AUTOUSER);
      if (auto) {
        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: 'landscape' });
          schoolUtil.setCurrMode(MODES.SCHOOL);
          return history.replace(PAGES.SELECT_MODE);
        } else {
          schoolUtil.setCurrMode(MODES.SCHOOL);
          return history.replace(PAGES.SELECT_MODE);
        }
      }
      const authHandler = ServiceConfig.getI()?.authHandler;
      const currentUser = await authHandler?.getCurrentUser();

      // else teacher
      schoolUtil.setCurrMode(MODES.TEACHER);
      if (!currentUser?.name || currentUser.name.trim() === '') {
        return history.replace(PAGES.ADD_TEACHER_NAME);
      }
      return history.replace(PAGES.DISPLAY_SCHOOLS);
    }
  };

  // Language dropdown options
  const langOptions: LanguageOption[] = Object.entries(APP_LANGUAGES).map(
    ([id, displayName]) => ({ id, displayName }),
  );

  // Handle language change
  const handleLanguageChange = async (selectedLang: string) => {
    if (!selectedLang) return;
    localStorage.setItem(LANGUAGE, selectedLang);
    await i18n.changeLanguage(selectedLang);
    setCurrentLang(selectedLang);
  };

  const { handleEmailLogin, handleStudentLogin } =
    createLoginCredentialAuthHandlers({
      ACTION,
      DOMAIN,
      EVENTS,
      LOGIN_TYPES,
      RoleType,
      authInstance,
      dispatch,
      email,
      getSchoolsForUser,
      latestTcVersion,
      online,
      password,
      presentToast,
      redirectUser,
      schoolCode,
      setAnimatedLoading,
      setAuthError,
      setAuthLoading,
      setAuthUser,
      setEmail,
      setGbUpdated,
      setIsOpsUser,
      setPassword,
      setSchoolCode,
      setStudentCredentialLogin,
      setStudentId,
      setStudentPassword,
      setUser,
      setUserRoles,
      studentId,
      studentPassword,
      t,
      updateLocalAttributes,
    });
  // Add auto phone suggestion functionality
  useEffect(() => {
    initNumberSelectedListner();
  }, []);

  const retriewPhoneNumber = async () => {
    const phoneNumber = await PortPlugin.numberRetrieve();
    if (phoneNumber.number) {
      if (phoneNumberErrorRef.current) {
        phoneNumberErrorRef.current.style.display = 'none';
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
    document.removeEventListener('otpReceived', otpEventListener);
  };

  const isPhoneNumberEventListener = async (event: Event) => {
    await retriewPhoneNumber();
    document.removeEventListener(
      'isPhoneNumberSelected',
      isPhoneNumberEventListener,
    );
  };

  const initNumberSelectedListner = async () => {
    document.addEventListener(
      'isPhoneNumberSelected',
      isPhoneNumberEventListener,
      {
        once: true,
      },
    );
  };

  const initSmsListner = async () => {
    document.addEventListener('otpReceived', otpEventListener, { once: true });
  };

  const {
    handleGoogleSignIn,
    handleOtpBack,
    handleOtpVerification,
    handlePhoneNext,
    handleResendOtp,
    handleSwitch,
  } = createLoginPrimaryAuthHandlers({
    ACTION,
    RoleType,
    Toast,
    authInstance,
    counter,
    allowSubmittingOtpCounter,
    countryCode,
    currentPhone,
    dispatch,
    getSchoolsForUser,
    initSmsListner,
    latestTcVersion,
    loginType,
    online,
    phoneNumber,
    presentToast,
    redirectUser,
    setAllowSubmittingOtpCounter,
    setAnimatedLoading,
    setAuthError,
    setAuthLoading,
    setAuthUser,
    setCounter,
    setCurrentPhone,
    setDisableOtpButtonIfSameNumber,
    setGbUpdated,
    setIsOpsUser,
    setLoginType,
    setPhoneNumber,
    setSentOtpLoading,
    setSpinnerLoading,
    setShowResendOtp,
    setShowTimer,
    setUser,
    setUserRoles,
    setVerificationCode,
    setOtpExpiryCounter,
    title,
    t,
    updateLocalAttributes,
    verificationCode,
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        setIsInputFocus(true);
        setTimeout(() => {
          scollToRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
          });
        }, 50);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setIsInputFocus(false);
      });
    }
  }, []);

  useEffect(() => {
    disableOtpButtonIfSameNumber &&
      allowSubmittingOtpCounter > 0 &&
      setTimeout(
        () => setAllowSubmittingOtpCounter(allowSubmittingOtpCounter - 1),
        1000,
      );
    let str = t(`Send OTP button will be enabled in x seconds`).replace(
      `x`,
      allowSubmittingOtpCounter.toString(),
    );
    setTitle(str);
  }, [allowSubmittingOtpCounter]);

  return {
    PortPlugin,
    allowSubmittingOtpCounter,
    animatedLoading,
    authErrors,
    checkbox,
    counter,
    currentLang,
    currentMessageIndex,
    email,
    handleEmailLogin,
    handleGoogleSignIn,
    handleLanguageChange,
    handleOtpBack,
    handleOtpVerification,
    handlePhoneNext,
    handleResendOtp,
    handleStudentLogin,
    handleSwitch,
    initializing,
    isInputFocus,
    isLoading,
    isPromptNumbers,
    langOptions,
    loadingAnimations,
    loadingAnimationsIndex,
    loadingMessages,
    loginTermsUrl,
    loginType,
    otpExpiryCounter,
    password,
    phoneNumber,
    schoolCode,
    scollToRef,
    sentOtpLoading,
    setCheckbox,
    setEmail,
    setIsPromptNumbers,
    setLoginType,
    setPassword,
    setPhoneNumber,
    setSchoolCode,
    setShowTandC,
    setStudentId,
    setStudentPassword,
    setVerificationCode,
    showResendOtp,
    showTandC,
    studentId,
    studentPassword,
    verificationCode,
  };
};
