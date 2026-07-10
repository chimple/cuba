import { t } from "i18next";
import { useEffect, useRef, useState } from "react";

import { NUMBER_REGEX } from "../../common/constants";
import "./LoginWithPhone.css";

interface LoginWithPhoneProps {
  onNext: () => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  errorMessage?: string | null;
  checkbox: boolean;
  onFocus?: () => Promise<void>;
}

const LoginWithPhone: React.FC<LoginWithPhoneProps> = ({ onNext, phoneNumber, setPhoneNumber, errorMessage, checkbox, onFocus }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const Buttoncolors = {
    Default: "#8A8A8A",
    Valid: "#F34D08",
  };

  const [currentButtonColor, setCurrentButtonColor] = useState<string>(
    phoneNumber.length === 10 && checkbox ? Buttoncolors.Valid : Buttoncolors.Default
  );

  // Update button color when phoneNumber changes
  useEffect(() => {
    setCurrentButtonColor(phoneNumber.length === 10 && checkbox ? Buttoncolors.Valid : Buttoncolors.Default);
  }, [phoneNumber, checkbox]);

  return (
    <div className="LoginWithPhone-login-method">
      <div className="LoginWithPhone-login-method-content">
        <span className="LoginWithPhone-login-with-phone-text">{t("Login / SignUp")}</span>

        <div className="LoginWithPhone-phone-input-wrapper">
          <span className="LoginWithPhone-country-code">+91</span>
          <input
            ref={inputRef}
            type="tel"
            placeholder={t("Enter your mobile number") || ""}
            aria-label={t("Enter your mobile number") || ""}
            maxLength={10}
            value={phoneNumber}
            onFocus={onFocus}
            onChange={(input) => {
              const value = input.target.value;
              if (value && NUMBER_REGEX.test(value)) {
                setPhoneNumber(value);
              } else if (!value) {
                setPhoneNumber("");
              }
            }}
            className="LoginWithPhone-login-phone-input"
          />
        </div>
        {errorMessage && (
          <span className="LoginWithPhone-login-error-message">{errorMessage}</span>
        )}

        <button
          disabled={phoneNumber.length !== 10 || !checkbox}
          onClick={onNext}
          style={{
            backgroundColor: currentButtonColor,
          }}
          className="LoginWithPhone-login-with-phone-button"
        >
          {t("START")}
        </button>
      </div>
    </div>
  );
};

export default LoginWithPhone;
