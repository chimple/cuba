import React, { FC } from "react";
import { IonButton } from "@ionic/react";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import "./CreateSchoolPrompt.css";
import { t } from "i18next";

interface CreateSchoolPromptProps {
  country?: string;
  state?: string;
  district?: string;
  block?: string;
}

const CreateSchoolPrompt: FC<CreateSchoolPromptProps> = ({
  country,
  state,
  district,
  block,
}) => {
  const history = useHistory();

  const handleCreateSchool = () => {
    history.push(PAGES.CREATE_SCHOOL, {
      origin: PAGES.SEARCH_SCHOOL,
      country,
      state,
      district,
      block,
    });
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
