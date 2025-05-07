import { t } from "i18next";
import React, { useState } from "react";
import {
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { eye, eyeOff } from "ionicons/icons";
import "./LoginWithEmail.css";
import { ServiceConfig } from "../services/ServiceConfig";
import BackButton from "./common/BackButton";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onForgotPasswordChange?: (show: boolean) => void;
  showIcons?: boolean;
  onLoginClick?: (loginClick: boolean) => void;
  errorOccurred?: boolean;
  onEmailClick?: (loginClick: boolean) => void;
}

const LoginWithEmail: React.FC<LoginProps> = ({
  onLogin,
  onForgotPasswordChange,
  onLoginClick,
  errorOccurred = false,
  onEmailClick,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) =>
    password.length >= 6 && !/\s/.test(password);

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    await onLogin(email, password);
  };

  const handleSendResetLink = async () => {
    if (!validateEmail(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      setForgotMessage("");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    const authInstance = ServiceConfig.getI().authHandler;
    const res = await authInstance.sendResetPasswordEmail(forgotEmail);

    if (res) {
      setForgotMessage("Please check your mail and confirm.");
    } else {
      setForgotError("Something went wrong. Please try again.");
    }
    setForgotLoading(false);
  };

  return (
    <div className="login-form">
      <div className={showForgotPassword ? "login-header" : ""}>
        <div className="login-header-left">
          {showForgotPassword && (
            <BackButton
              onClicked={() => {
                setShowForgotPassword(false);
                setForgotEmail("");
                setForgotError("");
                setForgotMessage("");
                onForgotPasswordChange?.(false);
                errorOccurred = false;
              }}
            />
          )}
        </div>
        <div className="login-header-center">
          <img
            id="login-with-email-chimple-logo"
            alt="Chimple Brand Logo"
            src="assets/icons/ChimpleBrandLogo.svg"
          />
        </div>
        <div className="login-header-right" />
      </div>
      <p id="chimple-brand-text2">{t("Discovering the joy of learning")}</p>

      {!showForgotPassword ? (
        <div className="login-with-email-text-box-main-div">
          <div className="login-with-email-text-box-div">
            <p className="login-with-email-label">{t("Email")}</p>
            <IonItem className="custom-email-input" lines="none">
              <IonLabel position="floating" className="label-floating">
                {t("Enter your email")}
              </IonLabel>
              <IonInput
                type="email"
                value={email}
                className="login-with-email-input"
                aria-label={t("Enter your email") || ""}
                onIonChange={(e) => setEmail(e.detail.value!)}
              />
            </IonItem>
          </div>

          <div className="login-with-email-text-box-div">
            <p className="login-with-email-label">{t("Password")}</p>
            <div className="login-with-email-password">
              <IonItem className="custom-email-input" lines="none">
                <IonLabel position="floating" className="label-floating">
                  {t("Enter your password")}
                </IonLabel>
                <IonInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="login-with-email-input"
                  onIonChange={(e) => setPassword(e.detail.value!)}
                />
                <IonIcon
                  slot="end"
                  icon={showPassword ? eye : eyeOff}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="login-with-email-eye-icon"
                />
              </IonItem>
            </div>
          </div>
          <div className="forgot-password-div">
            <p
              className="forgot-password-text"
              onClick={() => {
                setShowForgotPassword(true);
                onForgotPasswordChange?.(true);
              }}
            >
              {t("forgot password") + "?"}
            </p>
          </div>
          <IonButton
            onClick={handleLogin}
            className="login-with-email-button"
            id="login-with-email-button-inner"
            disabled={!email || !password}
          >
            {t("login")}
          </IonButton>
        </div>
      ) : (
        <>
          {forgotMessage ? (
            <div className="login-with-email-forgot-password">
              <p>
                {forgotMessage} {t("Go to")}{" "}
                <span
                  className="login-link-text"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail("");
                    setForgotError("");
                    setForgotMessage("");
                    onForgotPasswordChange?.(false);
                    onLoginClick?.(true);
                    onEmailClick?.(true);
                  }}
                >
                  {t("login")}
                </span>
              </p>
            </div>
          ) : (
            <div className="email-password-reset-link">
              <div className="login-with-email-forgot-password-text-box ">
                <p className="login-with-email-label">{t("Email")}</p>
                <IonItem className="custom-email-input" lines="none">
                  <IonLabel position="floating" className="label-floating">
                    {t("Enter your email")}
                  </IonLabel>
                  <IonInput
                    type="email"
                    className="login-with-email-input"
                    value={forgotEmail}
                    onIonChange={(e) => setForgotEmail(e.detail.value!)}
                  />
                </IonItem>
              </div>

              <IonButton
                onClick={handleSendResetLink}
                className="login-with-email-button"
                id="login-with-email-button-inner"
                disabled={forgotLoading || !forgotEmail}
              >
                {forgotLoading ? t("sending") + "..." : t("send")}
              </IonButton>

              {forgotError && (
                <IonText color="danger">
                  <p>{t(forgotError)}</p>
                </IonText>
              )}
            </div>
          )}
        </>
      )}
      {error && !showForgotPassword && (
        <IonText color="danger">
          <p className="login-with-email-error-text">{t(error)}</p>
        </IonText>
      )}
      {message && !showForgotPassword && (
        <IonText color="success">
          <p className="login-with-email-error-text">{t(message)}</p>
        </IonText>
      )}
      {errorOccurred && !showForgotPassword && !error && (
        <IonText color="danger">
          <p className="login-with-email-error-text">
            {t("User not Found. Please verify your credentials.")}
          </p>
        </IonText>
      )}
    </div>
  );
};

export default LoginWithEmail;
