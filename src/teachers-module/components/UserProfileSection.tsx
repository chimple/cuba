import React from "react";
import "./UserProfileSection.css";
import { t } from "i18next";
import DropDown from "../../components/DropDown";
import { IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import CustomDropdown from "./CustomDropdown";

interface LanguageOption {
  label: string;
  value: string;
}

interface UserProfileSectionProps {
  languageOptions: LanguageOption[];
  fullName: string;
  email: string;
  phoneNum: string;
  language: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneNumChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  isEditMode: boolean;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  fullName,
  email,
  phoneNum,
  language,
  onFullNameChange,
  onEmailChange,
  onPhoneNumChange,
  onLanguageChange,
  languageOptions,
  isEditMode,
}) => {
  const mappedLanguageOptions = languageOptions.map((option) => ({
    id: option.value,
    name: option.label,
  }));
  return (
    <div className="update-teacher-form">
      <form>
        <div className="input-group">
          <label htmlFor="name">{t("Name")}</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder={t("Enter Name") || ""}
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            disabled={!isEditMode}
          />
        </div>

        {isEditMode ? (
          <div className="input-group">
            <label>{t("Select Language")}</label>
            <CustomDropdown
              options={mappedLanguageOptions}
              selectedValue={{
                id: language,
                name: mappedLanguageOptions.find(option => option.id === language)?.name || "",
              }}
              onOptionSelect={(selectedOption) => {
                if (selectedOption) {
                  onLanguageChange(String(selectedOption.id));
                }
              }}
              placeholder={t("Select Language") as string}
            />
          </div>
        ) : (
          <>
            <div className="input-group">
              <label htmlFor="email">{t("Email")}</label>
              <input
                type="text"
                id="email"
                name="email"
                value={email || (t("Email not available") as string)}
                disabled
              />
            </div>

            <div className="input-group">
              <label htmlFor="phonenumber">{t("Phone")}</label>
              <input
                type="text"
                id="phonenumber"
                name="phonenumber"
                value={phoneNum || (t("Phone number not available") as string)}
                disabled
              />
            </div>

            <div className="input-group">
              <label htmlFor="language">{t("Language")}</label>
              <input
                type="text"
                id="language"
                name="language"
                value={
                  languageOptions.find((lang) => lang.value === language)
                    ?.label || ""
                }
                disabled
              />
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default UserProfileSection;
