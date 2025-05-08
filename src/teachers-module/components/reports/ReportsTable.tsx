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
} from "../../../common/constants";
import { Util } from "../../../utility/util";
import { ServiceConfig } from "../../../services/ServiceConfig";
import Loading from "../../../components/Loading";
import { ClassUtil } from "../../../utility/classUtil";
import { addMonths, subDays, subMonths } from "date-fns";
import { t } from "i18next";
import CustomDropdown from "../CustomDropdown";
import { blue } from "@mui/material/colors";
import { useHistory } from "react-router";

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
    sortTypeProp ?? TABLESORTBY.HIGHSCORE
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
  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
    { id: string; name: string }[]
  >([]);
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
    var current_class = Util.getCurrentClass();
    const _subjects = await api.getCoursesForClassStudent(
      current_class?.id ?? ""
    );
    setSubjects(_subjects);    
    var current_course = Util.getCurrentCourse(current_class?.id);
    setSelectedSubject(current_course ?? _subjects[0]);
    const _chapters = await api.getChaptersForCourse(_subjects[0]?.id);
    setChapters(_chapters);
    setSelectedChapter(_chapters[0]);
    var _mappedSubjectOptions = _subjects?.map((option) => ({
      id: option.id,
      name: option.name,
    }));
    var _mappedChaptersOptions = _chapters?.map((option) => ({
      id: option.id,
      name: option.name ?? "",
    }));
    setMappedChaptersOptions(_mappedChaptersOptions);
    setMappedSubjectOptions(_mappedSubjectOptions);
    setIsLoading(false);
  };
  const init = async () => {
    // setIsLoading(true);
    var current_class = Util.getCurrentClass();
    var _classUtil = new ClassUtil();
    setExpandedRow(null);
    switch (selectedType) {
      case TABLEDROPDOWN.WEEKLY:
        var _weeklyData = await _classUtil.getWeeklyReport(
          current_class?.id ?? "",
          selectedSubject?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments
        );
        setReportData(_weeklyData.ReportData);
        setHeaderData(_weeklyData.HeaderData.slice(0, 7));
        break;
      case TABLEDROPDOWN.MONTHLY:
        var _monthlyData = await _classUtil.getMonthlyReport(
          current_class?.id ?? "",
          selectedSubject?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments
        );

        setReportData(_monthlyData.ReportData);
        setHeaderData(_monthlyData.HeaderData);

        break;
      case TABLEDROPDOWN.ASSIGNMENTS:
        var _assignmentData =
          await _classUtil.getAssignmentOrLiveQuizReportForReport(
            current_class?.id ?? "",
            selectedSubject?.id ?? "",
            dateRange.startDate,
            dateRange.endDate,
            false,
            sortType
          );
        setReportData(_assignmentData.ReportData);
        setHeaderData(_assignmentData.HeaderData);
        break;
      case TABLEDROPDOWN.CHAPTER:
        var _reportData = await _classUtil.getChapterWiseReport(
          current_class?.id ?? "",
          dateRange.startDate,
          dateRange.endDate,
          selectedSubject?.id ?? "",
          selectedChapter?.id ?? "",
          sortType,
          isAssignments
        );
        setReportData(_reportData.ReportData);
        setHeaderData(_reportData.HeaderData);
        break;
      case TABLEDROPDOWN.LIVEQUIZ:
        var _liveQuizData =
          await _classUtil.getAssignmentOrLiveQuizReportForReport(
            current_class?.id ?? "",
            selectedSubject?.id ?? "",
            dateRange.startDate,
            dateRange.endDate,
            true,
            sortType
          );
        setReportData(_liveQuizData.ReportData);
        setHeaderData(_liveQuizData.HeaderData);
        break;
      default:
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
      if (type.name == TABLEDROPDOWN.CHAPTER) {
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
              }))}
              onOptionSelect={handleTypeSelect}
              placeholder={t(selectedType)??""}
              selectedValue={{
                id: selectedType,
                name: selectedType,
              }}
            />
          </div>
          <div>
            <CustomDropdown
              options={mappedSubjectOptions ?? []}
              onOptionSelect={handleSelectSubject}
              selectedValue={{
                id: selectedSubject?.id ?? "",
                name: selectedSubject?.name ?? "",
              }}
              disableTranslation={true}
            />

            {selectedType == TABLEDROPDOWN.CHAPTER ? (
              <CustomDropdown
                options={mappedChaptersOptions ?? []}
                onOptionSelect={handleSelectChapter}
                selectedValue={{
                  id: selectedChapter?.id ?? "",
                  name: selectedChapter?.name ?? "",
                }}
              />
            ) : null}
          </div>
        </div>
        <div className="table-container-body">
          <div
            className="table"
            style={{
              maxHeight:
                selectedType === TABLEDROPDOWN.CHAPTER ? "65vh" : "70vh",
            }}
          >
            <table>
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

                  <TableRightHeader headerDetails={headerData} />
                </tr>
              </thead>
              <tbody>
                {Array.from(reportData).map(([key, value], index) => (
                  <React.Fragment key={key}>
                    <tr>
                      <td
                        style={{
                          borderRight:
                            expandedRow === key ? "0" : "1px solid grey",
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
