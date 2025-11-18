import { FC, useState, useEffect } from "react";
import { IonButton } from "@ionic/react";
import { ServiceConfig } from "../../services/ServiceConfig";
import EditClassField from "../components/classComponents/EditClassField";
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  CLASSES,
  PAGES,
  School_Creation_Stages,
  TableTypes,
} from "../../common/constants";
import { useHistory, useLocation } from "react-router-dom";
import Header from "../components/homePage/Header";
import { Util } from "../../utility/util";
import "./EditClass.css";
import { t } from "i18next";

type LocationState = {
  school?: TableTypes<"school">;
  classDoc?: TableTypes<"class">;
  origin?: string;
};

const EditClass: FC = () => {
  const location = useLocation<LocationState>();
  const api = ServiceConfig.getI()?.apiHandler;
  const incoming = location.state?.classDoc ?? Util.getCurrentClass();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class"> | null>(null);
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
    let classToUse = tempClass ?? Util.getCurrentClass();
      if (classToUse) {
        setCurrentClass(classToUse);
        setClassName(classToUse.name);
      }
    } catch (error) {
      console.error("Failed to load class details.",error);
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
      console.error("unable to create a class", error);
    }
  };

  const handleUpdateClass = async () => {
    if (!currentClass) return;
    try {
      setIsSaving(true);
      await api.updateClass(currentClass.id, className);
      const raw = localStorage.getItem(CLASSES) || "[]";
      const temp: Array<{ id: string; name: string }> = JSON.parse(raw);
      const updatedList = temp.map(c =>
        c.id === currentClass.id
          ? { ...c, name: className }
          : c
      );
      localStorage.setItem(CLASSES, JSON.stringify(updatedList));
      const updatedClass = { ...currentClass, name: className };
      Util.setCurrentClass(updatedClass);
      window.dispatchEvent(new Event(CLASS_OR_SCHOOL_CHANGE_EVENT));
      history.replace(PAGES.MANAGE_CLASS);
    } catch (error) {
      console.error("unable to update a class", error);
    } finally {
      setIsSaving(false);
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
        showClass={true}
        schoolName={currentSchool?.name}
        className={currentClass?.name}
      />
      <div className="class-div">
        {isEditMode ? t("Edit Class") : t("Create Class")}
      </div>
      <hr className="class-profile-horizontal-line" />

      <EditClassField className={className} setClassName={setClassName} />
      <hr className="class-profile-horizontal-line" />

      <div className="update-button-container">
        <button
          color="#7C5DB0"
          onClick={isEditMode ? handleUpdateClass : handleCreateClass}
          className="view-progress-btn-2"
          disabled={isButtonDisabled || isSaving}
          id="create-class-btn"
        >
          {isSaving
            ? t("Creating") + "..."
            : isEditMode
              ? t("Save")
              : t("Create")}
        </button>
      </div>
    </div>
  );
};

export default EditClass;