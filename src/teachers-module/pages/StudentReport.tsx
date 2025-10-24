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
  const student = history.location.state!["student"] as TableTypes<"user">;
  const tempClass = history.location.state!["classDoc"] as TableTypes<"class">;
  const isStudentProfilePage = history.location.state![
    "isStudentProfilePage"
  ] as boolean;

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const [subjects, setSubjects] = useState<TableTypes<"course">[]>();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();

  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
    { icon: string; id: string; name: string; subjectDetail: string }[]
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

  const toDate = (dateStr: string | null): Date => {
    const d = new Date(dateStr || "");
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const todayDate = new Date();

  useEffect(() => {
    fetchClassDetails();
    init();
  }, []);
  useEffect(() => {
    initData();
  }, [selectedSubject, startDate, endDate]);

  const fetchClassDetails = async () => {
    try {
      let classToUse = tempClass ?? Util.getCurrentClass();
      if (classToUse) {
        setCurrentClass(classToUse);
      }
    } catch (error) {
      console.log("Failed to load class details.");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const initData = async () => {
    var _classUtil = new ClassUtil();
    const classToUse = tempClass ?? Util.getCurrentClass();
    var result = await _classUtil.getStudentProgressForStudentTable(
      student.id,
      [selectedSubject?.id ?? ""],
      startDate ?? "",
      endDate ?? "",
      classToUse?.id
    );

    setStudentResult(result ?? []);
  };

  const init = async () => {
    const classToUse = tempClass ?? Util.getCurrentClass();
    const _subjects = await api.getCoursesForClassStudent(classToUse?.id ?? "");
    setSubjects(_subjects);

    const curriculumIds = Array.from(
      new Set(_subjects.map((s) => s.curriculum_id))
    ).filter((id): id is string => id !== null);

    const gradeIds = Array.from(
      new Set(_subjects.map((s) => s.grade_id))
    ).filter((id): id is string => id !== null);

    try {
      const [curriculums, grades] = await Promise.all([
        api.getCurriculumsByIds(curriculumIds),
        api.getGradesByIds(gradeIds),
      ]);

      const curriculumMap = new Map(curriculums.map((c) => [c.id, c]));
      const gradeMap = new Map(grades.map((g) => [g.id, g]));

      const _mappedSubjectOptions = _subjects.map((subject) => {
        const curriculum = curriculumMap.get(subject.curriculum_id ?? "");
        const grade = gradeMap.get(subject.grade_id ?? "");
        return {
          id: subject.id,
          name: subject.name,
          icon: subject?.image || "/assets/icons/DefaultIcon.png",
          subjectDetail: `${subject.name} ${curriculum?.name ?? "Unknown"}-${grade?.name ?? "Unknown"}`,
        };
      });

      setMappedSubjectOptions(_mappedSubjectOptions);
    } catch (error) {
      console.error("Error fetching curriculums or grades:", error);
      setMappedSubjectOptions([]);
    }

    const current_course = Util.getCurrentCourse(classToUse?.id);
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
            className={currentClass?.name}
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
              <img
                src="/assets/icons/calender.svg"
                alt="Calendar_Icon"
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
              <img
                src="/assets/icons/calender.svg"
                alt="Calendar_Icon"
                className="student-report-calendar-icon"
              />
            </div>
          </div>
        </div>
        <StudentReportTable report={studentResult} />
      </div>
      {showStartDatePicker && (
        <CalendarPicker
          value={startDate}
          onConfirm={(date) => handleDateConfirm("start", date)}
          onCancel={() => setShowStartDatePicker(false)}
          mode="start"
          maxDate={new Date().toISOString().split("T")[0]}
        />
      )}
      {showEndDatePicker && (
        <CalendarPicker
          value={endDate}
          onConfirm={(date) => handleDateConfirm("end", date)}
          onCancel={() => setShowEndDatePicker(false)}
          mode="end"
          startDate={startDate}
          minDate={format(toDate(startDate), "yyyy-MM-dd")}
          maxDate={
            isAfter(addMonths(toDate(startDate), 6), todayDate)
              ? format(todayDate, "yyyy-MM-dd")
              : format(addMonths(toDate(startDate), 6), "yyyy-MM-dd")
          }
        />
      )}
    </IonPage>
  );
};

export default StudentReport;
