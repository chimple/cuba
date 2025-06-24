import React, { useState } from "react";
import { IonButton, IonPage } from "@ionic/react";
import InputField from "../../common/InputField";
import {
  PAGES,
  SCHOOL_USERS,
  SchoolWithRole,
  TableTypes,
} from "../../common/constants";
import Header from "../components/homePage/Header";
import { useHistory, useLocation } from "react-router-dom";
import "./AddSchoolUser.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { RoleType } from "../../interface/modelInterfaces";
import CommonDialogBox from "../../common/CommonDialogBox";

const AddSchoolUser: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [useEmail, setUseEmail] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState<TableTypes<"user"> | undefined>();
  const [showAlert, setShowAlert] = useState(false);
  const [showUserNotFoundAlert, setShowUserNotFoundAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { school, role } = (location.state as SchoolWithRole) || {};
  const api = ServiceConfig.getI()?.apiHandler;
  let currentRole;
  if (location) {
    const path = location.pathname;

    currentRole =
      path === PAGES.ADD_PRINCIPAL
        ? RoleType.PRINCIPAL
        : path === PAGES.ADD_COORDINATOR
          ? RoleType.COORDINATOR
          : RoleType.SPONSOR;
  }

  const tempTabName =
    currentRole === RoleType.PRINCIPAL
      ? SCHOOL_USERS.PRINCIPALS
      : currentRole === RoleType.COORDINATOR
        ? SCHOOL_USERS.COORDINATORS
        : SCHOOL_USERS.SPONSORS;

  const resetUserNotFound = () => {
    setShowUserNotFoundAlert(false);
  };

  const toggleInputMethod = () => {
    setUseEmail((prevUseEmail) => !prevUseEmail);
    setInputValue("");
    setUser(undefined);
  };

  const onBackButtonClick = () => {
    history.replace(`${PAGES.SCHOOL_USERS}?tab=${tempTabName}`, {
      school: school,
      role: role,
    });
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);

      let fetchedUser;
      if (useEmail) {
        fetchedUser = await api?.getUserByEmail(inputValue);
      } else {
        fetchedUser = await api?.getUserByPhoneNumber(inputValue);
      }

      if (school && fetchedUser) {
        const userInSchool = await api?.checkUserExistInSchool(
          school?.id,
          fetchedUser.id
        );
        if (userInSchool) {
          setShowAlert(true);
          setUser(undefined);
        } else {
          setUser(fetchedUser);
        }
      } else {
        setShowUserNotFoundAlert(true);
        setUser(undefined);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchoolUser = async () => {
    try {
      setIsLoading(true);

      if (school && user) {
        await api?.addUserToSchool(school.id, user.id, currentRole);

        await api.updateSchoolLastModified(school.id);
        await api.updateUserLastModified(user.id);

        history.replace(`${PAGES.SCHOOL_USERS}?tab=${tempTabName}`, {
          school: school,
          role: role,
        });
      }
    } catch (error) {
      console.error("Failed to add user to school", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage className="add-school-user-main">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        showSchool={true}
        schoolName={school?.name}
      />
      <div className="ion-padding">
        <div className="add-school-user-div">
          {currentRole === RoleType.PRINCIPAL
            ? t("Add Principal")
            : currentRole === RoleType.COORDINATOR
              ? t("Add Coordinator")
              : t("Add Sponsor")}
        </div>

        <InputField
          useEmail={useEmail}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onEnter={handleSearch}
          toggleInputMethod={toggleInputMethod}
          resetUserNotFound={resetUserNotFound}
        />

        {user && (
          <div className="user-details">
            <hr className="horizontal-line" />

            <div className="user-info-container">
              <img
                src={user.image ? user.image : "assets/icons/userIcon.png"}
                className="user-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "assets/icons/userIcon.png";
                }}
              />
              <p>{user.name}</p>
              <IonButton
                color="#7C5DB0"
                onClick={handleAddSchoolUser}
                disabled={isLoading}
                className="add-user-btn"
              >
                {isLoading ? t("Adding") + "..." : t("Add")}
              </IonButton>
            </div>
          </div>
        )}
      </div>

      <CommonDialogBox
        showConfirmFlag={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="User Already in School"
        message="This user is already added to the school."
        rightButtonText="OK"
        rightButtonHandler={() => setShowAlert(false)}
      />

      {showUserNotFoundAlert && (
        <div className="no-data-div">
          {t("Sorry, we couldn't find any matches for")}&nbsp;'{inputValue}'
        </div>
      )}
    </IonPage>
  );
};

export default AddSchoolUser;
