import { FC, useState } from "react";
import { IonAlert } from "@ionic/react";
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
      <div onClick={handleDeleteClass}>{t("Delete")}</div>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={t("Cannot Delete Class") ?? ""}
        message={t("Delete all students to delete class") ?? ""}
        buttons={["OK"]}
        cssClass="custom-alert"
      />

      <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        cssClass="custom-alert"
        message={
          t(
            "You have selected to delete a class, would you like to continue?"
          ) || ""
        }
        buttons={[
          {
            text: t("Delete"),
            cssClass: "alert-delete-button",
            handler: confirmDelete,
          },
          {
            text: t("Cancel"),
            cssClass: "alert-cancel-button",
            handler: () => setShowConfirm(false),
          },
        ]}
      />
    </div>
  );
};

export default DeleteClassDialog;
