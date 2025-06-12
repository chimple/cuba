import { FC, useState } from "react";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PAGES, CLASS } from "../../../common/constants";
import { useHistory } from "react-router-dom";
import { t } from "i18next";
import "./DeleteClassDialog.css";

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
      localStorage.removeItem(CLASS);
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
            <div className="modal-message">
              {t("Delete all students to delete class")}
            </div>
            <div className="modal-buttons">
              <button className="modal-button-confirm" onClick={() => setShowAlert(false)}>
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
              {t("You have selected to delete a class, would you like to continue?")}
            </div>
            <div className="modal-buttons">
              <button className="modal-button-cancel" onClick={() => setShowConfirm(false)}>
                {t("Cancel")}
              </button>
              <button className="modal-button-confirm" onClick={confirmDelete}>
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
