import React, { useEffect, useState } from "react";
import "./ReportTable.css";
import ExpandedUser from "./ExpandedUser";
import TableChoiceHeader from "./TableChoiceHeader";
import TableRightHeader from "./TableRightHeader";
import TableStudentData from "./TableStudentData";
import ExpandedTable from "./ExpandedTable";
import {
  PAGES,
  TABLEDROPDOWN,
  TABLES,
  TABLESORTBY,
  TableTypes,
  ALL_SUBJECT,
} from "../../../common/constants";
import { Util } from "../../../utility/util";
import { ServiceConfig } from "../../../services/ServiceConfig";
import Loading from "../../../components/Loading";
import { ClassUtil } from "../../../utility/classUtil";
import { addMonths, subDays, subMonths, addDays } from "date-fns";
import { t } from "i18next";
import CustomDropdown from "../CustomDropdown";
import { blue } from "@mui/material/colors";
import { useHistory } from "react-router";
import ImageDropdown from "../imageDropdown";
import CustomImageDropdown from "./CustomImageDropdown";

interface ReportTableProps {
  handleButtonClick;
  startDateProp;
  endDateProp;
  selectedTypeProp;
  isAssignmentsProp;
  sortTypeProp;
}

type AssignmentHeader = {
  headerName: string;
  startAt: string;
  endAt: string;
  belongsToClass?: boolean; 
  subjectName?: string; // Add subject name to the header data
  
};

const ReportTable: React.FC<ReportTableProps> = ({
  handleButtonClick,
  startDateProp,
  endDateProp,
  selectedTypeProp,
  isAssignmentsProp,
  sortTypeProp,
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedSubject, setSelectedSubject] =
    useState<TableTypes<"course">>();
  const [selectedChapter, setSelectedChapter] =
    useState<TableTypes<"chapter">>();
  const [selectedType, setSelectedType] = useState<TABLEDROPDOWN>(
    selectedTypeProp ?? TABLEDROPDOWN.WEEKLY
  );
  const [sortType, setSortType] = useState<TABLESORTBY>(
    sortTypeProp ?? TABLESORTBY.NAME
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignments, setIsAssignments] = useState<boolean>(
    isAssignmentsProp ?? true
  );
  const [subjects, setSubjects] = useState<TableTypes<"course">[]>();
  const [chapters, setChapters] = useState<TableTypes<"chapter">[]>();
  const history = useHistory();
  const [headerData, setHeaderData] = useState<Map<string, AssignmentHeader>[]>(
    []
  );
  
  const [reportData, setReportData] = useState<
    Map<string, { student: TableTypes<"user">; results: Record<string, any[]> }>
  >(new Map());
  console.log("reportData", reportData);
  
  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
      { icon: string; id: string; name: string; subjectDetail: string }[]
    >([]);
  
  const subjectOptionsWithAll = [
  { ...ALL_SUBJECT, disabled: selectedType === TABLEDROPDOWN.CHAPTER },
  ...mappedSubjectOptions.map((subject) => ({ ...subject, disabled: false })),
];

  const [mappedChaptersOptions, setMappedChaptersOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [dateRange, setDateRange] = useState({
    startDate:
      startDateProp ??
      (selectedType == TABLEDROPDOWN.MONTHLY
        ? subMonths(new Date(), 6)
        : subDays(new Date(), 6)),
    endDate: endDateProp ?? new Date(),
    isStudentProfilePage: false,
  });

  const api = ServiceConfig.getI().apiHandler;
  useEffect(() => {
    init();
  }, [
    dateRange,
    selectedType,
    selectedSubject,
    selectedChapter,
    sortType,
    isAssignments,
  ]);

  useEffect(() => {
    initData();
  }, []);
  useEffect(() => {
    initChapters();
  }, [selectedSubject]);

  useEffect(() => {
  if (selectedType === TABLEDROPDOWN.CHAPTER) {
      // Set first subject as selected if not already
      if (
        mappedSubjectOptions.length > 0 &&
        selectedSubject?.id === ALL_SUBJECT.id
      ) {
        handleSelectSubject(mappedSubjectOptions[0]);
      }
    }
  }, [selectedType]);


  const initChapters = async () => {
    const _chapters = await api.getChaptersForCourse(selectedSubject?.id ?? "");
    var _mappedChaptersOptions = _chapters?.map((option) => ({
      id: option.id,
      name: option.name ?? "",
    }));
    setMappedChaptersOptions(_mappedChaptersOptions);
    setChapters(_chapters);
    setSelectedChapter(_chapters[0]);
  };
  const initData = async () => {
      const current_class = Util.getCurrentClass();
      const _subjects = await api.getCoursesForClassStudent(
        current_class?.id ?? ""
      );
      
      setSubjects(_subjects);    
  
      const curriculumIds = Array.from(
        new Set(_subjects.map((s) => s.curriculum_id))
      );
      const gradeIds = Array.from(new Set(_subjects.map((s) => s.grade_id)));
      const filteredCurriculumIds = curriculumIds.filter(
        (id): id is string => id !== null
      );
      const filteredGradeIds = gradeIds.filter((id): id is string => id !== null);
  
      try {
        // Fetch curriculums and grades
        const [curriculums, grades] = await Promise.all([
          api.getCurriculumsByIds(filteredCurriculumIds),
          api.getGradesByIds(filteredGradeIds),
        ]);
  
        const curriculumMap = new Map(curriculums.map((c) => [c.id, c]));
        const gradeMap = new Map(grades.map((g) => [g.id, g]));
        const _mappedSubjectOptions = _subjects.map((subject) => {
          const curriculum = curriculumMap.get(subject.curriculum_id ?? "");
          const grade = gradeMap.get(subject.grade_id ?? "");
          return {
            id: subject.id,
            subjectDetail: `${subject.name} ${curriculum?.name ?? "Unknown"}-${grade?.name ?? "Unknown"}`,
            // icon: curriculum?.image,
            icon: subject?.image || "/assets/icons/DefaultIcon.png",
            name: subject.name,
          };
        });
  
        setMappedSubjectOptions(_mappedSubjectOptions);
      } catch (error) {
        console.error("Error fetching curriculums or grades:", error);
        setMappedSubjectOptions([]);
      }
      setSelectedSubject(
        Util.getCurrentCourse(current_class?.id) ?? _subjects[0]
      );
    };

    
  const init = async () => {
  const current_class = Util.getCurrentClass();
  const _classUtil = new ClassUtil();
  setExpandedRow(null);

  const isAllSubjects = selectedSubject?.id === ALL_SUBJECT.id;
  const allSubjects = subjects ?? [];

  type ReportResponse = {
  ReportData: Map<string, { student: TableTypes<"user">; results: Record<string, any[]> }>;
  HeaderData: Map<string, AssignmentHeader>[];
};

let reportResults: ReportResponse[] = [];
  let mergedReportData = new Map();
  let mergedHeaderData: Map<string, AssignmentHeader>[] = [];

  const mergeReports = (reports) => {
  reports.forEach((report) => {
    report?.ReportData?.forEach((value, key) => {
      if (!mergedReportData.has(key)) {
        // First subject for this student
        mergedReportData.set(key, {
          student: value.student,
          results: { ...value.results },
        });
      } else {
        const existing = mergedReportData.get(key);
        const mergedResults = { ...existing.results };

        // Deep merge each day's results
        for (const day in value.results) {
          if (!mergedResults[day]) {
            mergedResults[day] = [...value.results[day]];
          } else {
            mergedResults[day] = [...mergedResults[day], ...value.results[day]];
          }
        }

        mergedReportData.set(key, {
          student: value.student,
          results: mergedResults,
        });
      }
    });

    report?.HeaderData?.forEach((map, index) => {
      if (!mergedHeaderData[index]) mergedHeaderData[index] = new Map();
      map.forEach((v, k) => mergedHeaderData[index].set(k, v));
    });
  });
};


// Special handling for Assignment Report with All Subjects
if (selectedType === TABLEDROPDOWN.ASSIGNMENTS && isAllSubjects) {
  // Get all subject IDs
  const allSubjectIds = subjects?.map(subject => subject.id) || [];
  
  // Date adjustments
  const adjustedStartDate = subDays(new Date(dateRange.startDate), 1);
  const adjustedEndDate = addDays(new Date(dateRange.endDate), 1);
  const startTimeStamp = adjustedStartDate.toISOString().replace("T", " ").replace("Z", "+00");
  const endTimeStamp = adjustedEndDate.toISOString().replace("T", " ").replace("Z", "+00");

  // Single query for all assignments across subjects
  const _assignments = await api.getAssignmentOrLiveQuizByClassByDate(
    current_class?.id ?? "",
    allSubjectIds,
    endTimeStamp,
    startTimeStamp,
    false,
    false
  ) || [];

  // Get unique assignment IDs and lesson IDs
  const assignmentIds = _assignments.map(asgmt => asgmt.id);
  const lessonIds = [...new Set(_assignments.map(res => res.lesson_id))];

  // Parallel data fetching
  const [assignmentResults, lessonDetails, assignmentUserRecords, _students] = await Promise.all([
    api.getResultByAssignmentIds(assignmentIds),
    api.getLessonsBylessonIds(lessonIds),
    api.getAssignmentUserByAssignmentIds(assignmentIds),
    api.getStudentsForClass(current_class?.id ?? "")
  ]);

  // Initialize student results
  let resultsByStudent = new Map<
    string,
    { student: TableTypes<"user">; results: Record<string, any[]> }
  >();

  // Sort students by name if needed
  const students = sortType === TABLESORTBY.NAME 
    ? [..._students].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    : _students;

  // Initialize results structure
  students.forEach(student => {
    resultsByStudent.set(student.id, {
      student,
      results: Object.fromEntries(assignmentIds.map(id => [id, []]))
    });
  });

  // Process assignment results
  assignmentResults?.forEach(result => {
    const studentId = result.student_id;
    const assignmentId = result.assignment_id;
    if (studentId && assignmentId && resultsByStudent.has(studentId)) {
      resultsByStudent.get(studentId)!.results[assignmentId].push(result);
    }
  });

  // Create headers - single flat array of assignments
  const assignmentHeaders: Map<string, AssignmentHeader>[] = [];
  
  _assignments.forEach(assignment => {
    const lesson = lessonDetails?.find(l => l.id === assignment.lesson_id);
    const map = new Map<string, AssignmentHeader>();
    map.set(assignment.id, {
      headerName: lesson?.name || "Assignment",
      startAt: _classUtil.formatDate(assignment.starts_at),
      endAt: assignment.ends_at ? _classUtil.formatDate(assignment.ends_at) : "",
      belongsToClass: Boolean(assignment.is_class_wise)
    });
    assignmentHeaders.push(map);
  });

  // Handle sorting
  if (sortType === TABLESORTBY.LOWSCORE || sortType === TABLESORTBY.HIGHSCORE) {
    resultsByStudent = _classUtil.sortStudentsByTotalScoreAssignment(resultsByStudent);
    if (sortType === TABLESORTBY.HIGHSCORE) {
      resultsByStudent = new Map([...resultsByStudent.entries()].reverse());
    }
  }

  // Handle individual assignments
  resultsByStudent.forEach((studentData, studentId) => {
    assignmentIds.forEach(assignmentId => {
      const assignment = _assignments.find(a => a.id === assignmentId);
      if (assignment && !assignment.is_class_wise) {
        const isAssigned = assignmentUserRecords?.some(
          record => record.assignment_id === assignmentId && record.user_id === studentId
        );
        if (!isAssigned && studentData.results[assignmentId].length === 0) {
          studentData.results[assignmentId].push({ assignment_id: assignmentId, score: null });
        }
      }
    });
  });

  setReportData(resultsByStudent);
  setHeaderData(assignmentHeaders);
  setIsLoading(false);
  return;
}

  switch (selectedType) {
    case TABLEDROPDOWN.WEEKLY:
      if (isAllSubjects) {
        reportResults = await Promise.all(
          allSubjects.map((subject) =>
            _classUtil.getWeeklyReport(
              current_class?.id ?? "",
              subject.id,
              dateRange.startDate,
              dateRange.endDate,
              sortType,
              isAssignments
            )
          )
        );
        mergeReports(reportResults);
        setReportData(mergedReportData);
        setHeaderData(mergedHeaderData.slice(0, 7));
      } else {
        const report = await _classUtil.getWeeklyReport(
          current_class?.id ?? "",
          selectedSubject?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments
        );
        setReportData(report.ReportData);
        setHeaderData(report.HeaderData.slice(0, 7));
      }
      break;

    case TABLEDROPDOWN.MONTHLY:
      if (isAllSubjects) {
        reportResults = await Promise.all(
          allSubjects.map((subject) =>
            _classUtil.getMonthlyReport(
              current_class?.id ?? "",
              subject.id,
              dateRange.startDate,
              dateRange.endDate,
              sortType,
              isAssignments
            )
          )
        );
        mergeReports(reportResults);
        setReportData(mergedReportData);
        setHeaderData(mergedHeaderData);
      } else {
        const report = await _classUtil.getMonthlyReport(
          current_class?.id ?? "",
          selectedSubject?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments
        );
        setReportData(report.ReportData);
        setHeaderData(report.HeaderData);
      }
      break;

    case TABLEDROPDOWN.ASSIGNMENTS:
    case TABLEDROPDOWN.LIVEQUIZ:
      const isLiveQuiz = selectedType === TABLEDROPDOWN.LIVEQUIZ;
      if (isAllSubjects) {
        reportResults = await Promise.all(
          allSubjects.map((subject) =>
            _classUtil.getAssignmentOrLiveQuizReportForReport(
              current_class?.id ?? "",
              subject.id,
              dateRange.startDate,
              dateRange.endDate,
              isLiveQuiz,
              sortType
            )
          )
        );
        mergeReports(reportResults);
        setReportData(mergedReportData);
        setHeaderData(mergedHeaderData);
      } else {
        const report = await _classUtil.getAssignmentOrLiveQuizReportForReport(
          current_class?.id ?? "",
          selectedSubject?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          isLiveQuiz,
          sortType
        );
        setReportData(report.ReportData);
        setHeaderData(report.HeaderData);
      }
      break;

    case TABLEDROPDOWN.CHAPTER:
      const report = await _classUtil.getChapterWiseReport(
        current_class?.id ?? "",
        dateRange.startDate,
        dateRange.endDate,
        selectedSubject?.id ?? "",
        selectedChapter?.id ?? "",
        sortType,
        isAssignments
      );
      setReportData(report.ReportData);
      setHeaderData(report.HeaderData);
      break;
  }

  setIsLoading(false);
};


  const handleSelectSubject = async (subject) => {
    var current_class = Util.getCurrentClass();
    if (subject) {
      setSelectedSubject(subject);
      Util.setCurrentCourse(current_class?.id, subject);
    }
  };
  const handleSelectChapter = async (chapter) => {
    if (chapter) setSelectedChapter(chapter);
  };
  const handleViewClickDetails = (student: TableTypes<"user">) => {
    history.replace(PAGES.STUDENT_REPORT, {
      student: student,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      selectedType: selectedType,
      isAssignments: isAssignments,
      sortType: sortType,
    });
  };


  const handleTypeSelect = async (type) => {
    if (type) {
      if (type.name === TABLEDROPDOWN.CHAPTER) {
        const _chapters = await api.getChaptersForCourse(
          selectedSubject?.id ?? ""
        );
        setChapters(_chapters);
        setSelectedChapter(_chapters[0]);
      }
      setSelectedType(type.name);
    }
  };


  const handleNameSort = async (type) => {
    if (type) {
      setSortType(type.name);
    }
  };
  const handleIsAssignmets = (_isAssignments) => {
    setIsAssignments(_isAssignments);
  };
  const handleDateSelect = (dateRange) => {
    setDateRange(dateRange);
  };
  const handleRowClick = (key) => {
    if (expandedRow === key) {
      setExpandedRow(null);
    } else {
      setExpandedRow(key);
    }
  };
  function getAssignmentMapObject() {
    const assignmentMapObject: Record<string, { belongsToClass: boolean }> = {};

    headerData.forEach((mapItem) => {
      mapItem.forEach((value, assignmentId) => {
        assignmentMapObject[assignmentId] = {
          belongsToClass: value.belongsToClass ?? true, // no error now
        };
      });
    });

    return assignmentMapObject;
  }
  const assignmentMapObject = getAssignmentMapObject();
  return !isLoading ? (
    reportData.size == 0 ? (
      <div className="no-students-container ">
        <div>{t("No students in class")}</div>
      </div>
    ) : (
      <div className="table-container ">
        <div className="reports-dropdown">
  <div className="type-dropdown">
    <CustomDropdown
      options={Object.entries(TABLEDROPDOWN).map(([key, value]) => ({
        id: key,
        name: value,
        disabled: selectedSubject?.id === ALL_SUBJECT.id && value === TABLEDROPDOWN.CHAPTER,
      }))}
      onOptionSelect={handleTypeSelect}
      placeholder={t(selectedType) ?? ""}
      selectedValue={{
        id: selectedType,
        name: selectedType,
      }}
    />
  </div>

  {selectedType === TABLEDROPDOWN.CHAPTER ? (
    <div style={{width: '45%'}} className="chapter-type-row"> {/* ✅ Only for CHAPTER */}
      <CustomImageDropdown
        options={subjectOptionsWithAll}
        selectedValue={{
          id: selectedSubject?.id ?? "",
          name: selectedSubject?.name ?? "",
          icon:
            (selectedSubject as any)?.icon ??
            subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.icon ??
            "",
          subjectDetail:
            (selectedSubject as any)?.subject ??
            subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.subjectDetail ??
            "",
        }}
        onOptionSelect={handleSelectSubject}
        placeholder={t("Select Language") as string}
      />

      <CustomDropdown
        options={mappedChaptersOptions ?? []}
        onOptionSelect={handleSelectChapter}
        selectedValue={{
          id: selectedChapter?.id ?? "",
          name: selectedChapter?.name ?? "",
        }}
      />
    </div>
  ) : (
    <CustomImageDropdown
      options={subjectOptionsWithAll}
      selectedValue={{
        id: selectedSubject?.id ?? "",
        name: selectedSubject?.name ?? "",
        icon:
          (selectedSubject as any)?.icon ??
          subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.icon ??
          "",
        subjectDetail:
          (selectedSubject as any)?.subject ??
          subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.subjectDetail ??
          "",
      }}
      onOptionSelect={handleSelectSubject}
      placeholder={t("Select Language") as string}
    />
  )}
</div>
        <div className="table-container-body">
          <div
            className="table"
            style={{
              maxHeight:
                selectedType === TABLEDROPDOWN.CHAPTER ? "65vh" : "70vh",
            }}
          >
            <table className="Reports-Table-capture-report-table">
              <thead>
                <tr>
                  <th>
                    <TableChoiceHeader
                      onDateChange={handleDateSelect}
                      isAssignmentsOnlyProp={isAssignments}
                      onIsAssignments={handleIsAssignmets}
                      isMonthly={selectedType == TABLEDROPDOWN.MONTHLY}
                      handleNameSort={handleNameSort}
                      sortBy={sortType}
                      dateRangeValue={dateRange}
                      isAssignmentReport={selectedType == TABLEDROPDOWN.ASSIGNMENTS}
                    />
                  </th>

                  <TableRightHeader 
                    headerDetails={headerData}
                  dateRangeValue={dateRange} />
                </tr>
              </thead>
              <tbody>
                {Array.from(reportData).map(([key, value], index) => (
                  <React.Fragment key={key}>
                    <tr>
                      <td
                        style={{
                          borderRight:
                            expandedRow === key ? "0" : "",
                          borderBottom: expandedRow === key ? "0" : "2px solid #EFF2F4"
                        }}
                        onClick={() => {
                          if (
                            selectedType != TABLEDROPDOWN.ASSIGNMENTS &&
                            selectedType != TABLEDROPDOWN.CHAPTER
                          ) {
                            handleRowClick(key);
                          }
                        }}
                      >
                        {expandedRow === key ? (
                          <ExpandedUser
                            name={value.student.name ?? ""}
                            onClickViewDetails={() => {
                              handleViewClickDetails(value.student);
                            }}
                          />
                        ) : (
                          <div>{value.student.name}</div>
                        )}
                      </td>
                      {expandedRow !== key && (
                        <TableStudentData
                          studentData={value.results}
                          isScore={
                            selectedType === TABLEDROPDOWN.CHAPTER ||
                            selectedType === TABLEDROPDOWN.ASSIGNMENTS ||
                            selectedType === TABLEDROPDOWN.LIVEQUIZ
                          }
                          assignmentMap={assignmentMapObject}
                          selectedType={selectedType}
                          headerDetails={selectedType === TABLEDROPDOWN.ASSIGNMENTS && selectedSubject?.id === ALL_SUBJECT.id ? 
                            headerData : 
                            undefined
                          }
/>
                      )}
                    </tr>

                    {expandedRow === key && (
                      <ExpandedTable expandedData={value.results} />
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {headerData.length == 0 ? (
              <div className="no-report-found">
                <div>
                  {t("Sorry, Couldn't find any matches for the Date Range ")}'
                  {dateRange.startDate.getDate()}/
                  {dateRange.startDate.getMonth() + 1} -{" "}
                  {dateRange.endDate.getDate()}/
                  {dateRange.endDate.getMonth() + 1}
                  '<br />
                  <div>
                    {t(
                      "If you would like to assign assignments, please go to the"
                    )}{" "}
                  </div>
                  <div onClick={handleButtonClick} className="library-button">
                    {t("Library")}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    )
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default ReportTable;
