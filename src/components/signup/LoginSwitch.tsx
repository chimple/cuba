import React from "react";
import "./LoginSwitch.css";
import { t } from "i18next";
import { Trans } from "react-i18next";
import { LOGIN_TYPES } from "../../common/constants";

interface LoginSwitchProps {
  loginType: LOGIN_TYPES;
  onSwitch: (
    type: LOGIN_TYPES.PHONE | LOGIN_TYPES.STUDENT | LOGIN_TYPES.EMAIL
  ) => void;
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
  if (loginType === LOGIN_TYPES.FORGET_PASS) return <div className="LoginSwitch-other-ways"></div>;

  return (
    <div className="LoginSwitch-other-ways">
      {loginType === LOGIN_TYPES.OTP ? (
        <div className="LoginSwitch-otp-expiry-container">
          <div className="LoginSwitch-otp-expiry-header">
            <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
            <span className="LoginSwitch-otp-expiry-text">
              {t("Your OTP will expire in {{minutes}} minutes", {
                minutes: otpExpiryCounter,
              })}
            </span>
            <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
          </div>
          <button
            disabled={!(showResendOtp && (counter ?? 0) <= 0)}
            className="LoginSwitch-otp-resend-link"
            onClick={onResend}
          >
            {t("Resend OTP")}
          </button>
        </div>
      ) : (
        <>
          <div className="LoginSwitch-other-ways-header">
            <img src="/assets/loginAssets/LoginStripe1.svg" alt="" />
            <span>{t("Other ways to login")}</span>
            <img src="/assets/loginAssets/LoginStripe2.svg" alt="" />
          </div>

          <div className="LoginSwitch-other-ways-options">
            {/* Google Login - Always show */}
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

            {/* Student ID Login - only if not active */}
            {loginType !== LOGIN_TYPES.STUDENT && (
              <div
                className="LoginSwitch-switch-option"
                onClick={() => onSwitch(LOGIN_TYPES.STUDENT)}
              >
                <img
                  className="LoginSwitch-switch-option-img"
                  src="/assets/loginAssets/Student_ID.svg"
                  alt="studentId"
                />
                <span>{t("Student Id")}</span>
              </div>
            )}

            {/* Email Login - only if not active */}
            {loginType !== LOGIN_TYPES.EMAIL && (
              <div
                className="LoginSwitch-switch-option"
                onClick={() => onSwitch(LOGIN_TYPES.EMAIL)}
              >
                <img
                  className="LoginSwitch-switch-option-img"
                  src="/assets/loginAssets/Email.svg"
                  alt="email"
                />
                <span>{t("Email")}</span>
              </div>
            )}

            {/* Phone Login - only if not active */}
            {loginType !== LOGIN_TYPES.PHONE && (
              <div
                className="LoginSwitch-switch-option"
                onClick={() => onSwitch(LOGIN_TYPES.PHONE)}
              >
                <img
                  className="LoginSwitch-switch-option-img"
                  src="/assets/loginAssets/Mobile.svg"
                  alt="phone"
                />
                <span>{t("Phone")}</span>
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
              <span className="LoginSwitch-terms-text">
                <Trans
                  i18nKey="I agree to the <1>Terms & Conditions</1>"
                  components={{
                    1: (
                      <span
                        className="LoginSwitch-terms-link"
                        onClick={onTermsClick}
                        key="terms"
                      />
                    ),
                  }}
                />
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginSwitch;
