import React, { useState } from "react";
import "./RejectRequestPopup.css";
import ExclamationIcon from "../../assets/icons/Exclamation.svg";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PAGES, REQUEST_TABS } from "../../../common/constants";
import { useHistory } from "react-router-dom";

interface RejectRequestPopupProps {
  requestData?: any;
  onClose: () => void;
}

const RejectRequestPopup: React.FC<RejectRequestPopupProps> = ({
  requestData,
  onClose,
}) => {
  const [reason, setReason] = useState("");
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  async function handleReject() {
    await api.respondToSchoolRequest(
      requestData.request_id,
      requestData.respondedBy.id,
      "rejected",
      reason
    );
    await api.updateSchoolStatus(requestData.school.id, "rejected");
    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.REJECTED}`
    );
  }
  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <div className="popup-header-img">
            <img src={ExclamationIcon} alt="error icon" />
          </div>
          <div className="popup-header-content error">
            <span>Reject Request - {requestData.request_id}</span>
            <p>Please provide a reason for rejecting this request</p>
          </div>
        </div>

        <div className="popup-body">
          <label>Reason for Rejection</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add any additional context or instructions..."
          ></textarea>
        </div>

        <div className="popup-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="reject-btn" onClick={handleReject}>
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestPopup;
