import { useEffect, useState } from "react";
import { t } from "i18next";
import "./ProfileDetails.css";
import InputWithIcons from "../common/InputWithIcons";
import SelectWithIcons from "../common/SelectWithIcons";
import { Util } from "../../utility/util";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { initializeClickListener } from "../../analytics/clickUtil";
import { ServiceConfig } from "../../services/ServiceConfig";
import { ACTION_TYPES, AGE_OPTIONS, EVENTS, FORM_MODES, PAGES, PROFILE_DETAILS_GROWTHBOOK_VARIATION, TableTypes } from "../../common/constants";
import { useHistory } from "react-router";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { FaArrowLeftLong } from "react-icons/fa6";
import { initializeFireBase } from "../../services/Firebase";

const getModeFromFeature = (
  variation: string
) => {
  switch (variation) {
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_CONTROL:
      return FORM_MODES.ALL_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_V1:
      return FORM_MODES.NAME_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_V2:
      return FORM_MODES.ALL_OPTIONAL;
    default:
      return FORM_MODES.ALL_REQUIRED;
  }
};

const ProfileDetails = () => {
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();
  const variation = useFeatureValue<string>(
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_SCREEN,
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_CONTROL
  );
  const mode = getModeFromFeature(variation);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [languageId, setLanguageId] = useState(""); 
  const [languages, setLanguages] = useState<TableTypes<"language">[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    initializeFireBase();
    lockOrientation();
    Util.loadBackgroundImage();
    const cleanup = initializeClickListener();
    const loadLanguages = async () => {
      const langs = await api.getAllLanguages();
      setLanguages(langs);
    };
    loadLanguages();

    return () => {
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    setHasChanges(true);
  }, [fullName, age, gender, languageId]);

  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "landscape" });
    }
  };

  const isFormComplete =
    mode === FORM_MODES.ALL_REQUIRED
      ? fullName && age && languageId && gender
      : mode === FORM_MODES.NAME_REQUIRED
      ? fullName
      : true;

  const shouldShowSkip = mode === FORM_MODES.ALL_OPTIONAL;

  const isSaveEnabled =
    mode === FORM_MODES.ALL_REQUIRED || mode === FORM_MODES.NAME_REQUIRED
      ? isFormComplete
      : hasChanges;

  const handleSave = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        console.error("No user found");
        return;
      }
      const isNewProfile = !user.age && !user.gender;
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

      Util.logEvent(isNewProfile ? EVENTS.PROFILE_CREATED : EVENTS.PROFILE_UPDATED,
      {
        user_id: user.id,
        name: fullName,
        age,
        gender,
        language_id: languageId,
        variation,
        page_path: window.location.pathname,
        action_type: isNewProfile ? ACTION_TYPES.PROFILE_CREATED : ACTION_TYPES.PROFILE_UPDATED,
      }
      );

      history.replace(PAGES.HOME);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  return (
    <div className="profiledetails-container">
      <button
        className="profiledetails-back-button"
        onClick={() => {
          Util.setPathToBackButton(PAGES.HOME, history);
        }}
        aria-label="Back"
        id="click_on_profile_details_back_button"
      >
        <FaArrowLeftLong
          style={{ color: "#f34d08" }}
          className="profiledetails-back-arrow-icon"
        />
      </button>
      <div className="profiledetails-avatar-form">
        <div className="profiledetails-avatar-section">
          <img
            src="assets/avatars/monkeyAvatar.svg"
            className="profiledetails-avatar-image"
          />
        </div>

        <div className="profiledetails-form-fields">
          {mode !== FORM_MODES.ALL_OPTIONAL && (
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
              required={mode === FORM_MODES.ALL_REQUIRED || mode === FORM_MODES.NAME_REQUIRED}
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
                optionId={`click_on_profile_details_age_option_${age}`}
                options={[
                    { value: AGE_OPTIONS.LESS_THAN_EQUAL_4, label: "≤4 years" },
                    { value: AGE_OPTIONS.FIVE, label: "5 years" },
                    { value: AGE_OPTIONS.SIX, label: "6 years" },
                    { value: AGE_OPTIONS.SEVEN, label: "7 years" },
                    { value: AGE_OPTIONS.EIGHT, label: "8 years" },
                    { value: AGE_OPTIONS.NINE, label: "9 years" },
                    { value: AGE_OPTIONS.GREATER_THAN_EQUAL_10, label: "≥10 years" },
                  ]}
                required={mode === FORM_MODES.ALL_REQUIRED}
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
                required={mode === FORM_MODES.ALL_REQUIRED}
              />
            </div>
          </div>

          <fieldset className="profiledetails-form-group profiledetails-gender-fieldset">
            <legend className="profiledetails-gender-label">
              {t("Gender")}{" "}
              {mode === FORM_MODES.ALL_REQUIRED && (
                <span className="profiledetails-required">*</span>
              )}
            </legend>
            <div className="profiledetails-gender-buttons">
                {["GIRL", "BOY", "UNSPECIFIED"].map((g) => {
                  const isSelected = gender === g;
                  const iconName = isSelected ? `${g.toLowerCase()}Selected` : g.toLowerCase();
                  
                  return (
                    <button
                      key={g}
                      id={`click_on_profile_details_gender_${g.toLowerCase()}`}
                      type="button"
                      className={`profiledetails-gender-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setGender(g)}
                    >
                      <img
                        src={`/assets/icons/${iconName}.svg`}
                        alt={`${g} icon`}
                      />
                      {t(g)}
                    </button>
                  );
                })}
            </div>
          </fieldset>

          <div className="profiledetails-button-group">
            {shouldShowSkip && (
              <button
                id="click_on_profile_details_skip"
                className="profiledetails-skip-button"
                onClick={() => {
                  Util.logEvent(EVENTS.PROFILE_SKIPPED, {
                    page_path: window.location.pathname,
                    complete_path: window.location.href,
                    action_type: "skip_profile",
                    variation,
                  });
                  history.replace(PAGES.HOME);
                }}
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