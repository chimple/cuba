import React from "react";

import "./LoginSwitch.css";
import { t } from "i18next";

interface LoginSwitchProps {
  loginType: string;
  onSwitch: (type: string) => void;
  checkbox: boolean;
  onCheckboxChange: (checked: boolean) => void;
  onTermsClick: () => void;
  onGoogleSignIn: () => Promise<void>;
  otpExpiryCounter: number;
}

const LoginSwitch: React.FC<LoginSwitchProps> = ({ loginType, onSwitch, checkbox, onCheckboxChange, onTermsClick, onGoogleSignIn, otpExpiryCounter }) => {
  return (
    <div className="login-other-ways">
      {loginType !== "forgot-pass" && (
        <>
          {loginType !== "otp" ? (
            <>
              <div className="login-other-ways-header">
                <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
                <span>{t("Other ways to login")}</span>
                <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
              </div>
              <div className="login-other-ways-options">
                {loginType !== "google" && (
                  <div
                    className={`login-switch-option ${!checkbox ? 'disabled' : ''}`}
                    onClick={() => checkbox && onGoogleSignIn()}
                    style={{ 
                      opacity: checkbox ? 1 : 0.5,
                      cursor: checkbox ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <img
                      className="login-switch-option-img"
                      src="/assets/loginAssets/Google.svg"
                      alt="google"
                    />
                    <span>{t("Google")}</span>
                  </div>
                )}
                {loginType !== "phone" && (
                  <div
                    className="login-switch-option"
                    onClick={() => onSwitch("phone")}
                  >
                    <img src="/assets/loginAssets/Mobile.svg" alt="" />
                    <span>{t("Mobile")}</span>
                  </div>
                )}
                {loginType !== "student" && (
                  <div
                    className="login-switch-option"
                    onClick={() => onSwitch("student")}
                  >
                    <img
                      className="login-switch-option-img"
                      src="/assets/loginAssets/Student_ID.svg"
                      alt="studentId"
                    />
                    <span>{t("student id")}</span>
                  </div>
                )}
                {loginType !== "email" && (
                  <div
                    className="login-switch-option"
                    onClick={() => onSwitch("email")}
                  >
                    <img
                      className="login-switch-option-img"
                      src="/assets/loginAssets/Email.svg"
                      alt=""
                    />
                    <span>{t("Email")}</span>
                  </div>
                )}
              </div>
              <div className="login-terms-condition">
                <div className="terms-checkbox-label">
                  <label>
                    <input 
                      type="checkbox" 
                      className="terms-checkbox-input"
                      checked={checkbox}
                      onChange={(e) => onCheckboxChange(e.target.checked)}
                    />
                    <span className="terms-custom-checkbox"></span>
                  </label>
                  <span>
                    {t("I agree to the")}{" "}
                    <span className="login-terms-link" onClick={onTermsClick}>
                      {t("Terms & Conditions")}
                    </span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="otp-expiry-container">
              <div className="otp-expiry-header">
                <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
                <span className="otp-expiry-text">
                  {t("Your OTP will expire in")} {otpExpiryCounter} {otpExpiryCounter === 1 ? t("minutes"): t("minutes")}
                </span>
                <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
              </div>
              <div className="otp-resend-link">
                <span className="otp-resend-anchor">
                 {t("Resend OTP")}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoginSwitch;
