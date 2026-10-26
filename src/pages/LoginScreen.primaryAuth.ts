import { Capacitor } from '@capacitor/core';
import { EVENTS, LOGIN_TYPES } from '../common/constants';
import { Util } from '../utility/util';
import logger from '../utility/logger';

export const createLoginPrimaryAuthHandlers = (ctx: any) => {
  const {
    ACTION,
    RoleType,
    Toast,
    authInstance,
    counter,
    countryCode,
    currentPhone,
    dispatch,
    getSchoolsForUser,
    initSmsListner,
    latestTcVersion,
    allowSubmittingOtpCounter,
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
  } = ctx;
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
            duration: 'long',
          });
          return;
        }
      } else {
        setDisableOtpButtonIfSameNumber(false);
        setAllowSubmittingOtpCounter(0);
      }

      if (phoneNumber.length !== 10) {
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.PHONE,
            message: t('Please Enter 10 digit Mobile Number'),
          }),
        );
        return;
      }

      setSentOtpLoading(true);
      setSpinnerLoading(true);
      let phoneNumberWithCountryCode = countryCode + phoneNumber;
      initSmsListner();
      let result = await authInstance.generateOtp(
        phoneNumberWithCountryCode,
        'Chimple',
      );

      if (result.success) {
        setSentOtpLoading(false);
        setSpinnerLoading(false);
        setCounter(59);
        setShowTimer(true);
        setLoginType(LOGIN_TYPES.OTP);
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.PHONE,
            message: null,
          }),
        );
        setCurrentPhone(phoneNumber);
        setDisableOtpButtonIfSameNumber(true);
        setAllowSubmittingOtpCounter(counter);
      } else {
        setSentOtpLoading(false);
        setSpinnerLoading(false);
        const errorMessage = result.error;
        if (errorMessage) {
          dispatch(
            setAuthError({
              key: LOGIN_TYPES.PHONE,
              message: t(
                'Kindly wait for 1 minute and then try logging in again.',
              ),
            }),
          );
        } else {
          dispatch(
            setAuthError({
              key: LOGIN_TYPES.PHONE,
              message: t('Phone Number signin Failed. Please try again later.'),
            }),
          );
        }
      }
    } catch (error: any) {
      setSentOtpLoading(false);
      setSpinnerLoading(false);
      // This catch block handles unexpected exceptions from generateOtp, not errors returned in the 'result' object.
      let displayErrorMessage = t(
        'Phone Number signin Failed. Please try again later.',
      );
      if (error && typeof error === 'string') {
        displayErrorMessage = error;
      } else if (error && error.message) {
        displayErrorMessage = error.message;
      }
      dispatch(
        setAuthError({
          key: LOGIN_TYPES.PHONE,
          message: displayErrorMessage,
        }),
      );
    }
  };

  // Handler for going back from OTP
  const handleOtpBack = () => {
    if (loginType === LOGIN_TYPES.OTP) {
      setLoginType(LOGIN_TYPES.PHONE);
      setVerificationCode('');
      setPhoneNumber('');
      setShowResendOtp(false);
      setShowTimer(false);
      dispatch(setAuthError({ key: LOGIN_TYPES.OTP, message: null }));
      setOtpExpiryCounter(15); // Reset the expiry counter
    } else if (loginType === LOGIN_TYPES.FORGET_PASS) {
      setLoginType(LOGIN_TYPES.EMAIL);
      dispatch(setAuthError({ key: LOGIN_TYPES.EMAIL, message: '' }));
    }
  };

  // Handler for OTP verification
  const handleOtpVerification = async (otp: string) => {
    try {
      setAnimatedLoading(true);
      dispatch(setAuthLoading(true));
      dispatch(setAuthError({ key: LOGIN_TYPES.OTP, message: null })); // Clear any previous errors

      let phoneNumberWithCountryCode = countryCode + phoneNumber;

      const res = await authInstance.proceedWithVerificationCode(
        phoneNumberWithCountryCode,
        otp.trim(),
        latestTcVersion,
      );

      if (!res?.user || !res?.userData) {
        // Handle the case where verification succeeded but no user was returned
        throw new Error('Verification failed - no user data');
      }
      // Store user data and proceed with navigation
      const user = res.user;
      dispatch(setAuthUser(user));
      dispatch(setUser(res.userData));
      dispatch(setIsOpsUser(res.isSpl));
      await setUserRoles(user.id);
      const studentDetails = {
        ...res.userData,
        parent_id: user.id,
        last_sign_in_at: user.last_sign_in_at,
        login_method: 'phone-number',
      };
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_id: user.id,
        user_name: res.userData.name,
        phone_number: user.phone,
        user_type: RoleType.PARENT,
        action_type: ACTION.LOGIN,
        login_type: 'phone-number',
      });

      const userSchools = await getSchoolsForUser(user.id);
      await redirectUser(userSchools, res.isSpl);

      setAnimatedLoading(false);
    } catch (error) {
      // Handle all state updates for error case at once
      logger.info('Error in OTP verification', error);
      const updates = () => {
        setAnimatedLoading(false);
        dispatch(setAuthLoading(false));
        setVerificationCode('');

        // Set appropriate error message
        if (typeof error === 'string' && error.includes('code-expired')) {
          dispatch(
            setAuthError({
              key: LOGIN_TYPES.OTP,
              message:
                'Verification code has expired. Please request a new one.',
            }),
          );
        } else {
          dispatch(
            setAuthError({
              key: LOGIN_TYPES.OTP,
              message: 'Incorrect OTP - Please check & try again!',
            }),
          );
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
        phoneNumberWithCountryCode,
      );

      if (response) {
        setSentOtpLoading(false);
        setShowResendOtp(false);
        setCounter(59);
        setVerificationCode('');
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.OTP,
            message: null,
          }),
        );
        setOtpExpiryCounter(15); // Reset the expiry counter
      } else {
        setSentOtpLoading(false);
      }
    } catch (error) {
      setSentOtpLoading(false);
      dispatch(
        setAuthError({
          key: LOGIN_TYPES.OTP,
          message: 'Resend Otp Failed!! Please try again after some time.',
        }),
      );
    }
  };

  // Handler for Google Sign In
  const handleGoogleSignIn = async () => {
    if (!online) {
      return presentToast({
        message: t('Device is offline. Login requires an internet connection'),
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [{ text: 'Dismiss', role: 'cancel' }],
      });
    }
    setAnimatedLoading(true);
    try {
      const ok = await authInstance.googleSign(latestTcVersion);
      if (!ok.success) throw new Error('Google sign in failed');
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      if (!ok.user || !ok.userData)
        throw new Error('No user returned from auth handler');

      dispatch(setAuthUser(ok.user));
      dispatch(setUser(ok.userData));
      dispatch(setIsOpsUser(ok.isSpl));
      await setUserRoles(ok.user.id);
      const studentDetails = {
        ...ok.userData,
        parent_id: ok.user.id,
        last_sign_in_at: ok.user.last_sign_in_at,
        login_method: 'google-signin',
      };
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_type: RoleType.PARENT,
        action_type: ACTION.LOGIN,
        login_type: 'google-signin',
      });

      // now safe to use user.id
      const schools = await getSchoolsForUser(ok.user.id);
      await redirectUser(schools, ok.isSpl);
    } catch (e) {
      presentToast({
        message: t('Google sign in failed. Please try again.'),
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [{ text: 'Dismiss', role: 'cancel' }],
      });
      setLoginType(LOGIN_TYPES.PHONE);
    } finally {
      setAnimatedLoading(false);
    }
  };

  return {
    handleGoogleSignIn,
    handleOtpBack,
    handleOtpVerification,
    handlePhoneNext,
    handleResendOtp,
    handleSwitch,
  };
};
