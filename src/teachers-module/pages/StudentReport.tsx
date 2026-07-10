import React, { useEffect, useState } from "react";
import "./StudentReport.css";
import { IonIcon, IonPage } from "@ionic/react";
import Header from "../components/homePage/Header";
import { useHistory } from "react-router";
import { Util } from "../../utility/util";
import StudentReportHeader from "../components/studentReport/StudentReportHeader";
import { t } from "i18next";
import { calendarOutline } from "ionicons/icons";
import { addMonths, format, isAfter } from "date-fns";
import StudentReportTable from "../components/studentReport/StudentReportTable";
import CalendarPicker from "../../common/CalendarPicker";
import { PAGES, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { ClassUtil } from "../../utility/classUtil";

const StudentReport: React.FC = () => {
  const history = useHistory();
  const currentSchool = Util.getCurrentSchool();
  const currentClass = Util.getCurrentClass();
  const student = history.location.state!["student"] as TableTypes<"user">;
  const tempClass = history.location.state!["classDoc"] as TableTypes<"class">;
  const isStudentProfilePage = history.location.state![
    "isStudentProfilePage"
  ] as boolean;

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const [subjects, setSubjects] = useState<TableTypes<"course">[]>();
  const current_class = Util.getCurrentClass();

  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedSubject, setSelectedSubject] =
    useState<TableTypes<"course">>();
  const [studentResult, setStudentResult] = useState<
    {
      lessonName: string;
      score: number;
      date: string;
      isAssignment: boolean;
    }[]
  >([]);
  const [startDate, setStartDate] = useState<string | null>(
    format(history.location.state!["startDate"], "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string | null>(
    format(history.location.state!["endDate"], "yyyy-MM-dd")
  );
  let maxEndDate: string;
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    initData();
  }, [selectedSubject, startDate, endDate]);

  const today = new Date().toISOString().split("T")[0];
  const initData = async () => {
    var _classUtil = new ClassUtil();
    var result = await _classUtil.getStudentProgressForStudentTable(
      student.id,
      selectedSubject?.id ?? "",
      startDate ?? "",
      endDate ?? ""
    );

    setStudentResult(result ?? []);
  };

  const init = async () => {
    const _subjects = await api.getCoursesForClassStudent(
      current_class?.id ?? ""
    );
    var _mappedSubjectOptions = _subjects?.map((option) => ({
      id: option.id,
      name: option.name,
    }));
    setMappedSubjectOptions(_mappedSubjectOptions);
    setSubjects(_subjects);
    var current_course = Util.getCurrentCourse(current_class?.id);
    setSelectedSubject(current_course ?? _subjects[0]);
  };
  const handleDateConfirm = (type: "start" | "end", date: string) => {
    if (type === "start") {
      setStartDate(date);
      var _endDate = addMonths(new Date(date), 1);
      setEndDate(format(_endDate, "yyyy-MM-dd"));
      setShowStartDatePicker(false);
    } else {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };
  const handleSelectSubject = async (subject) => {
    if (subject) {
      setSelectedSubject(subject);
    }
  };
  const handleBackButton = () => {
    if (isStudentProfilePage) {
      history.replace(PAGES.STUDENT_PROFILE, {
        studentId: student.id,
        classDoc: tempClass,
      });
    } else {
      history.replace(PAGES.HOME_PAGE, {
        tabValue: 3,
        startDate: history.location.state!["startDate"],
        endDate: history.location.state!["endDate"],
        selectedType: history.location.state!["selectedType"],
        isAssignments: history.location.state!["isAssignments"],
        sortType: history.location.state!["sortType"],
      });
    }
  };
  return (
    <IonPage className="student-report-page">
      <div className="student-report-student-profile">
        <div className="fixed-header">
          <Header
            isBackButton={true}
            showSchool={true}
            showClass={true}
            className={tempClass?.name}
            schoolName={currentSchool?.name}
            onBackButtonClick={handleBackButton}
          />
        </div>
        <StudentReportHeader
          student={student}
          selectedSubject={selectedSubject}
          mappedSubjectOptions={mappedSubjectOptions}
          currentClass={currentClass}
          onSubjectChange={handleSelectSubject}
        />
        <div className="student-report-horizontal-line"></div>
        <div className="student-report-date-selection">
          <div>{t("Select by date Range")}</div>
          <div className="student-report-date-icons">
            <div
              className="student-report-date-picker"
              onClick={() => setShowStartDatePicker(true)}
            >
              <div>
                <div>{t("From")}</div>
                <div>
                  {startDate ? format(new Date(startDate), "dd/MM/yyyy") : ""}
                </div>
              </div>
              <IonIcon
                icon={calendarOutline}
                className="student-report-calendar-icon"
              />
            </div>
            <div className="student-report-vertical-line"></div>
            <div
              className="student-report-date-picker"
              onClick={() => setShowEndDatePicker(true)}
            >
              <div>
                <div>{t("To")}</div>
                <div>
                  {endDate ? format(new Date(endDate), "dd/MM/yyyy") : ""}
                </div>
              </div>
              <IonIcon
                icon={calendarOutline}
                className="student-report-calendar-icon"
              />
            </div>
          </div>
        </div>
        <StudentReportTable report={studentResult} />
      </div>
      {showStartDatePicker && (
        <CalendarPicker
          value={format(startDate ?? "", "yyyy-MM-dd")}
          onConfirm={(date) => handleDateConfirm("start", date)}
          onCancel={() => setShowStartDatePicker(false)}
          mode="start"
          maxDate={new Date().toISOString().split("T")[0]}
        />
      )}
      {showEndDatePicker && (
        <CalendarPicker
          value={format(endDate ?? "", "yyyy-MM-dd")}
          onConfirm={(date) => handleDateConfirm("end", date)}
          onCancel={() => setShowEndDatePicker(false)}
          mode="end"
          startDate={startDate}
          minDate={
            format(startDate ?? "", "yyyy-MM-dd")
              ? format(startDate ?? "", "yyyy-MM-dd")
              : new Date().toISOString().split("T")[0]
          }
          maxDate={
            isAfter(format(addMonths(startDate ?? "", 6), "yyyy-MM-dd"), today)
              ? today
              : format(addMonths(startDate ?? "", 6), "yyyy-MM-dd")
          }
        />
      )}
    </IonPage>
  );
};

export default StudentReport;
