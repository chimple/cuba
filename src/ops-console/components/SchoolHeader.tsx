import React, { useEffect, useState } from "react";
import { BsFillBellFill } from "react-icons/bs";
import "./SchoolHeader.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

interface SchoolHeaderSectionProps {
  id: string;
}

const SchoolHeaderSection: React.FC<SchoolHeaderSectionProps> = ({ id }) => {
  const [schoolName, setSchoolName] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const api = ServiceConfig.getI().apiHandler;
      const data = await api.getSchoolById(id);
      if (data) setSchoolName(data.name);
    }
    fetchData();
  }, [id]);

  if (!schoolName) return <div>Loading header...</div>;

  return (
    <div className="school-header">
      <div className="school-header-row">
        <h1 className="school-header-title">{schoolName}</h1>
        <BsFillBellFill className="school-header-bell" />
      </div>
      <div className="school-header-breadcrumbs">
        <span className="breadcrumb-item">{t("Schools")}</span>
        <span className="breadcrumb-separator" aria-hidden="true">
          &#x25BA;
        </span>
        <span className="breadcrumb-item breadcrumb-current">{schoolName}</span>
      </div>
    </div>
  );
};

export default SchoolHeaderSection;
