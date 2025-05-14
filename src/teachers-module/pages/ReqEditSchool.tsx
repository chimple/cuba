import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";
import { t } from "i18next";
import {
  CURRENT_MODE,
  CURRENT_USER,
  MODES,
  PAGES,
  SchoolWithRole,
} from "../../common/constants";
import Header from "../components/homePage/Header";
import "./EditSchool.css";
import EditSchoolSection from "../components/schoolComponent/EditSchoolSection";
import { IonButton, IonPage } from "@ionic/react";
import { RoleType } from "../../interface/modelInterfaces";
import { Util } from "../../utility/util";
import ProfileDetails from "../components/library/ProfileDetails";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Capacitor } from "@capacitor/core";
import DialogBoxButtons from "../../components/parent/DialogBoxButtons​";
import { schoolUtil } from "../../utility/schoolUtil";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
interface LocationState {
  school?: SchoolWithRole["school"];
  role?: RoleType;
  origin?: string;
}
const ReqEditSchool: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { school, role, origin } = (location.state as LocationState) || {};
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const prevOrigin = origin ?? null;
  let isEditMode;
  if (location) {
    isEditMode = location.pathname === PAGES.REQ_EDIT_SCHOOL;
  }

  const [schoolData, setSchoolData] = useState({
    name: "",
    state: "",
    district: "",
    city: "",
    image: "",
    UDISE_ID: "",
  });
  const [initialSchoolData, setInitialSchoolData] = useState(schoolData);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigationState = Util.getNavigationState();
  const [showDialogBox, setShowDialogBox] = useState(false);

  const checkRequestStatus = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      _currentUser?.id as string
    );
    setIsRequestSent(!!existingRequest);
  };
  useEffect(() => {
    checkRequestStatus();
  }, [])
  useEffect(() => {
    const isFormChanged =
      JSON.stringify(schoolData) !== JSON.stringify(initialSchoolData);
    const isFormValid = schoolData.name.trim();
    setIsButtonDisabled(!isFormChanged || !isFormValid);
  }, [schoolData, initialSchoolData]);

  const handleNameChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, name: value }));
  };

  const handleStateChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, state: value }));
  };

  const handleDistrictChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, district: value }));
  };

  const handleCityChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, city: value }));
  };
  const handleUDISE_IDChange = (value: string) => {
    setSchoolData((prevData) => ({ ...prevData, UDISE_ID: value }));
  };

  const onBackButtonClick = () => {
    history.replace(
      prevOrigin === PAGES.DISPLAY_SCHOOLS
        ? PAGES.DISPLAY_SCHOOLS
        : isEditMode && !navigationState
          ? PAGES.SCHOOL_PROFILE
          : PAGES.MANAGE_SCHOOL,
      {
        school: school,
        role: role,
      }
    );
  };

  const [profilePic, setProfilePic] = useState<File | null>(null);

  const handleProfilePicChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    // Create an image object
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      setProfilePic(file);
    };
  };

  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(CURRENT_USER);
    localStorage.removeItem(CURRENT_MODE);
    history.replace(PAGES.APP_LANG_SELECTION);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  const handleSendRequest = async () => {
    setIsSaving(true);
    try {
      if (
        schoolData.name === "" ||
        schoolData.state === "" ||
        schoolData.district === "" ||
        schoolData.city === ""
      ) {
        presentToast({
          message: t(`Please fill all the required fields.`),
          color: "dark",
          duration: 3000,
          position: "bottom",
          buttons: [
            {
              text: "Dismiss",
              role: "cancel",
            },
          ],
        });
        return;
      }
      const api = ServiceConfig.getI().apiHandler;
      const res = await api.requestNewSchool(
        schoolData.name.trim(),
        schoolData.state.trim(),
        schoolData.district.trim(),
        schoolData.city.trim(),
        profilePic,
        schoolData.UDISE_ID.trim()
      );
      setIsRequestSent(true);
    } catch (error) {
      console.error("Failed to send request:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  useEffect(() => {
    const isFormChanged =
      JSON.stringify(schoolData) !== JSON.stringify(initialSchoolData) ||
      profilePic !== null;
    const isFormValid = schoolData.name.trim() || profilePic !== null;
    setIsButtonDisabled(!isFormChanged || !isFormValid);
  }, [schoolData, initialSchoolData, profilePic]);

  return (
    <IonPage className="edit-school-page">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        disableBackButton={isSaving ? true : false}
      />
      {isRequestSent === true && !isSaving ? (
        // **SUCCESS SCREEN**
        <div className="edit-school-confirm-page">
          <h2 className="edit-school-confirm-title">
            {t("Request Confirmation")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 600 600"
              style={{ verticalAlign: "middle", marginLeft: "5px" }}
            >
              <circle cx="300" cy="300" r="300" fill="#4CAF50" />
              <path
                fill="#fff"
                d="M243 427c-8-8-22-8-30 0l-97-97c-8-8-8-22 0-30l30-30c8-8 22-8 30 0l67 67 175-175c8-8 22-8 30 0l30 30c8 8 8 22 0 30L243 427z"
              />
            </svg>
          </h2>
          <div className="edit-school-confirm-message">
            <p>
              {t("After a short while kindly check to access your school")}
            </p>
            <a href="https://www.bit.ly/chimple-help-line" target="_blank" style={{ textDecoration: "none" }}>
              <div className="edit-school-whatsapp-support">
                <div className="edit-school-whatsapp-support-icon">
              <img src="assets/icons/whatsapp.svg" alt="whatsapp" width="25" />
                </div>
                <div className="edit-school-whatsapp-support-text">
                  <p>{t("Whatsapp Us For Any Questions")}</p>
                </div>
              </div>
            </a>
          </div>
          <hr className="edit-school-divider" />
          <div className="edit-school-confirm-subtext">
            <p>
              {t("Why not explore our Apps? You are just one click away!")}
            </p>
          </div>
          <div className="edit-school-app-links">
            <a
              href="https://youtu.be/G_OW3hNtZ3o?si=Txs7SMRDbjbhb4nq"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div
                className="edit-school-app-card"
              >
                <p className="edit-school-app-title">{t("Teacher’s App")}</p>
                <div className="edit-school-card-content">
                  <p className="edit-school-app-subtext">
                    {t("Teacher’s Task Made Easy")}
                  </p>
                  <img className="edit-school-card-content-img" src="assets/icons/redirectToYoutube.png" alt="" />
                </div>
              </div>
            </a>
            <div className="edit-school-app-card" onClick={switchUser}>
              <p className="edit-school-app-title">{t("Chimple App")}</p>
              <div className="edit-school-card-content">
                <p className="edit-school-app-subtext">
                  {t("Fun Gamified Learning")}
                </p>
                <img className="edit-school-card-content-img" src="assets/icons/switchToKidsMode.png" alt="" />
              </div>
            </div>
          </div>
          <hr className="edit-school-divider" />
          <IonButton
            color="#fff"
            className="edit-school-logout-button"
            onClick={() => setShowDialogBox(true)}
          >
            {t("Logout")}
          </IonButton>
          <DialogBoxButtons
            width="100%"
            height="20%"
            message={t("Are you sure you want to logout?")}
            showDialogBox={showDialogBox}
            yesText={t("Cancel")}
            noText={t("Logout")}
            handleClose={() => setShowDialogBox(false)}
            onYesButtonClicked={() => setShowDialogBox(false)}
            onNoButtonClicked={onSignOut}
          />
        </div>
      ) : (
        // **FORM SCREEN**
        <>
          {!isEditMode && (
            <div className="edit-school-noSchool-text">
              <p>
                {prevOrigin == "/display-schools" &&
                  t("Your profile is not registered to any school.")}
                {t("Send Request to Chimple to add your school.")}
              </p>
              <hr className="edit-school-divider" />
            </div>
          )}
          <div className="edit-school-text-div">
            {isEditMode ? t("Edit School") : t("Add School")}
          </div>
          <div className="single-container">
            <div className="profile-image">
              <ProfileDetails
                imgSrc={
                  profilePic
                    ? URL.createObjectURL(profilePic)
                    : school?.image || ""
                }
                imgAlt="Profile Pic"
                onImageChange={handleProfilePicChange}
                isEditMode={true}
              />
            </div>
            {/* <div className="school-text">{schoolData.name}</div> */}
            <div className="school-content">
              <Box className="edit-school-div">
                <EditSchoolSection
                  name={schoolData.name}
                  state={schoolData.state}
                  district={schoolData.district}
                  city={schoolData.city}
                  UDISE_ID={schoolData.UDISE_ID}
                  onNameChange={handleNameChange}
                  onStateChange={handleStateChange}
                  onDistrictChange={handleDistrictChange}
                  onCityChange={handleCityChange}
                  onUDISE_IDChange={handleUDISE_IDChange}
                />
                <div className="editSchool-button-container">
                  <IonButton
                    color="#7C5DB0"
                    onClick={handleSendRequest}
                    className="editSchool-update-button"
                    disabled={isButtonDisabled || isSaving}
                  >
                    {isSaving ? t("Saving") + "..." : t("Send Request")}
                  </IonButton>
                </div>
              </Box>
            </div>
          </div>
        </>
      )}
    </IonPage>
  );
};

export default ReqEditSchool;
