import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import "./UserProfile.css";
import Header from "../components/homePage/Header";
import { PAGES, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import EditIcon from "@mui/icons-material/Edit";
import UserProfileSection from "../components/UserProfileSection";
import { Util } from "../../utility/util";
import ProfileDetails from "../components/library/ProfileDetails";

const UserProfile: React.FC = () => {
  const history = useHistory();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<TableTypes<"user">>();
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNum, setPhoneNum] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [languageid, setLanguageId] = useState<string>("");
  const [languages, setLanguages] = useState<
    Array<{ label: string; value: string; id: string }>
  >([]);
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [currentSchool, setCurrentSchool] = useState<TableTypes<"school">>();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const api = ServiceConfig.getI().apiHandler;

  const fetchLanguages = async () => {
    try {
      const fetchedLanguages: TableTypes<"language">[] =
        await api.getAllLanguages();

      const sanitizedLanguages = fetchedLanguages
        .filter((lang) => lang.code && lang.name)
        .map((lang) => ({
          label: lang.name,
          value: lang.code as string,
          id: lang.id,
        }));

      setLanguages(sanitizedLanguages);

      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (user) {
        setLoginUser(user);
        setFullName(user.name || "");
        setEmail(user.email || "");
        setPhoneNum(user.phone || "");
        setLanguageId(user.language_id || "");
        setProfilePic(user.image || "");
        const userLanguage = sanitizedLanguages.find(
          (lang) => lang.id === user.language_id
        );
        if (userLanguage) {
          setLanguage(userLanguage.value);
        }
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const fetchClassDetails = async () => {
    try {
      const tempSchool = Util.getCurrentSchool();
      if (tempSchool) setCurrentSchool(tempSchool);
      const tempClass = Util.getCurrentClass();
      if (tempClass) {
        console.log("fdsfsds 1", tempClass);
        setCurrentClass(tempClass);
      }
    } catch (error) {
      console.error("Failed to load class details", error);
    }
  };

  useEffect(() => {
    fetchClassDetails();
    fetchLanguages();
  }, []);

  console.log("fdsfsds", currentClass);
  if (!currentClass?.id) {
    console.error("No current class selected.");
    return null;
  }

  const handleEditClick = () => {
    setIsEditMode(!isEditMode);
  };

  const handleUpdate = async () => {
    try {
      if (!loginUser) {
        throw new Error("User is not logged in or user data is not available.");
      }
      const profilePicValue = profilePic || undefined;
      await api.updateUserProfile(
        loginUser,
        fullName,
        email,
        phoneNum,
        languageid,
        profilePicValue
      );
    } catch (error) {
      console.error("Error adding student:", error);
    }
    setIsEditMode(false);
  };

  const handleLanguageChange = (languageCode: string) => {
    const selectedLanguage = languages.find(
      (lang) => lang.value === languageCode
    );
    if (selectedLanguage) {
      setLanguage(selectedLanguage.value);
      setLanguageId(selectedLanguage.id);
    }
  };

  const handleProfilePicChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const placeholderImgBase64 = "data:image/png;base64,....";
  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
  };
  return (
    <div className="main-page">
      <Header
        isBackButton={true}
        showClass={true}
        showSchool={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
        onBackButtonClick={onBackButtonClick}
      />
      <div className="profile-details-container">
        <ProfileDetails
          imgSrc={profilePic || placeholderImgBase64}
          imgAlt="Profile Pic"
          onImageChange={handleProfilePicChange}
          isEditMode={isEditMode}
        />
      </div>
      <div className="profile-info">
        <div className="login-user-name">{fullName}</div>
        {!isEditMode && (
          <EditIcon
            aria-label={String(t("Edit"))}
            className="edit-icon"
            onClick={handleEditClick}
          />
        )}
      </div>
      <UserProfileSection
        languageOptions={languages}
        fullName={fullName}
        email={email}
        phoneNum={phoneNum}
        language={language}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPhoneNumChange={setPhoneNum}
        onLanguageChange={handleLanguageChange}
        isEditMode={isEditMode}
      />
      {isEditMode && (
        <div className="form-actions">
          <button
            className="update-button"
            type="button"
            onClick={handleUpdate}
          >
            {t("Update")}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
