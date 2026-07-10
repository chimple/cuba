import React, { FC } from "react";
import { useHistory } from "react-router";
import noSchoolImage from "../assets/images/no_school_found.svg";
import "./NoSchoolsFound.css";
import { t } from "i18next";
import CreateSchoolPrompt from "./CreateSchoolPrompt";

const NoSchoolsFound: FC = () => {
  const history = useHistory();

  const handleCreateSchool = () => {
    // Navigate to the page for creating/requesting a new school
    // history.push(PAGES.REQ_ADD_SCHOOL, { origin: PAGES.CREATESCHOOL } );
  };

  return (
    <div className="no-schools-found-container">
      <img
        src={noSchoolImage}
        alt="No results found"
        className="no-schools-found-image"
      />
      <h2 className="no-schools-found-title">{t("No Results Found")}</h2>
      <p className="no-schools-found-subtitle">
        {t(
          "Refine your results using filters or by rephrasing your school name"
        )}
      </p>
      <hr className="no-schools-found-divider" />
      <CreateSchoolPrompt />
    </div>
  );
};

export default NoSchoolsFound;
