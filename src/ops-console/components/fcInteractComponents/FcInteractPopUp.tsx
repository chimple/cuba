import React, { useState, useMemo, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import "./FcInteractPopUp.css";
import { LaunchRounded } from "@mui/icons-material";
import EmailRounded from "@mui/icons-material/EmailRounded";
import {
  EnumType,
  PrincipalInfo,
  StudentInfo,
  TeacherInfo,
} from "../../../common/constants";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";

type Q = { id: string; question: string };
const supportLevelReverseMap: Record<EnumType<"fc_support_level">, string> = {
  doing_good: "Doing Good",
  still_learning: "Still Learning",
  need_help: "Need Help",
  not_tracked: "Not Tracked",
  not_assigning_per_month: "Not Assigning Per Month",
  once_a_month: "Once a Month",
  once_a_week: "Once a Week",
  two_plus_per_week: "2+ per Week",
};

const callOutcomeOptions: {
  value: EnumType<"fc_call_result">;
  label: string;
}[] = [
  { value: "call_picked", label: "Call Attended" },
  { value: "call_later", label: "Call Later" },
  { value: "call_not_reachable", label: "No Response" },
];

const engagementTargetOptions: {
  value: EnumType<"fc_engagement_target">;
  label: string;
}[] = [
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

type FcInteractPopUpProps = {
  schoolId: string;
  studentData?: StudentInfo;
  teacherData?: TeacherInfo;
  principalData?: PrincipalInfo;
  status?: EnumType<"fc_support_level">;
  onClose: () => void;
  initialUserType: EnumType<"fc_engagement_target">;
};

const FcInteractPopUp: React.FC<FcInteractPopUpProps> = ({
  studentData,
  schoolId,
  teacherData,
  principalData,
  status,
  onClose,
  initialUserType,
}) => {
  const [mode, setMode] = useState<EnumType<"fc_contact_method">>("in_person");
  const [callOutcome, setCallOutcome] = useState<
    EnumType<"fc_call_result"> | ""
  >("");
  const [spokeWith, setSpokeWith] =
    useState<EnumType<"fc_engagement_target">>("student");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [otherComments, setOtherComments] = useState("");
  const [techIssueMarked, setTechIssueMarked] = useState(false);
  const [techIssueDetails, setTechIssueDetails] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const api = ServiceConfig.getI().apiHandler;
  const authHandler = ServiceConfig.getI().authHandler;

  const normalizedStatus = status
    ? supportLevelReverseMap[status] ?? status
    : "";

  const [localQuestions, setLocalQuestions] = useState<Q[]>([]);

  let name = "";
  let phone = "";
  let email = "";
  let className = "";

  if (studentData) {
    const { user, parent, classSection, grade } = studentData;

    name = user?.name ?? "";
    phone = user?.phone ?? parent?.phone ?? "";
    email = user?.email ?? parent?.email ?? "";
    className = classSection ?? grade ?? "";
  } else if (teacherData) {
    const { user, grade, classSection } = teacherData;
    name = user?.name ?? "";
    phone = user?.phone ?? "";
    email = user?.email ?? "";
    className = classSection || grade?.toString() || "";
  } else if (principalData) {
    name = principalData?.name ?? "";
    phone = principalData?.phone ?? "";
    email = principalData?.email ?? "";
  }

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!status) return;

      try {
        const questions = await api.getFilteredFcQuestions(status, spokeWith);

        const formattedQuestions =
          questions?.map((q) => ({
            id: q.sort_order.toString(),
            question: q.question_text,
          })) ?? [];

        if (mounted) {
          setLocalQuestions(formattedQuestions);
          setResponses({});
        }
      } catch (err) {
        console.error("Question fetch error", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [status, spokeWith, api]);

  const handleResponseChange = (id: string, value: string) => {
    setResponses((p) => ({ ...p, [id]: value }));
  };

  const mandatoryQuestions = localQuestions;
  const otherQuestions: Q[] = [];

  const showMandatory =
    mode === "in_person" || (mode === "call" && callOutcome === "call_picked");

  const isFormValid = useMemo(() => {
    if (mode === "call" && callOutcome === "") return false;
    if (!spokeWith) return false;

    if (showMandatory) {
      for (const q of mandatoryQuestions) {
        if (!responses[q.id] || responses[q.id].trim() === "") return false;
      }
    }

    return true;
  }, [mode, callOutcome, mandatoryQuestions, responses, spokeWith]);

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;
    setIsSaving(true);

    try {
      const mappedResponses = Object.fromEntries(
        Object.entries(responses)
          .filter(([_, v]) => v.trim() !== "")
          .map(([id, val]) => {
            const q = localQuestions.find((x) => x.id === id);
            return [q?.question ?? id, val.trim()];
          })
      );

      const currentUser = await authHandler.getCurrentUser();
      const visitId = await api.getTodayVisitId(currentUser?.id!, schoolId);

      const payload = {
        visitId: visitId ?? null,
        userId: currentUser!.id,
        schoolId,
        classId: studentData?.classWithidname?.id ?? null,
        contactUserId: studentData?.user.id,
        contactTarget: spokeWith,
        contactMethod: mode,
        callStatus: mode === "call" && callOutcome !== "" ? callOutcome : null,
        supportLevel: status ?? null,
        questionResponse: mappedResponses,
        comment: otherComments.trim() || null,
        techIssueComment: techIssueMarked ? techIssueDetails.trim() : null,
        techIssuesReported: techIssueMarked,
        activityType: mode === "call" ? "call" : "in_person",
      };

      await api.saveFcUserForm(payload);
      onClose();
    } catch (err) {
      console.error("Failed to save FC interaction:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fc-interact-popup-overlay" id="fc-popup-overlay">
      <div
        className="fc-interact-popup-modal fc-interact-popup-interact-popup"
        role="dialog"
        aria-modal
        id="fc-popup-modal"
      >
        <button
          className="fc-interact-popup-close"
          onClick={onClose}
          aria-label="Close"
          id="fc-close-btn"
        >
          <IoClose size={22} />
        </button>

        <div className="fc-interact-popup-grid" id="fc-popup-grid">
          <div className="fc-interact-popup-left-card" id="fc-left-card">
            <div
              className="fc-interact-popup-left-card-inner"
              id="fc-left-inner"
            >
              <div className="fc-interact-popup-left-top" id="fc-left-top">
                <div id="fc-user-info-wrapper">
                  <div className="fc-interact-popup-name" id="fc-user-name">
                    {name}
                  </div>
                  {className && (
                    <div className="fc-interact-popup-class" id="fc-user-class">
                      {t("Class")} {className}
                    </div>
                  )}
                </div>

                {normalizedStatus && (
                  <div
                    className="fc-interact-popup-status-badge"
                    id="fc-status-badge"
                  >
                    {normalizedStatus}
                  </div>
                )}
              </div>

              <div
                className="fc-interact-popup-contact"
                id="fc-contact-section"
              >
                {phone ? (
                  <div
                    className="fc-interact-popup-contact-line"
                    id="fc-phone-line"
                    onClick={() => (window.location.href = `tel:${phone}`)}
                  >
                    <span
                      className="fc-interact-popup-contact-text"
                      id="fc-phone-text"
                    >
                      +91 {phone}
                    </span>
                    <LaunchRounded style={{ fontSize: 16 }} />
                  </div>
                ) : (
                  <div
                    className="fc-interact-popup-contact-line"
                    id="fc-email-line"
                    onClick={() => (window.location.href = `mailto:${email}`)}
                  >
                    <span
                      className="fc-interact-popup-contact-text"
                      id="fc-email-text"
                    >
                      {email}
                    </span>
                    <EmailRounded style={{ fontSize: 16 }} />
                  </div>
                )}
              </div>

              <div className="fc-interact-popup-divider" id="fc-divider" />

              {/* Mode */}
              <div className="fc-interact-popup-section" id="fc-mode-section">
                <div className="fc-interact-popup-label" id="fc-mode-label">
                  {t("Mode of Interaction")}
                </div>
                <div
                  className="fc-interact-popup-radio-group"
                  id="fc-mode-radio-group"
                >
                  <label
                    className="fc-interact-popup-radio-item"
                    id="fc-mode-inperson-label"
                  >
                    <input
                      type="radio"
                      name="mode"
                      id="fc-mode-inperson"
                      checked={mode === "in_person"}
                      onChange={() => {
                        setMode("in_person");
                        setCallOutcome("");
                      }}
                    />
                    In Person
                  </label>

                  <label
                    className="fc-interact-popup-radio-item"
                    id="fc-mode-call-label"
                  >
                    <input
                      type="radio"
                      name="mode"
                      id="fc-mode-call"
                      checked={mode === "call"}
                      onChange={() => setMode("call")}
                    />
                    {t("Phone Call")}
                  </label>
                </div>
              </div>

              {/* Call outcome */}
              {mode === "call" && (
                <div
                  className="fc-interact-popup-section"
                  id="fc-call-outcome-section"
                >
                  <div
                    className="fc-interact-popup-label"
                    id="fc-call-outcome-label"
                  >
                    {t("Select call outcome")}
                  </div>
                  <select
                    className="fc-interact-popup-select"
                    id="fc-call-outcome-select"
                    value={callOutcome}
                    onChange={(e) =>
                      setCallOutcome(
                        e.target.value as EnumType<"fc_call_result">
                      )
                    }
                  >
                    <option value="" id="fc-call-outcome-empty">
                      {t("Select call outcome")}
                    </option>

                    {callOutcomeOptions.map((o) => (
                      <option
                        key={o.value}
                        value={o.value}
                        id={`fc-call-outcome-${o.value}`}
                      >
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Spoke With */}
              {initialUserType === "student" && (
                <div
                  className="fc-interact-popup-section speak-with-section"
                  id="fc-spoke-section"
                >
                  <div className="fc-interact-popup-label" id="fc-spoke-label">
                    {t("Who did you speak with?")}
                  </div>

                  <div
                    className="fc-interact-popup-radio-group"
                    id="fc-spoke-radio-group"
                  >
                    {engagementTargetOptions.map((option) => (
                      <label
                        key={option.value}
                        className="fc-interact-popup-radio-item"
                        id={`fc-spoke-${option.value}`}
                      >
                        <input
                          type="radio"
                          name="spokeWith"
                          id={`fc-spoke-radio-${option.value}`}
                          checked={spokeWith === option.value}
                          onChange={() => setSpokeWith(option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="fc-interact-popup-right-area" id="fc-right-area">
            <div
              className="fc-interact-popup-questions-grid"
              id="fc-questions-grid"
            >
              {showMandatory &&
                mandatoryQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="fc-interact-popup-question-row"
                    id={`fc-question-${q.id}`}
                  >
                    <div className="fc-interact-popup-question-header">
                      <span
                        className="fc-interact-popup-badge"
                        id={`fc-badge-${q.id}`}
                      >
                        {idx + 1}
                      </span>

                      <div
                        className="fc-interact-popup-question-text"
                        id={`fc-question-text-${q.id}`}
                      >
                        {q.question}
                        <span
                          className="fc-interact-popup-required"
                          id={`fc-required-${q.id}`}
                        >
                          *
                        </span>
                      </div>
                    </div>

                    <textarea
                      className="fc-interact-popup-textarea-input"
                      rows={3}
                      id={`fc-textarea-${q.id}`}
                      value={responses[q.id] ?? ""}
                      onChange={(e) =>
                        handleResponseChange(q.id, e.target.value)
                      }
                      placeholder={t("Type your answer...") || ""}
                      disabled={!showMandatory}
                    />
                  </div>
                ))}

              {otherQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="fc-interact-popup-question-row"
                  id={`fc-question-${q.id}`}
                >
                  <div className="fc-interact-popup-question-header">
                    <span
                      className="fc-interact-popup-badge"
                      id={`fc-badge-${q.id}`}
                    >
                      {mandatoryQuestions.length + idx + 1}
                    </span>
                    <div
                      className="fc-interact-popup-question-text"
                      id={`fc-question-text-${q.id}`}
                    >
                      {q.question}
                    </div>
                  </div>

                  <textarea
                    className="fc-interact-popup-textarea-input"
                    rows={3}
                    id={`fc-textarea-${q.id}`}
                    value={responses[q.id] ?? ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    placeholder={t("Type your answer...") || ""}
                  />
                </div>
              ))}
            </div>

            {/* Other comments */}
            <div
              className="fc-interact-popup-section fc-interact-popup-comments-section"
              id="fc-comments-section"
            >
              <div className="fc-interact-popup-label" id="fc-comments-label">
                {t("Any other questions or comments?")}
              </div>
              <textarea
                className="fc-interact-popup-textarea-input"
                rows={3}
                id="fc-comments-textarea"
                value={otherComments}
                onChange={(e) => setOtherComments(e.target.value)}
                placeholder={
                  t(
                    "Add any additional points, observations, or feedback here..."
                  ) || ""
                }
              />
            </div>

            {/* Tech Issues */}
            <div
              className="fc-interact-popup-section fc-interact-popup-tech-section"
              id="fc-tech-section"
            >
              <div
                className="fc-interact-popup-radio-group"
                id="fc-tech-radio-group"
              >
                <label
                  className="fc-interact-popup-radio-item"
                  id="fc-tech-label"
                >
                  <input
                    type="radio"
                    name="tech-issue"
                    id="fc-tech-radio"
                    checked={techIssueMarked}
                    onChange={() => setTechIssueMarked(true)}
                  />
                  {t("Any tech issues reported")}
                </label>
              </div>

              {techIssueMarked && (
                <div style={{ marginTop: 8 }} id="fc-tech-details-wrapper">
                  <textarea
                    className="fc-interact-popup-textarea-input"
                    rows={3}
                    id="fc-tech-textarea"
                    value={techIssueDetails}
                    onChange={(e) => setTechIssueDetails(e.target.value)}
                    placeholder={
                      t("Add if any tech issues were reported...") || ""
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fc-interact-popup-footer" id="fc-footer">
          <button
            className="fc-interact-popup-cancel-btn"
            onClick={onClose}
            id="fc-cancel-btn"
          >
            {t("Cancel")}
          </button>

          <button
            className={`fc-interact-popup-save-btn ${
              !isFormValid || isSaving ? "fc-interact-popup-save-disabled" : ""
            }`}
            id="fc-save-btn"
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? `${t("Saving...")} ` : `${t("Save")}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FcInteractPopUp;
