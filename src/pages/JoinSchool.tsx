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

  const fetchRequest = async () => {
    try {
      const currentSchool = location.state?.school;
      setSchool(currentSchool);

      const allClasses = await api.getAllClassesBySchoolId(currentSchool?.id);
      setClassList(allClasses);

      // Set default Teacher and First Class
      if (allClasses && allClasses.length > 0) {
        setRequestType(RequestTypes.TEACHER);
        setSelectedClass(allClasses[0]);
      }
    } catch (error) {
      console.error("Error fetching request data:", error);
    }
  }
  useEffect(() => {
    fetchRequest();
  }, []);

  const handleSendRequest = async () => {
    try {
      setSending(true);
      const schoolId = school?.id;
      if (!schoolId || !requestType) return;

      const classId =
        requestType === RequestTypes.TEACHER
          ? selectedClass.id ?? undefined
          : undefined;

      await api.sendJoinSchoolRequest(schoolId, requestType, classId);
      history.replace(PAGES.POST_SUCCESS);
    } catch (error) {
      console.error("Error sending join school request:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="join-school-page">
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
              <span className="join-school-value">{school?.group3 || "-"}</span>
            </div>
            <div className="join-school-row">
              <span className="join-school-label">{t("District")}</span>
              <span className="join-school-value">{school?.group2}</span>
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
              className={`join-school-role-card ${requestType === RequestTypes.TEACHER ? "selected-teacher" : ""
                }`}
              onClick={() => setRequestType(RequestTypes.TEACHER)}
            >
              <img src="/assets/icons/teacher.png" alt="Teacher" />
            </div>

            <div
              className={`join-school-role-card ${requestType === RequestTypes.PRINCIPAL
                ? "selected-principal"
                : ""
                }`}
              onClick={() => setRequestType(RequestTypes.PRINCIPAL)}
            >
              <img src="/assets/icons/principal.png" alt="Principal" />
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
              onClick={() => handleSendRequest()}
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
