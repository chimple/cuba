import { Capacitor } from '@capacitor/core';
import { IonText } from '@ionic/react';
import { t } from 'i18next';
import React from 'react';
import LoginWithStudentID from '../components/signup/LoginWithStudentID';
import LanguageDropdown from '../components/signup/LanguageDropdown';
import OtpVerification from '../components/signup/OtpVerification';
import LoginWithEmail from '../components/signup/LoginWithEmail';
import LoginWithPhone from '../components/signup/LoginWithPhone';
import LoginSwitch from '../components/signup/LoginSwitch';
import ForgotPass from '../components/signup/ForgotPass';
import Loading from '../components/Loading';
import { LOGIN_TYPES } from '../common/constants';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { useLoginScreenController } from './useLoginScreenController';
import './LoginScreen.css';

const LoginScreen: React.FC = () => {
  const {
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
  } = useLoginScreenController();

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
            style={{ display: showTandC ? 'block' : 'none' }}
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
                src={loginTermsUrl}
                title="Terms and Conditions"
                allowFullScreen={true}
                style={{ height: '80vh', width: '100%', border: 'none' }}
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
                  style={{ color: '#f34d08' }}
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
              src={'/assets/loginAssets/ChimpleLogo.svg'}
              alt="Chimple Logo"
              className="Loginscreen-chimple-login-logo"
              style={
                (loginType as string) !== LOGIN_TYPES.PHONE
                  ? {
                      maxWidth: window.matchMedia('(orientation: landscape)')
                        .matches
                        ? '120px'
                        : '138px',
                    }
                  : undefined
              }
            />
          ) : (
            <div className="Loginscreen-chimple-login-logo-otp-container">
              <p>{t('Verify Your Number')}</p>
              <img
                src={'/assets/loginAssets/MascotForOTP.svg'}
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
                errorMessage={authErrors.phone && t(authErrors.phone)}
                checkbox={checkbox}
                onFocus={async () => {
                  if (
                    Capacitor.getPlatform() === 'android' &&
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
                errorMessage={authErrors.student && t(authErrors.student)}
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
                errorMessage={authErrors.email && t(authErrors.email)}
                checkbox={checkbox}
              />
            )}
            {loginType === LOGIN_TYPES.OTP && (
              <OtpVerification
                phoneNumber={phoneNumber}
                onVerify={handleOtpVerification}
                errorMessage={authErrors.otp && t(authErrors.otp)}
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
              loginType === LOGIN_TYPES.OTP ? handleResendOtp : () => {}
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
