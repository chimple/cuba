import { FC, useState } from "react";
import { ServiceConfig } from "../../../services/ServiceConfig";
import {
  PAGES,
  CLASS,
  DELETED_CLASSES,
  CLASSES,
  CLASS_OR_SCHOOL_CHANGE_EVENT,
} from "../../../common/constants";
import { useHistory } from "react-router-dom";
import { t } from "i18next";
import "./DeleteClassDialog.css";
import { Util } from "../../../utility/util";

const DeleteClassDialog: FC<{ classId: string }> = ({ classId }) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();

  const handleDeleteClass = async () => {
    try {
      const students = await api.getStudentsForClass(classId);
      if (students.length > 0) {
        setShowAlert(true);
      } else {
        setShowConfirm(true);
      }
    } catch (error) {
      console.error("Failed to fetch students for class", error);
    }
  };

  const confirmDelete = async () => {
    try { 
      await api.deleteClass(classId);
      const tempDeleted = sessionStorage.getItem(DELETED_CLASSES);
      if(tempDeleted) {
        const deletedClasses = JSON.parse(tempDeleted) as string[];
        deletedClasses.push(classId);
        sessionStorage.setItem(DELETED_CLASSES, JSON.stringify(deletedClasses));
      } else {
        sessionStorage.setItem(DELETED_CLASSES, JSON.stringify([classId]));
      }
      const temp = localStorage.getItem(CLASSES);
      if (temp) {
        const classes = JSON.parse(temp) as any[];
        const updatedClasses = classes.filter((cls) => cls.id !== classId);
        localStorage.setItem(CLASSES, JSON.stringify(updatedClasses));
        localStorage.setItem(CLASS, JSON.stringify(updatedClasses[0] || {}));
        api.currentClass = updatedClasses[0];
        Util.setCurrentClass(updatedClasses[0]);
      }
      window.dispatchEvent(new Event(CLASS_OR_SCHOOL_CHANGE_EVENT));
      history.replace(PAGES.MANAGE_CLASS);
    } catch (error) {
      console.error("Failed to delete class", error);
    }
  };

  return (
    <div>
      <div onClick={handleDeleteClass} className="del-class-dialog">
        {t("Delete")}
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">{t("Cannot Delete Class")}</div>
            <div className="modal-message delete-class-modal-message">
              {t("Delete all students to delete class")}
            </div>
            <div className="modal-buttons">
              <button
                className="modal-button-confirm"
                onClick={() => setShowAlert(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-message">
              {t(
                "You have selected to delete a class, would you like to continue?"
              )}
            </div>
            <div className="modal-buttons">
              <button
                className="modal-button-cancel"
                onClick={() => setShowConfirm(false)}
              >
                {t("Cancel")}
              </button>
              <button
                className="modal-button-confirm"
                onClick={confirmDelete}
              >
                {t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteClassDialog;
