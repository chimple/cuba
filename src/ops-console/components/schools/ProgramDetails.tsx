import React, { useEffect, useState } from "react";
import "./ProgramDetails.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";

interface ProgramDetailsProps {
  programName: string;
  programType: string;
  model: string;
  managerName: string;
  managerRole: string;
  managerContact: string;
}

const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  programName,
  programType,
  model,
  managerName,
  managerRole,
  managerContact,
}) => {
  return (
    <div className="program-details-container">
      <div className="program-details-header">
        <h2 className="program-details-title">{t("Program Details")}</h2>
      </div>
      <hr className="program-details-divider" />
      <div className="program-details-content">
        <div>
          <p className="program-details-label">{t("Program Name")}</p>
          <p className="program-details-value">{programName}</p>
        </div>
        <div>
          <p className="program-details-label">{t("Program Type")}</p>
          <p className="program-details-value">{programType}</p>
        </div>
        <div>
          <p className="program-details-label">{t("Model")}</p>
          <p className="program-details-value">{model}</p>
        </div>
        <hr className="program-details-divider" />
        <div>
          <p className="program-details-subtitle">{t("Program Manager")}</p>
          <div className="program-details-contact-box">
            <div className="program-details-contact-left">
              <p>
                <strong>{managerName}</strong>
              </p>
              <p>{managerRole}</p>
            </div>
            <span className="program-details-contact-phone">
              {managerContact}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProgramDetailsSectionProps {
  id: string;
}

const ProgramDetailsSection: React.FC<ProgramDetailsSectionProps> = ({
  id,
}) => {
  const [programData, setProgramData] = useState<ProgramDetailsProps | null>(
    null
  );

  useEffect(() => {
    async function fetchData() {
      const api = ServiceConfig.getI().apiHandler;
      const program = await api.getProgramForSchool(id);
      const managers = await api.getProgramManagersForSchool(id);
      console.log("managers", managers);

      if (program) {
        const manager = managers?.[0];
        console.log("managers", manager);
        setProgramData({
          programName: program.name || "N/A",
          programType: program.program_type || "N/A",
          model: program.model || "N/A",
          managerName: manager?.name || "N/A",
          managerRole: "Program Manager",
          managerContact: manager?.phone || manager?.email || "N/A",
        });
      }
    }

    fetchData();
  }, [id]);

  if (!programData) return <div>Loading program details...</div>;

  return <ProgramDetails {...programData} />;
};

export default ProgramDetailsSection;
