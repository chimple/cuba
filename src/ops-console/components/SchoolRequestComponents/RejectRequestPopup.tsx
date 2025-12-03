import React, { useState } from "react";
import "./RejectRequestPopup.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PAGES, REQUEST_TABS, STATUS, USER_ROLE } from "../../../common/constants";
import { useHistory } from "react-router-dom";
import { t } from "i18next";
import { RoleType } from "../../../interface/modelInterfaces";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();


  const VERIFICATION_FAILED = t("Verification Failed");
  const WRONG_SCHOOL_SELECTED = t("Wrong School Selected");
  const OTHER = t("Other");

  function getFinalReason() {
    if (isTeacherOrPrincipal) {
      if (selectedReason === OTHER) {
        return customReason;
      }
      return selectedReason;
    } else {
      return customReason;
    }
  }

  const ctaLabel = isTeacherOrPrincipal && selectedReason === WRONG_SCHOOL_SELECTED ? t("Flag for Review") : t("Reject Request");

  function isFormValid() {
    if (isTeacherOrPrincipal) {
      if (!selectedReason) return false;
      if (selectedReason === OTHER && !customReason.trim()) return false;
    } else {
      if (!customReason.trim()) return false;
    }
    return true;
  }

  async function handleReject() {
    if (!isFormValid()) return;

    setIsLoading(true);
    setError("");

    try {
      if (!requestData || !requestData.id) {
        setError(t("Incomplete request data. Please try again.") || "Incomplete request data. Please try again.");
        setIsLoading(false);
        return;
      }
      const status = isTeacherOrPrincipal && selectedReason === WRONG_SCHOOL_SELECTED ? STATUS.FLAGGED : STATUS.REJECTED;
      const finalReason = getFinalReason();
      let userRoles: string[] = [];
      try {
        userRoles = JSON.parse(
          localStorage.getItem(USER_ROLE) || "[]"
        );
      } catch (error) {
        console.error("Failed to parse user roles from localStorage:", error);
      }
      // Only Super Admin and Operational Director can see the Flagged tab
      const canSeeFlaggedTab =
        userRoles.includes(RoleType.SUPER_ADMIN) ||
        userRoles.includes(RoleType.OPERATIONAL_DIRECTOR);

      await api.respondToSchoolRequest(
        requestData.id,
        requestData.respondedBy.id,
        status,
        isTeacherOrPrincipal ? selectedReason : undefined,
        finalReason
      );
      await api.updateSchoolStatus(requestData.school.id, status);

      const targetTab = status === STATUS.FLAGGED ? REQUEST_TABS.FLAGGED : REQUEST_TABS.REJECTED;
      if (canSeeFlaggedTab) {
        history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${targetTab}`
        );
      }
      else{
           history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${STATUS.ACTIVE}`
        );
      }
    } catch (err) {
      console.error("Error processing request:", err);
      setError(t("Failed to process request. Please try again.") || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="reject-popup-overlay" onClick={onClose}>
      <div className="reject-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="reject-popup-header">
          <div className="reject-popup-header-img">
            <img src="/assets/icons/Exclamation.svg" alt="Exclamation Icon" />
          </div>
          <div className="reject-popup-header-content error">
            <span>{t("Reject Request")} - {requestData.request_id}</span>
            <p>{t("Please provide a reason for rejecting this request")}</p>
          </div>
        </div>

        <div className="reject-popup-body">
          {error && (
            <div className="reject-error-message">
              {error}
            </div>
          )}
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
                    onChange={() => {
                      setSelectedReason(VERIFICATION_FAILED);
                      setCustomReason("");
                    }}
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
                    onChange={() => {
                      setSelectedReason(WRONG_SCHOOL_SELECTED);
                      setCustomReason("");
                    }}
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
            <div className="reject-popup-custom-field">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t("Add any additional context or instructions...") || ""}
                required
              ></textarea>
            </div>
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
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? t("Processing...") : ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestPopup;
