import React, { useEffect, useRef, useState } from "react";

import "./OtpVerification.css";
import { t } from "i18next";

const OTP_LENGTH = 6;

interface OtpVerificationProps {
  phoneNumber: string;
  onVerify: (otp: string) => void;
  errorMessage?: string | null;
  isLoading: boolean;
  verificationCode?: string;
  setVerificationCode?: (code: string) => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  phoneNumber,
  onVerify,
  errorMessage,
  isLoading,
  verificationCode,
  setVerificationCode,
}) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Update OTP when verificationCode changes (for auto OTP reading)
  useEffect(() => {
    if (verificationCode && verificationCode.length === OTP_LENGTH) {
      const newOtp = verificationCode.split("");
      setOtp(newOtp);
      // Auto verify when OTP is received
      onVerify(verificationCode);
    }
  }, [verificationCode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const newOtp = [...otp];
    newOtp[idx] = val[0];
    setOtp(newOtp);
    if (setVerificationCode) {
      setVerificationCode(newOtp.join(""));
    }

    if (idx < OTP_LENGTH - 1) {
      if (inputsRef.current[idx + 1]) {
        inputsRef.current[idx + 1]!.focus();
      }
    }

    // Check if all inputs are filled
    if (newOtp.every((digit) => digit !== "")) {
      const enteredOtp = newOtp.join("");
      onVerify(enteredOtp);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
        if (setVerificationCode) {
          setVerificationCode(newOtp.join(""));
        }
      } else if (idx > 0) {
        if (inputsRef.current[idx - 1]) {
          inputsRef.current[idx - 1]!.focus();
        }
        const newOtp = [...otp];
        newOtp[idx - 1] = "";
        setOtp(newOtp);
        if (setVerificationCode) {
          setVerificationCode(newOtp.join(""));
        }
      }
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!paste) return;
    const newOtp = [...otp];
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = paste[i] || "";
    }
    setOtp(newOtp);
    if (setVerificationCode) {
      setVerificationCode(newOtp.join(""));
    }

    // Focus last filled
    for (let i = 0; i < OTP_LENGTH; i++) {
      if (!newOtp[i]) {
        if (inputsRef.current[i]) {
          inputsRef.current[i]!.focus();
        }
        return;
      }
    }
    if (inputsRef.current[OTP_LENGTH - 1]) {
      inputsRef.current[OTP_LENGTH - 1]!.focus();
    }
    e.preventDefault();

    // Check if all inputs are filled
    if (newOtp.every((digit) => digit !== "")) {
      const enteredOtp = newOtp.join("");
      onVerify(enteredOtp);
    }
  };

  return (
    <div className="OtpVerification-method">
      <div className="OtpVerification-title">
        {phoneNumber && t("Enter the OTP sent to +91", { phoneNumber })}
      </div>
      <div className="OtpVerification-inputs">
        {[...Array(OTP_LENGTH)].map((_, i) => (
          <input
            key={i}
            maxLength={1}
            className={`OtpVerification-box ${errorMessage ? "error" : ""}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={otp[i]}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            autoFocus={i === 0}
            disabled={isLoading}
          />
        ))}
      </div>
      {errorMessage && (
        <div className="OtpVerification-error">{errorMessage}</div>
      )}
    </div>
  );
};

export default OtpVerification;
