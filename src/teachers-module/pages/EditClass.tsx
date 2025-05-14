import { FC, useState, useEffect } from "react";
import { IonButton } from "@ionic/react";
import { ServiceConfig } from "../../services/ServiceConfig";
import EditClassField from "../components/classComponents/EditClassField";
import {
  PAGES,
  School_Creation_Stages,
  TableTypes,
} from "../../common/constants";
import { useHistory, useLocation } from "react-router-dom";
import Header from "../components/homePage/Header";
import { Util } from "../../utility/util";
import "./EditClass.css";
import { t } from "i18next";

const EditClass: FC = () => {
  const location = useLocation();
  const api = ServiceConfig.getI()?.apiHandler;
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [className, setClassName] = useState<string>("");
  const { school: localSchool = null, classDoc: tempClass = null } =
    (location.state || {}) as any;
  const currentSchool =
    (localSchool as TableTypes<"school">) ?? Util.getCurrentSchool();
  const history = useHistory();
  const [isSaving, setIsSaving] = useState(false);
  const navigationState = Util.getNavigationState();
  const { origin: paramOrigin = null } = (location.state || {}) as any;

  let isEditMode;
  if (location) {
    isEditMode = location?.pathname === PAGES.EDIT_CLASS;
  }
  const isButtonDisabled =
    !className.trim() || (isEditMode && currentClass?.name === className);

  useEffect(() => {
    if (isEditMode) {
      fetchClassDetails();
    } else {
      Util.setNavigationState(School_Creation_Stages.CREATE_CLASS);
    }
  }, [isEditMode]);

  const fetchClassDetails = async () => {
    try {
      if (tempClass) {
        setCurrentClass(tempClass);
        setClassName(tempClass.name);
      }
    } catch (error) {
      console.log("Failed to load class details.");
    }
  };

  const handleCreateClass = async () => {
    try {
      if (currentSchool) {
        setIsSaving(true);
        const newClass = await api.createClass(currentSchool.id, className);
        setIsSaving(false);
        Util.setNavigationState(School_Creation_Stages.CLASS_COURSE);
        history.replace(PAGES.SUBJECTS_PAGE, {
          classId: newClass.id,
          origin: PAGES.ADD_CLASS,
          isSelect: true,
        });
      }
    } catch (error) {
      console.log("unable to create a class", error);
    }
  };
  const handleUpdateClass = async () => {
    try {
      if (currentClass) {
        await api.updateClass(currentClass.id, className);
        const updatedClass = { ...currentClass, name: className };
        if (navigationState?.stage === School_Creation_Stages.CREATE_CLASS) {
          Util.setNavigationState(School_Creation_Stages.CLASS_COURSE);
          history.replace(PAGES.SUBJECTS_PAGE, {
            classId: updatedClass.id,
            origin: PAGES.ADD_CLASS,
            isSelect: true,
          });
        } else {
          history.replace(PAGES.CLASS_PROFILE, {
            school: currentSchool,
            classDoc: updatedClass,
          });
        }
      }
    } catch (error) {
      console.log("unable to update a class", error);
    }
  };

  const onBackButtonClick = () => {
    if (paramOrigin === PAGES.MANAGE_CLASS) {
      Util.setPathToBackButton(PAGES.MANAGE_CLASS, history);
    } else if (paramOrigin != PAGES.SUBJECTS_PAGE) {
      history.replace(
        paramOrigin === PAGES.HOME_PAGE
          ? PAGES.HOME_PAGE
          : PAGES.DISPLAY_SCHOOLS,
        paramOrigin === PAGES.HOME_PAGE ? { tabValue: 0 } : null
      );
      return;
    } else if (paramOrigin === PAGES.SUBJECTS_PAGE) {
      Util.setNavigationState(School_Creation_Stages.SCHOOL_COURSE);
      history.replace(PAGES.SUBJECTS_PAGE, {
        schoolId: currentSchool.id,
        origin: PAGES.DISPLAY_SCHOOLS,
        isSelect: true,
      });
      return;
    }
  };

  return (
    <div className="edit-class-div">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        showSchool={true}
        schoolName={currentSchool?.name}
      />
      <div className="class-div">
        {isEditMode ? t("Edit Class") : t("Create Class")}
      </div>

      <EditClassField className={className} setClassName={setClassName} />

      <div className="update-button-container">
        <IonButton
          color="#7C5DB0"
          onClick={isEditMode ? handleUpdateClass : handleCreateClass}
          className="view-progress-btn-2"
          disabled={isButtonDisabled || isSaving}
        >
          {isSaving
            ? t("Creating") + "..."
            : isEditMode
              ? t("Update")
              : t("Create")}
        </IonButton>
      </div>
    </div>
  );
};

export default EditClass;
