import React, { useState } from "react";
import "./RejectRequestPopup.css";
import ExclamationIcon from "../../assets/icons/Exclamation.svg";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PAGES, REQUEST_TABS, STATUS } from "../../../common/constants";
import { useHistory } from "react-router-dom";
import { t } from "i18next";

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
      requestData.id,
      requestData.respondedBy.id,
      STATUS.REJECTED,
      reason
    );
    await api.updateSchoolStatus(requestData.school.id, STATUS.REJECTED);
    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.REJECTED}`
    );
  }
  return (
    <div className="reject-popup-overlay">
      <div className="reject-popup-container">
        <div className="reject-popup-header">
          <div className="reject-popup-header-img">
            <img src={ExclamationIcon} alt="error icon" />
          </div>
          <div className="reject-popup-header-content error">
            <span>{t("Reject Request")} - {requestData.request_id}</span>
            <p>{t("Please provide a reason for rejecting this request")}</p>
          </div>
        </div>

        <div className="reject-popup-body">
          <label>{t("Reason for Rejection")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("Add any additional context or instructions...")||""}
          ></textarea>
        </div>

        <div className="reject-popup-footer">
          <button className="reject-popup-cancel-btn" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button className="reject-popup-reject-btn" onClick={handleReject}>
            {t("Reject Request")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestPopup;
