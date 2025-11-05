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
    setUser(undefined);
    setShowUserNotFoundAlert(false);
    setIsLoading(true);

    try {
      let fetchedUser;
      if (useEmail) {
        fetchedUser = await api?.getUserByEmail(inputValue);
      } else {
        fetchedUser = await api?.getUserByPhoneNumber(inputValue);
      }

      if (school && classDoc && fetchedUser && fetchedUser.id) {
        const userInClass = await api?.checkTeacherExistInClass(
          school.id,
          classDoc.id,
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
      setShowUserNotFoundAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!classDoc || !user || !school) return;

    setIsLoading(true);
    try {
      await api.addTeacherToClass(school.id,classDoc.id, user);
      await api.updateSchoolLastModified(school.id);
      await api.updateClassLastModified(classDoc.id);
      await api.updateUserLastModified(user.id);
      history.replace(`${PAGES.CLASS_USERS}?tab=Teachers`, classDoc);
    } catch (error) {
      console.error("Failed to add teacher", error);
    } finally {
      setIsLoading(false);
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

            <div className="add-teacher-container">
              <img
                src={user.image ? user.image : "assets/icons/userIcon.png"}
                className="user-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "assets/icons/userIcon.png";
                }}
              />
              <p>{user.name}</p>
              <button
                onClick={handleAddTeacher}
                disabled={isLoading}
                className="add-teacher-btn"
              >
                {isLoading ? t("Adding") + "..." : t("Add")}
              </button>
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
