import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import {
  PAGES,
  SchoolWithRole,
  TableTypes,
} from "../../common/constants";
import Header from "../components/homePage/Header";
import "./EditSchool.css";
import EditSchoolSection from "../components/schoolComponent/EditSchoolSection";
import { IonButton, IonPage } from "@ionic/react";
import { RoleType } from "../../interface/modelInterfaces";
import { Util } from "../../utility/util";
import ProfileDetails from "../components/library/ProfileDetails";
interface LocationState {
  school?: SchoolWithRole["school"];
  role?: RoleType;
  origin?: string;
}
const EditSchool: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI()?.apiHandler;
  const location = useLocation();
  const { school, role, origin } = (location.state as LocationState) || {};
  const prevOrigin = origin ?? null;
  let isEditMode;
  if (location) {
    isEditMode = location.pathname === PAGES.EDIT_SCHOOL;
  }
  const [currentSchool, setCurrentSchool] =
    useState<TableTypes<"school"> | null>(null);
  const [schoolData, setSchoolData] = useState({
    name: "",
    state: "",
    district: "",
    city: "",
    image: "",
  });
  const [initialSchoolData, setInitialSchoolData] = useState(schoolData);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigationState = Util.getNavigationState();

  useEffect(() => {
    if (isEditMode) {
      fetchSchoolData();
    }
  }, []);

  useEffect(() => {
    const isFormChanged =
      JSON.stringify(schoolData) !== JSON.stringify(initialSchoolData);
    const isFormValid = schoolData.name.trim();

    setIsButtonDisabled(!isFormChanged || !isFormValid);
  }, [schoolData, initialSchoolData]);
  const fetchSchoolData = async () => {
    if (school) {
      const fetchedData = {
        name: school.name,
        state: school.group1 ?? "",
        district: school.group2 ?? "",
        city: school.group3 ?? "",
        image: school.image ?? "",
      };
      setSchoolData(fetchedData);
      setInitialSchoolData(fetchedData);
      setCurrentSchool(school);
    }
  };

  const handleSave = async () => {
    let tempSchool: TableTypes<"school">;
    try {
      setIsSaving(true);

      if (isEditMode && currentSchool) {
        const updatedSchool = await api.updateSchoolProfile(
          currentSchool,
          schoolData.name,
          schoolData.state,
          schoolData.district,
          schoolData.city,
          profilePic
        );

        console.log("School data updated successfully");

      //   if (navigationState?.stage === Class_Creation_Stages.CREATE_SCHOOL) {
      //     Util.setNavigationState(Class_Creation_Stages.SCHOOL_COURSE);
      //     history.replace(PAGES.SUBJECTS_PAGE, {
      //       schoolId: updatedSchool.id,
      //       origin: PAGES.ADD_SCHOOL,
      //       isSelect: true,
      //     });
      //   } else {
      //     history.replace(PAGES.SCHOOL_PROFILE, {
      //       school: updatedSchool,
      //       role: role,
      //     });
      //   }
      // } else {
      //   Util.clearNavigationState();
      //   setIsSaving(true);
      //   tempSchool = await api.createSchool(
      //     schoolData.name.trim(),
      //     schoolData.state.trim(),
      //     schoolData.district.trim(),
      //     schoolData.city.trim(),
      //     profilePic
      //   );

        // Util.setNavigationState(School_Creation_Stages.SCHOOL_COURSE);
        // history.replace(PAGES.SUBJECTS_PAGE, {
        //   schoolId: tempSchool.id,
        //   origin: PAGES.ADD_SCHOOL,
        //   isSelect: true,
        // });
        // console.log("Profile picture uploaded successfully:", tempSchool.image);
      }
    } catch (error) {
      console.error("Failed to save school:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
        showSchool={true}
        schoolName={currentSchool?.name}
        disableBackButton={isSaving ? true : false}
      />
      <div className="edit-school-text-div">
        {isEditMode ? t("Edit School") : t("Add School")}
      </div>
      <div className="single-container">
        <div className="profile-image">
          <ProfileDetails
            imgSrc={
              profilePic ? URL.createObjectURL(profilePic) : school?.image || ""
            }
            imgAlt="Profile Pic"
            onImageChange={handleProfilePicChange}
            isEditMode={true}
          />
        </div>
        <div className="school-text">{schoolData.name}</div>
        <div className="school-content">
          <Box className="edit-school-div">
            <EditSchoolSection
              name={schoolData.name}
              state={schoolData.state}
              district={schoolData.district}
              city={schoolData.city}
              onNameChange={handleNameChange}
              onStateChange={handleStateChange}
              onDistrictChange={handleDistrictChange}
              onCityChange={handleCityChange}
            />
            <div className="editSchool-button-container">
              <IonButton
                color="#7C5DB0"
                onClick={handleSave}
                className="editSchool-update-button"
                disabled={isButtonDisabled || isSaving}
              >
                {isSaving
                  ? t("Saving") + "..."
                  : isEditMode
                    ? t("Update")
                    : t("Save")}
              </IonButton>
            </div>
          </Box>
        </div>
      </div>
    </IonPage>
  );
};

export default EditSchool;