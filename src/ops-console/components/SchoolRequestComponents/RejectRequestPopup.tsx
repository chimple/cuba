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
  const requestType = requestData?.type;
  const isTeacherOrPrincipal = requestType === 'teacher' || requestType === 'principal';
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();


  const VERIFICATION_FAILED = t("Verification Failed");
  const WRONG_SCHOOL_SELECTED = t("Wrong School Selected");
  const OTHER = t("Other");

  function getFinalReason() {
    if (isTeacherOrPrincipal) {
      if (selectedReason === VERIFICATION_FAILED) return VERIFICATION_FAILED;
      if (selectedReason === WRONG_SCHOOL_SELECTED) return WRONG_SCHOOL_SELECTED;
      if (selectedReason === OTHER) return customReason;
      return customReason;
    } else {
      return customReason;
    }
  }

  const ctaLabel = isTeacherOrPrincipal && selectedReason === WRONG_SCHOOL_SELECTED ? t("Flag for Review") : t("Reject Request");

  async function handleReject() {
    const status = isTeacherOrPrincipal && selectedReason === WRONG_SCHOOL_SELECTED ? STATUS.FLAGGED : STATUS.REJECTED;
    // Send selectedReason as rejected_reason_type, customReason as rejected_reason_description
    await api.respondToSchoolRequest(
      requestData.id,
      requestData.respondedBy.id,
      status,
      selectedReason,
      customReason
    );
    await api.updateSchoolStatus(requestData.school.id, status);
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
          {isTeacherOrPrincipal ? (
            <div className="reject-reason-section">
              <div className="reject-reason-radio-group">
                <label className={`reject-reason-radio${selectedReason === VERIFICATION_FAILED ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="reject-reason"
                    value={VERIFICATION_FAILED}
                    checked={selectedReason === VERIFICATION_FAILED}
                    onChange={() => setSelectedReason(VERIFICATION_FAILED)}
                  />
                  <div>
                    <span>{VERIFICATION_FAILED}</span>
                    <div className="reject-reason-desc">{t("Unable to verify provided information")}</div>
                  </div>
                </label>
                <label className={`reject-reason-radio${selectedReason === WRONG_SCHOOL_SELECTED ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="reject-reason"
                    value={WRONG_SCHOOL_SELECTED}
                    checked={selectedReason === WRONG_SCHOOL_SELECTED}
                    onChange={() => setSelectedReason(WRONG_SCHOOL_SELECTED)}
                  />
                  <div>
                    <span>{WRONG_SCHOOL_SELECTED}</span>
                    <div className="reject-reason-desc">{t("Incorrect school name was selected for this request")}</div>
                  </div>
                </label>
                <label className={`reject-reason-radio${selectedReason === OTHER ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="reject-reason"
                    value={OTHER}
                    checked={selectedReason === OTHER}
                    onChange={() => setSelectedReason(OTHER)}
                  />
                  <div>
                    <span>{OTHER}</span>
                    <div className="reject-reason-desc">{t("Please specify the reason in the custom field")}</div>
                  </div>
                </label>
              </div>
              {selectedReason === OTHER && (
                <div className="reject-popup-custom-field">
                  <label>{t("Message to Admin")}</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={t("Add any additional context or instructions...") || ""}
                  ></textarea>
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t("Add any additional context or instructions...") || ""}
            ></textarea>
          )}
        </div>

        <div className="reject-popup-footer">
          <button className="reject-popup-cancel-btn" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button 
            className={isTeacherOrPrincipal && selectedReason === WRONG_SCHOOL_SELECTED 
              ? "reject-popup-flag-btn" 
              : "reject-popup-reject-btn"
            } 
            onClick={handleReject}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestPopup;
