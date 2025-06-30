import { useState, useEffect } from "react";
import { t } from "i18next";
import "./ProfileDetails.css";
import InputWithIcons from "../common/InputWithIcons";
import SelectWithIcons from "../common/SelectWithIcons";
import { Util } from "../../utility/util";

type ProfileDetailsProps = {
  mode: "all-required" | "name-required" | "all-optional";
};

const ProfileDetails = ({ mode }: ProfileDetailsProps) => {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    Util.loadBackgroundImage();
  }, []);

  useEffect(() => {
    setHasChanges(true);
  }, [fullName, age, language, gender]);

  const isFormComplete =
    mode === "all-required"
      ? fullName && age && language && gender
      : mode === "name-required"
      ? fullName
      : true;

  const shouldShowSkip = mode === "all-optional";
  const isSaveEnabled =
    mode === "all-required" || mode === "name-required"
      ? isFormComplete
      : hasChanges;

  return (
    <div className="profiledetails-container">
      <div className="profiledetails-avatar-form">
        <div className="profiledetails-avatar-section">
          <img
            src="assets/avatars/monkey.png"
            className="profiledetails-avatar-image"
          />
        </div>

        <div className="profiledetails-form-fields">
          {mode !== "all-optional" && (
            <div className="profiledetails-required-indicator">
              {t("* Indicates Required Information")}
            </div>
          )}

          <div className="profiledetails-full-name">
            <InputWithIcons
              label={t("Full Name")}
              placeholder={t("Name Surname")}
              value={fullName}
              setValue={setFullName}
              icon="/assets/icons/BusinessCard.svg"
              required={mode === "all-required" || mode === "name-required"}
            />
          </div>

          <div className="profiledetails-row-group">
            <div className="profiledetails-flex-item">
              <SelectWithIcons
                label={t("Age")}
                value={age}
                setValue={setAge}
                icon="/assets/icons/age.svg"
                options={[
                  { value: "≤4", label: t("≤4 years") },
                  { value: "5", label: t("5 years") },
                  { value: "6", label: t("6 years") },
                  { value: "7", label: t("7 years") },
                  { value: "≥10", label: t("≥10 years") },
                ]}
                required={mode === "all-required"}
              />
            </div>

            <div className="profiledetails-flex-item">
              <SelectWithIcons
                label={t("Language")}
                value={language}
                setValue={setLanguage}
                icon="/assets/icons/language.svg"
                options={[
                  { value: "English", label: t("English") },
                  { value: "Hindi", label: t("हिंदी") },
                  { value: "Kannada", label: t("ಕನ್ನಡ") },
                  { value: "Marathi", label: t("मराठी") },
                ]}
                required={mode === "all-required"}
              />
            </div>
          </div>

          <fieldset className="profiledetails-form-group profiledetails-gender-fieldset">
            <legend className="profiledetails-gender-label">
              {t("Gender")}{" "}
              {mode === "all-required" && (
                <span className="profiledetails-required">*</span>
              )}
            </legend>
            <div className="profiledetails-gender-buttons">
              {["GIRL", "BOY", "UNSPECIFIED"].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`profiledetails-gender-btn ${
                    gender === g ? "selected" : ""
                  }`}
                  onClick={() => setGender(g)}
                >
                  <img
                    src={`/assets/icons/${g.toLowerCase()}.svg`}
                    alt={`${g} icon`}
                  />{" "}
                  {t(g)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="profiledetails-button-group">
            {shouldShowSkip && (
              <button
                className="profiledetails-skip-button"
                onClick={() => {}}
              >
                {t("SKIP FOR NOW")}
              </button>
            )}
            <button
              className="profiledetails-save-button"
              disabled={!isSaveEnabled}
              onClick={() => {}}
            >
              {t("SAVE")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;