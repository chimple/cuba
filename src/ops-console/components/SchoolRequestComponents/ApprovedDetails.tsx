import React from "react";
import "./ApprovedDetails.css";

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
      <div className="approved-details-title">Approved Details</div>
      <div className="approved-details-divider" />
      <div className="approved-details-row">
        <span className="approved-details-label">Approved by:</span>
        <span className="approved-details-value">{approvedBy}</span>
      </div>
      <div className="approved-details-row">
        <span className="approved-details-label">Approved on:</span>
        <span className="approved-details-value">{approvedOn}</span>
      </div>
    </div>
  );
};

export default ApprovedDetails;
