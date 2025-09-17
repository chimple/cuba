import React, { useEffect, useState } from "react";
import "./JoinSchool.css";
import Header from "../teachers-module/components/homePage/Header";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory, useLocation } from "react-router-dom";
import { PAGES, RequestTypes } from "../common/constants";
import { t } from "i18next";

const JoinSchool: React.FC = () => {
  const [requestType, setRequestType] = useState<RequestTypes>();
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const history = useHistory();
  const location = useLocation<{ school: any }>();
  const [classList, setClassList] = useState<any>([]);
  const [sending, setSending] = useState(false);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    async function fetchRequest() {
      try {
        const currentSchool = location.state?.school;
        setSchool(currentSchool);

        const allClasses = await api.getAllClassesBySchoolId(
          currentSchool?.id
        );
        setClassList(allClasses);
      } catch (error) {
        console.error("Error fetching request data:", error);
      }
    }
    fetchRequest();
  }, []);

  useEffect(() => {
    if (sending) {
      handleSendRequest();
    }
  }, [sending])

  const handleSendRequest = async () => {
    const schoolId = school?.id;
    if (!schoolId || !requestType) return;

    const classId =
      requestType === RequestTypes.TEACHER
        ? selectedClass.id ?? undefined
        : undefined;

    try {
      await api.sendJoinSchoolRequest(schoolId, requestType, classId);
      setSending(false);
      history.replace(PAGES.REQ_ADD_SCHOOL);
    } catch (error) {
      console.error("Error sending join school request:", error);
    }
  };

  return (
    <div className="join-school-main">
      <div className="join-school-header">
        <Header
          isBackButton={true}
          onBackButtonClick={() => history.goBack()}
        />
      </div>
      <div className="join-school-container">
        <div className="join-school-box">
          <h2 className="join-school-page-title">{t("Join School")}</h2>

          <div className="join-school-icon">
            <img src="/assets/icons/School_image.svg" />
          </div>

          <div className="join-school-card">
            <div className="join-school-row">
              <span className="join-school-label">UDISE ID</span>
              <span className="join-school-value">{school?.udise || "-"}</span>
            </div>

            <div className="join-school-row">
              <span className="join-school-label">{t("School Name")}</span>
              <span className="join-school-value">{school?.name}</span>
            </div>
            <div className="join-school-row">
              <span className="join-school-label">{t("Block")}</span>
              <span className="join-school-value">{school?.group4 || "-"}</span>
            </div>
            <div className="join-school-row">
              <span className="join-school-label">{t("District")}</span>
              <span className="join-school-value">{school?.group3}</span>
            </div>
            <div className="join-school-row">
              <span className="join-school-label">{t("State")}</span>
              <span className="join-school-value">{school?.group1}</span>
            </div>
            <div className="join-school-row" style={{ borderBottom: "none" }}>
              <span className="join-school-label">{t("Country")}</span>
              <span className="join-school-value">{school?.country}</span>
            </div>
          </div>

          <div className="join-school-role-container">
            <div
              className="join-school-role-card"
              onClick={() => setRequestType(RequestTypes.TEACHER)}
            >
              <div className="join-school-role-icon">
                <img
                  src={
                    requestType === RequestTypes.TEACHER
                      ? "/assets/icons/teacher_selected.png"
                      : "/assets/icons/teacher.png"
                  }
                  alt="Teacher"
                />
              </div>
            </div>

            <div
              className="join-school-role-card"
              onClick={() => setRequestType(RequestTypes.PRINCIPAL)}
            >
              <div className="join-school-role-icon">
                <img
                  src={
                    requestType === RequestTypes.PRINCIPAL
                      ? "/assets/icons/principal_selected.png"
                      : "/assets/icons/principal.png"
                  }
                  alt="Principal"
                />
              </div>
            </div>
          </div>

          <div
            className={`join-school-class-container ${requestType === RequestTypes.TEACHER ? "" : "hidden"
              }`}
          >
            {requestType === RequestTypes.TEACHER &&
              classList.map((cls) => (
                <button
                  key={cls}
                  className={`join-school-class-btn ${selectedClass === cls ? "join-school-selected-class" : ""
                    }`}
                  onClick={() => setSelectedClass(cls)}
                >
                  {cls.name}
                </button>
              ))}
          </div>

          {sending ? (
            <button className="join-school-send-btn" disabled>{t("Sending...")}</button>
          ) : (
            <button
              className="join-school-send-btn"
              disabled={
                !requestType ||
                (requestType === RequestTypes.TEACHER && !selectedClass)
              }
              onClick={() => setSending(true)}
            >
              {t("Send Request")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinSchool;
