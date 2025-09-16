import React, { FC } from "react";
import { IonButton } from "@ionic/react";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import "./CreateSchoolPrompt.css";
import { t } from "i18next";

const CreateSchoolPrompt: FC = () => {
  const history = useHistory();

  const handleCreateSchool = () => {
    history.push(PAGES.REQ_ADD_SCHOOL, { origin: PAGES.SEARCH_SCHOOL });
  };

  return (
    <div className="create-school-prompt-box">
      <p>
        <strong>{t("School not found ")}?</strong>
      </p>
      <p>{t("Click below to create a school")}</p>
      <IonButton className="create-school-button" onClick={handleCreateSchool}>
        {t("Create School")}
      </IonButton>
    </div>
  );
};

export default CreateSchoolPrompt;
