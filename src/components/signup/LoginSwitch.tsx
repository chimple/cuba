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
  onResend?: () => void;
  counter?: number;
  showResendOtp?: boolean;
}

const LoginSwitch: React.FC<LoginSwitchProps> = ({
  loginType,
  onSwitch,
  checkbox,
  onCheckboxChange,
  onTermsClick,
  onGoogleSignIn,
  otpExpiryCounter,
  onResend,
  counter,
  showResendOtp,
}) => {
  return (
    <div className="LoginSwitch-other-ways">
      {loginType !== "forgot-pass" && (
        <>
          {loginType !== "otp" ? (
            <>
              <div className="LoginSwitch-other-ways-header">
                <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
                <span>{t("Other ways to login")}</span>
                <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
              </div>
              <div className="LoginSwitch-other-ways-options">
                {loginType !== "google" && (
                  <div
                    className={`LoginSwitch-switch-option ${!checkbox ? "disabled" : ""}`}
                    onClick={() => checkbox && onGoogleSignIn()}
                    style={{
                      opacity: checkbox ? 1 : 0.5,
                      cursor: checkbox ? "pointer" : "not-allowed",
                    }}
                  >
                    <img
                      className="LoginSwitch-switch-option-img"
                      src="/assets/loginAssets/Google.svg"
                      alt="google"
                    />
                    <span>{t("Google")}</span>
                  </div>
                )}
                {loginType !== "phone" && (
                  <div
                    className="LoginSwitch-switch-option"
                    onClick={() => onSwitch("phone")}
                  >
                    <img
                      src="/assets/loginAssets/Mobile.svg"
                      alt=""
                      className="LoginSwitch-switch-option-img"
                    />
                    <span>{t("Mobile")}</span>
                  </div>
                )}
                {loginType !== "student" && (
                  <div
                    className="LoginSwitch-switch-option"
                    onClick={() => onSwitch("student")}
                  >
                    <img
                      className="LoginSwitch-switch-option-img"
                      src="/assets/loginAssets/Student_ID.svg"
                      alt="studentId"
                    />
                    <span>{t("student id")}</span>
                  </div>
                )}
                {loginType !== "email" && (
                  <div
                    className="LoginSwitch-switch-option"
                    onClick={() => onSwitch("email")}
                  >
                    <img
                      className="LoginSwitch-switch-option-img"
                      src="/assets/loginAssets/Email.svg"
                      alt=""
                    />
                    <span>{t("Email")}</span>
                  </div>
                )}
              </div>
              <div className="LoginSwitch-terms-condition">
                <div className="LoginSwitch-terms-checkbox-label">
                  <label>
                    <input
                      type="checkbox"
                      className="LoginSwitch-terms-checkbox-input"
                      checked={checkbox}
                      onChange={(e) => onCheckboxChange(e.target.checked)}
                    />
                    <span className="LoginSwitch-terms-custom-checkbox"></span>
                  </label>
                  <span>
                    {t("I agree to the")}{" "}
                    <span
                      className="LoginSwitch-terms-link"
                      onClick={onTermsClick}
                    >
                      {t("Terms & Conditions")}
                    </span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="LoginSwitch-otp-expiry-container">
              <div className="LoginSwitch-otp-expiry-header">
                <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
                <span className="LoginSwitch-otp-expiry-text">
                  {t("Your OTP will expire in {{minutes}} minutes", { minutes: otpExpiryCounter })}
                </span>
                <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
              </div>
              <button
                disabled={(counter ?? 0) > 0 ? true : false}
                className="LoginSwitch-otp-resend-link"
                onClick={onResend}
              >
                  {t("Resend OTP")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoginSwitch;
