import { MouseEvent, useEffect, useState, useRef } from "react";
import { t } from "i18next";
import "./ProfileDetails.css";
import InputWithIcons from "../common/InputWithIcons";
import SelectWithIcons from "../common/SelectWithIcons";
import { Util } from "../../utility/util";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  ACTION,
  ACTION_TYPES,
  AGE_OPTIONS,
  AVATARS,
  CURRENT_STUDENT,
  EDIT_STUDENTS_MAP,
  EVENTS,
  FORM_MODES,
  GENDER,
  LANGUAGE,
  PAGES,
  PROFILE_DETAILS_GROWTHBOOK_VARIATION,
  TableTypes,
} from "../../common/constants";
import { useHistory, useLocation } from "react-router";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { FaArrowLeftLong } from "react-icons/fa6";
import { initializeFireBase } from "../../services/Firebase";
import Loading from "../Loading";
import { logProfileClick } from "../../analytics/profileClickUtil";
import i18n from "../../i18n";

const getModeFromFeature = (variation: string) => {
  switch (variation) {
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_V1:
      return FORM_MODES.ALL_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_V2:
      return FORM_MODES.NAME_REQUIRED;
    case PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_V3:
      return FORM_MODES.ALL_OPTIONAL;
    default:
      return FORM_MODES.ALL_REQUIRED;
  }
};

const ProfileDetails = () => {
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();
  const profileRef = useRef<HTMLDivElement>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const currentStudent = Util.getCurrentStudent();
  const location = useLocation();
  const isEdit = location.pathname === PAGES.EDIT_STUDENT && !!currentStudent;
  const variation = useFeatureValue<string>(
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_ONBOARDING,
    PROFILE_DETAILS_GROWTHBOOK_VARIATION.AFTER_LOGIN_CONTROL
  );
  const mode = getModeFromFeature(variation);
  const randomIndex = Math.floor(Math.random() * AVATARS.length);

  const [fullName, setFullName] = useState(isEdit ? currentStudent?.name : "");
  const [avatar, setAvatar] = useState<string | undefined>(
    isEdit
      ? currentStudent?.avatar ?? AVATARS[randomIndex]
      : AVATARS[randomIndex]
  );

  // New State for Class and School
  const [className, setClassName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");

  const [age, setAge] = useState<number | undefined>(
    isEdit
      ? !!currentStudent?.age
        ? currentStudent.age < 4
          ? 4
          : currentStudent.age
        : undefined
      : undefined
  );
  const [gender, setGender] = useState<GENDER | undefined>(
    isEdit && currentStudent?.gender
      ? (currentStudent?.gender as GENDER)
      : undefined
  );
  const [languageId, setLanguageId] = useState(
    isEdit ? currentStudent?.language_id ?? "" : ""
  );
  const [languages, setLanguages] = useState<TableTypes<"language">[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  const [parentHasStudent, setParentHasStudent] = useState<boolean>(false);

  const initialValues = useRef({
    fullName: isEdit ? currentStudent?.name ?? "" : "",
    age: isEdit ? currentStudent?.age ?? undefined : undefined,
    gender: isEdit ? (currentStudent?.gender as GENDER) : undefined,
    languageId: isEdit ? currentStudent?.language_id ?? "" : "",
  });

  useEffect(() => {
    if (isEdit && currentStudent) {
      initialValues.current = {
        fullName: currentStudent?.name ?? "",
        age: currentStudent?.age ?? undefined,
        gender: currentStudent?.gender as GENDER,
        languageId: currentStudent?.language_id ?? "",
      };
    }
  }, [isEdit, currentStudent]);

  useEffect(() => {
    const initial = initialValues.current;

    if (!initial) {
      setHasChanges(false);
      return;
    }

    const changed =
      fullName !== initial.fullName ||
      age !== initial.age ||
      gender !== initial.gender ||
      languageId !== initial.languageId;

    setHasChanges(changed);
  }, [fullName, age, gender, languageId]);

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth);
    }
  }, [labelRef.current?.offsetWidth]);

  useEffect(() => {
    if (isEdit) {
      const langCode = localStorage.getItem("language");
      if (langCode && i18n.language !== langCode) {
        i18n.changeLanguage(langCode);
      }
    }
  }, [isEdit]);

  useEffect(() => {
    initializeFireBase();
    lockOrientation();
    Util.loadBackgroundImage();

    const loadLanguages = async () => {
      const langs = await api.getAllLanguages();
      setLanguages(langs);
    };
    loadLanguages();

    const isParentHasStudent = async () => {
      const student = await api.getParentStudentProfiles();
      setParentHasStudent(student.length > 0);
    };
    isParentHasStudent();
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const { className, schoolName } = await Util.fetchCurrentClassAndSchool();
    setClassName(className);
    setSchoolName(schoolName);
  };

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
      ? isFormComplete && hasChanges
      : hasChanges;

  const handleSave = async () => {
    if (isCreatingProfile) return;
    try {
      setIsCreatingProfile(true);
      let _studentName = fullName?.trim();
      const state = history.location.state as any;
      const tmpPath = state?.from ?? PAGES.HOME;
      const user = await auth.getCurrentUser();
      let student;
      if (isEdit && !!currentStudent && !!currentStudent.id) {
        student = await api.updateStudent(
          currentStudent,
          _studentName ?? "",
          age ?? currentStudent.age!,
          gender ?? currentStudent.gender!,
          currentStudent.avatar!,
          undefined,
          undefined,
          undefined,
          languageId || currentStudent.language_id!
        );
        const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
        const studentsMap = storedMapStr ? JSON.parse(storedMapStr) : {};
        studentsMap[student.id] = student;
        sessionStorage.setItem(EDIT_STUDENTS_MAP, JSON.stringify(studentsMap));
        Util.logEvent(EVENTS.PROFILE_UPDATED, {
          user_id: user?.id,
          name: fullName,
          student_id: student.id,
          age,
          gender,
          language_id: languageId,
          variation,
          page_path: window.location.pathname,
          action_type: ACTION_TYPES.PROFILE_UPDATED,
        });
      } else {
        student = await api.createProfile(
          _studentName ?? "",
          age,
          gender,
          avatar,
          undefined,
          undefined,
          undefined,
          languageId || languages[0].id
        );
        Util.logEvent(EVENTS.PROFILE_CREATED, {
          user_id: user?.id,
          name: fullName,
          student_id: student.id,
          age,
          gender,
          language_id: languageId,
          variation,
          page_path: window.location.pathname,
          action_type: ACTION_TYPES.PROFILE_CREATED,
        });
        const langIndex = languages?.findIndex(
          (lang) => lang.id === languages[0].id
        );
        await Util.setCurrentStudent(
          student,
          langIndex && languages && languages[langIndex]?.code
            ? languages[langIndex]?.code ?? undefined
            : undefined,
          tmpPath === PAGES.HOME ? true : false
        );
      }
      history.replace(PAGES.HOME);
      setIsCreatingProfile(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setIsCreatingProfile(false);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSkip = async () => {
    if (isCreatingProfile) return;
    try {
      setIsCreatingProfile(true);
      if (parentHasStudent) {
        history.replace(PAGES.HOME);
        return;
      }
      const languageCode = localStorage.getItem(LANGUAGE);
      const allLanguages = await api.getAllLanguages();
      const selectedLanguage = allLanguages.find(
        (lang) => lang.code === languageCode
      );
      // Create auto profile with default/null values
      const student = await api.createAutoProfile(selectedLanguage?.id);
      // Set as current student
      await Util.setCurrentStudent(
        student,
        selectedLanguage?.code ?? undefined,
        true
      );
      Util.logEvent(EVENTS.PROFILE_SKIPPED, {
        user_id: student?.id,
        name: fullName,
        variation,
        page_path: window.location.pathname,
        action_type: ACTION_TYPES.PROFILE_SKIPPED,
      });
      // Redirect to home page
      history.replace(PAGES.HOME);
    } catch (err) {
      console.error("Error skipping profile:", err);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  return (
    <div
      ref={profileRef}
      className="profiledetails-container"
      onClick={(e) => {
        logProfileClick(e).catch((err) =>
          console.error("Error in logProfileClick", err)
        );
      }}
    >
      {parentHasStudent && (
        <button
          className="profiledetails-back-button"
          onClick={() => {
            const targetPage = PAGES.HOME;
            Util.setPathToBackButton(targetPage, history);
          }}
          aria-label="Back"
          id="click_on_profile_details_back_button"
        >
          <img src="/assets/icons/BackButtonIcon.svg" alt="BackButtonIcon" />
        </button>
      )}
      <div className="profiledetails-avatar-form">
        <div className="profiledetails-avatar-section">
          <img
            src={"assets/avatars/" + (avatar ?? AVATARS[0]) + ".png"}
            className="profiledetails-avatar-image"
          />
        </div>

        <div className="profiledetails-form-fields">
          {/* Header Info: Class Name | School Name */}
          {(className || schoolName) && (
            <div className="profiledetails-header-info">
              {className && (
                <div className="pd-info-item">
                  <img
                    src="/assets/icons/classIcon.svg"
                    alt="class"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span>{className}</span>
                </div>
              )}
              {className && schoolName && <span className="pd-divider">|</span>}
              {schoolName && (
                <div className="pd-info-item">
                  <img
                    src="/assets/icons/scholarIcon.svg"
                    alt="school"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span>{schoolName}</span>
                </div>
              )}
            </div>
          )}

          {/* {mode !== FORM_MODES.ALL_OPTIONAL && (
            <div className="profiledetails-required-indicator">
              {`* ${t("Indicates Required Information")}`}
            </div>
          )} */}

          <div className="profiledetails-full-name">
            <InputWithIcons
              id="click_on_profile_details_full_name"
              label={t("Full Name")}
              placeholder={t("Name Surname")}
              value={fullName ?? ""}
              setValue={setFullName}
              icon="/assets/icons/BusinessCard.svg"
              // required={
              //   mode === FORM_MODES.ALL_REQUIRED ||
              //   mode === FORM_MODES.NAME_REQUIRED
              // }
            />
          </div>

          <div className="profiledetails-row-group">
            <div className="profiledetails-flex-item">
              <SelectWithIcons
                id="click_on_profile_details_age"
                label={t("Age")}
                value={age?.toString() ?? ""}
                setValue={(age) => setAge(parseInt(age))}
                icon="/assets/icons/age.svg"
                optionId={`click_on_profile_details_age_option_${age}`}
                options={[
                  {
                    value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
                    label: `≤${t("4 years")}`,
                  },
                  { value: AGE_OPTIONS.FIVE, label: t("5 years") },
                  { value: AGE_OPTIONS.SIX, label: t("6 years") },
                  { value: AGE_OPTIONS.SEVEN, label: t("7 years") },
                  { value: AGE_OPTIONS.EIGHT, label: t("8 years") },
                  { value: AGE_OPTIONS.NINE, label: t("9 years") },
                  {
                    value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
                    label: `≥${t("10 years")}`,
                  },
                ]}
                // required={mode === FORM_MODES.ALL_REQUIRED}
              />
            </div>

            <div className="profiledetails-flex-item">
              <SelectWithIcons
                id="click_on_profile_details_language"
                label={t("Language")}
                value={languageId}
                setValue={setLanguageId}
                icon="/assets/icons/language.svg"
                optionId={
                  `click_on_profile_details_language_option_` +
                  (languageId || "")
                }
                options={languages.map((lang) => ({
                  value: lang.id,
                  label: t(lang.name),
                }))}
                // required={mode === FORM_MODES.ALL_REQUIRED}
              />
            </div>
          </div>

          <fieldset className="profiledetails-form-group profiledetails-gender-fieldset">
            <legend className="profiledetails-gender-label">
              <div className="profiledetails-gender-label-text" ref={labelRef}>
                {t("Gender")}
                {/* {mode === FORM_MODES.ALL_REQUIRED && (
                  <span className="profiledetails-required">*</span>
                )} */}
              </div>
            </legend>
            <div className="profiledetails-gender-buttons">
              {[
                { label: t("GIRL"), value: GENDER.GIRL, name: "GIRL" },
                { label: t("BOY"), value: GENDER.BOY, name: "BOY" },
                {
                  label: t("UNSPECIFIED"),
                  value: GENDER.OTHER,
                  name: "UNSPECIFIED",
                },
              ].map(({ label, value, name }) => {
                const isSelected = gender === value;
                const iconName = isSelected
                  ? `${name.toLowerCase()}Selected`
                  : name.toLowerCase();

                return (
                  <button
                    key={label}
                    id={`click_on_profile_details_gender_${label.toLowerCase()}`}
                    type="button"
                    className={`profiledetails-gender-btn ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => setGender(value)}
                  >
                    <img
                      src={`/assets/icons/${iconName}.svg`}
                      alt={`${label} icon`}
                    />
                    {t(label)}
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
                onClick={handleSkip}
              >
                {t("SKIP FOR NOW")}
              </button>
            )}
            <button
              id="click_on_profile_details_save"
              className="profiledetails-save-button"
              disabled={!isSaveEnabled || isCreatingProfile}
              onClick={handleSave}
            >
              {t("SAVE")}
            </button>
          </div>
        </div>
      </div>
      <Loading isLoading={isCreatingProfile} />
    </div>
  );
};

export default ProfileDetails;
