import React, { useEffect, useState } from "react";
import "./SchoolDetails.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
interface SchoolDetailsProps {
  schoolName: string;
  schoolId: string | null;
  state: string | null;
  district: string | null;
  cluster: string | null;
  block: string | null;
}

const SchoolDetails: React.FC<SchoolDetailsProps> = ({
  schoolName,
  schoolId,
  state,
  district,
  cluster,
  block,
}) => (
  <div className="school-details-container">
    <div className="school-details-header">
      <h2 className="school-details-title">{t("School Details")}</h2>
    </div>
    <hr className="school-details-divider" />
    <div className="school-details-content">
      <div>
        <p className="school-details-label">{t("School Name")}</p>
        <p className="school-details-value">{schoolName}</p>
      </div>
      <div>
        <p className="school-details-label">{t("School ID (UDISE)")}</p>
        <p className="school-details-value">{schoolId}</p>
      </div>
      <hr className="school-details-divider" />
      <div className="school-details-grid">
        <div>
          <p className="school-details-label">{t("State")}</p>
          <p className="school-details-value">{state}</p>
        </div>
        <div>
          <p className="school-details-label">{t("District")}</p>
          <p className="school-details-value">{district}</p>
        </div>
      </div>
      <div className="school-details-grid school-details-grid-last">
        <div>
          <p className="school-details-label">{t("Cluster")}</p>
          <p className="school-details-value">{cluster}</p>
        </div>
        <div>
          <p className="school-details-label">{t("Block")}</p>
          <p className="school-details-value">{block}</p>
        </div>
      </div>
    </div>
  </div>
);

interface SchoolDetailsSectionProps {
  id: string;
}

const SchoolDetailsSection: React.FC<SchoolDetailsSectionProps> = ({ id }) => {
  const [schoolData, setSchoolData] = useState<SchoolDetailsProps | null>(null);

  useEffect(() => {
    async function fetchData() {
      const api = ServiceConfig.getI().apiHandler;
      const data = await api.getSchoolById(id);
      console.log("data found", data);
      if (data) {
        setSchoolData({
          schoolName: data.name,
          schoolId: data.udise,
          state: data.group1,
          district: data.group2,
          cluster: data.group3,
          block: data.group4,
        });
      }
    }
    fetchData();
  }, [id]);

  if (!schoolData) return <div>Loading school details...</div>;

  return <SchoolDetails {...schoolData} />;
};

export default SchoolDetailsSection;
