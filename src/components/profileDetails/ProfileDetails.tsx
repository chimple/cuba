import { useEffect, useState } from "react";
import { t } from "i18next";
import "./ProfileDetails.css";
import InputWithIcons from "../common/InputWithIcons";
import SelectWithIcons from "../common/SelectWithIcons";
import { Util } from "../../utility/util";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { initializePersonalDetailsClickListener } from "../../analytics/clickUtilsProfileDetails";
import { SupabaseAuth } from "../../services/auth/SupabaseAuth";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, TableTypes } from "../../common/constants";
import { useHistory } from "react-router";

const getModeFromFeature = (
  variation: string
): "all-required" | "name-required" | "all-optional" => {
  switch (variation) {
    case "After Login Control":
      return "all-required";
    case "After Login V1":
      return "name-required";
    case "After Login V2":
      return "all-optional";
    default:
      return "all-required";
  }
};

const ProfileDetails = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const variation = useFeatureValue<string>(
    "after-login-screen",
    "After Login Control"
  );
  const mode = getModeFromFeature(variation);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [languageId, setLanguageId] = useState(""); 
  const [languages, setLanguages] = useState<TableTypes<"language">[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    Util.loadBackgroundImage();
  }, []);

  useEffect(() => {
    const cleanup = initializePersonalDetailsClickListener();
    return cleanup;
  }, []);

  useEffect(() => {
    setHasChanges(true);
  }, [fullName, age, gender, languageId]);

  useEffect(() => {
    const loadLanguages = async () => {
      const langs = await api.getAllLanguages();
      setLanguages(langs);
    };
    loadLanguages();
  }, []);

  const isFormComplete =
    mode === "all-required"
      ? fullName && age && languageId && gender
      : mode === "name-required"
      ? fullName
      : true;

  const shouldShowSkip = mode === "all-optional";
  const isSaveEnabled =
    mode === "all-required" || mode === "name-required"
      ? isFormComplete
      : hasChanges;

  const handleSave = async () => {
    try {
      const user = await SupabaseAuth.i.getCurrentUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      await api.updateUserProfile(
        user,
        fullName,
        user.email ?? "",
        user.phone ?? "",
        languageId,
        undefined,
        {
          age,
          gender,
        }
      );

      history.replace(PAGES.HOME);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

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
              id="click_on_profile_details_full_name"
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
                id="click_on_profile_details_age"
                label={t("Age")}
                value={age}
                setValue={setAge}
                icon="/assets/icons/age.svg"
                optionId={`click_on_profile_details_age_option_` + age}
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
                id="click_on_profile_details_language"
                label={t("Language")}
                value={languageId}
                setValue={setLanguageId}
                icon="/assets/icons/language.svg"
                optionId={`click_on_profile_details_language_option_` + languageId}
                options={languages.map((lang) => ({
                  value: lang.id,
                  label: t(lang.name),
                }))}
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
                  id={`click_on_profile_details_gender_${g.toLowerCase()}`}
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
                id="click_on_profile_details_skip"
                className="profiledetails-skip-button"
                onClick={() => history.replace(PAGES.HOME)}
              >
                {t("SKIP FOR NOW")}
              </button>
            )}
            <button
              id="click_on_profile_details_save"
              className="profiledetails-save-button"
              disabled={!isSaveEnabled}
              onClick={handleSave}
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