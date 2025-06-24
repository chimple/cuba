import React, { useState } from "react";
import { IonButton, IonText, IonAlert } from "@ionic/react";
import InputField from "../../common/InputField";
import { Util } from "../../utility/util";
import { PAGES, TableTypes } from "../../common/constants";
import Header from "../components/homePage/Header";
import { useHistory, useLocation } from "react-router-dom";
import "./AddTeacher.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { RoleType } from "../../interface/modelInterfaces";

const AddTeacher: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{
    classDoc: TableTypes<"class">;
    school: TableTypes<"school">;
  }>();
  const [useEmail, setUseEmail] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState<TableTypes<"user"> | undefined>();
  const [showAlert, setShowAlert] = useState(false);
  const [showUserNotFoundAlert, setShowUserNotFoundAlert] = useState(false);
  const api = ServiceConfig.getI()?.apiHandler;
  const [isLoading, setIsLoading] = useState(false);
  const { classDoc, school } = location.state || {};

  const resetUserNotFound = () => {
    setShowUserNotFoundAlert(false);
  };

  const toggleInputMethod = () => {
    setUseEmail((prevUseEmail) => !prevUseEmail);
    setInputValue("");
    setUser(undefined);
  };

  const onBackButtonClick = () => {
    history.replace(`${PAGES.CLASS_USERS}?tab=Teachers`, classDoc);
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
        const userInClass = await api?.checkUserExistInSchool(
          school?.id,
          fetchedUser.id
        );

        if (userInClass) {
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

  const handleAddTeacher = async () => {
    setIsLoading(true);

    if (classDoc && user) {
      await api.addTeacherToClass(classDoc.id, user.id);

      await api.updateSchoolLastModified(school.id);
      await api.updateClassLastModified(classDoc.id);
      await api.updateUserLastModified(user.id);

      setIsLoading(false);
      history.replace(`${PAGES.CLASS_USERS}?tab=Teachers`, classDoc);
    }
  };

  return (
    <div className="add-teacher-main">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        showSchool={true}
        showClass={true}
        className={classDoc?.name}
        schoolName={school?.name}
      />
      <div className="ion-padding">
        <div className="add-teacher-div">{t("Add Teacher")}</div>

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
                onClick={handleAddTeacher}
                disabled={isLoading}
                className="add-user-btn"
              >
                {isLoading ? t("Adding") + "..." : t("Add")}
              </IonButton>
            </div>
          </div>
        )}
      </div>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={"User Already in Class"}
        message={"This user is already added to the class."}
        buttons={["OK"]}
      />

      {showUserNotFoundAlert && (
        <div className="no-data-div">
          {t("Sorry, we couldn't find any matches for")}&nbsp;'{inputValue}'
        </div>
      )}
    </div>
  );
};

export default AddTeacher;
