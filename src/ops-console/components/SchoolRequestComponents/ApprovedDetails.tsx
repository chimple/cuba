import React from "react";
import "./ApprovedDetails.css";
import { t } from "i18next";
import { OpsUtil } from "../../OpsUtility/OpsUtil";

interface ApprovedDetailsProps {
  approvedBy: string;
  approvedOn: string;
}

const ApprovedDetails: React.FC<ApprovedDetailsProps> = ({
  approvedBy,
  approvedOn,
}) => {
  return (
    <div className="approved-details-card">
      <div className="approved-details-title">{t("Approved Details")}</div>
      <div className="approved-details-divider" />
      <div className="approved-details-row">
        <span className="approved-details-label">{t("Approved by")}:</span>
        <span className="approved-details-value">{approvedBy}</span>
      </div>
      <div className="approved-details-row">
        <span className="approved-details-label">{t("Approved on")}:</span>
        <span className="approved-details-value">{OpsUtil.formatDT(approvedOn)}</span>
      </div>
    </div>
  );
};

export default ApprovedDetails;
