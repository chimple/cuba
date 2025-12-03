import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import {
  Button as MuiButton,
  Typography,
  Box,
  useMediaQuery,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, MoreHoriz } from "@mui/icons-material";
import { t } from "i18next";
import SearchAndFilter from "../SearchAndFilter";
import FilterSlider from "../FilterSlider";
import SelectedFilters from "../SelectedFilters";
import "./SchoolStudents.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import {
  AGE_OPTIONS,
  GENDER,
  PerformanceLevel,
  StudentInfo,
  BANDS,
} from "../../../common/constants";
import {
  getGradeOptions,
  filterBySearchAndFilters,
  sortSchoolTeachers,
  paginateSchoolTeachers,
} from "../../OpsUtility/SearchFilterUtility";
import FormCard, { FieldConfig, MessageConfig } from "./FormCard";
import { normalizePhone10 } from "../../pages/NewUserPageOps";
import { ClassRow } from "./SchoolClass";
import { ClassUtil } from "../../../utility/classUtil";

type ApiStudentData = StudentInfo;

interface DisplayStudent {
  id: string;
  studentIdDisplay: string;
  name: string;
  schstudents_interact?: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  class: string;
  schstudents_performance?: string;
  schstudents_actions?: string;
}

const getPerformanceChipClass = (schstudents_performance: string): string => {
  const normalizedPerf = schstudents_performance.toLowerCase().replace(/ /g, "_");
  switch (normalizedPerf) {
    case PerformanceLevel.DOING_GOOD:
      return "performance-chip-doing-good";
    case PerformanceLevel.NEED_HELP:
      return "performance-chip-need-help";
    case PerformanceLevel.STILL_LEARNING:
      return "performance-chip-still-learning";
    case PerformanceLevel.NOT_TRACKED:
    default:
      return "performance-chip-not-tracked";
  }
};

interface SchoolStudentsProps {
  data: {
    students?: ApiStudentData[];
    totalStudentCount?: number;
    classData?: ClassRow[];
  };
  isMobile: boolean;
  schoolId: string;
  isTotal?: boolean;
  isFilter?: boolean;
  customTitle?: string;
  optionalGrade?: number | string;
  optionalSection?: string;
}

const ROWS_PER_PAGE = 20;

const sameSection = (a?: string, b?: string) =>
  String(a ?? "")
    .trim()
    .toUpperCase() ===
  String(b ?? "")
    .trim()
    .toUpperCase();

const SchoolStudents: React.FC<SchoolStudentsProps> = ({
  data,
  schoolId,
  isMobile,
  isTotal,
  isFilter,
  customTitle,
  optionalGrade,
  optionalSection,
}) => {
  const history = useHistory();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [students, setStudents] = useState<ApiStudentData[]>(
    data.students || []
  );
  const [totalCount, setTotalCount] = useState<number>(
    data.totalStudentCount || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [isFilterSliderOpen, setIsFilterSliderOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceLevel>(
    PerformanceLevel.ALL
  );
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchStudents = useCallback(
    async (currentPage: number, search: string) => {
      setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      try {
        let response;
        if (search && search.trim() !== "") {
          response = await api.searchStudentsInSchool(
            schoolId,
            search,
            currentPage,
            ROWS_PER_PAGE
          );
          setStudents(response.data);
          setTotalCount(response.total);
        } else {
          response = await api.getStudentInfoBySchoolId(
            schoolId,
            currentPage,
            ROWS_PER_PAGE
          );
          setStudents(response.data);
          setTotalCount(response.total);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId]
  );

  const issTotal = isTotal ?? true;
  const issFilter = isFilter ?? true;
  const custoomTitle = customTitle ?? "Students";

  useEffect(() => {
    // Don't fetch on the initial render for page 1, because we already have the data from props.
    if (
      page === 1 &&
      !debouncedSearchTerm &&
      filters.grade.length === 0 &&
      filters.section.length === 0
    ) {
      setStudents(data.students || []);
      setTotalCount(data.totalStudentCount || 0);
      return;
    }
    fetchStudents(page, debouncedSearchTerm);
  }, [
    page,
    debouncedSearchTerm,
    fetchStudents,
    data.students,
    data.totalStudentCount,
    filters.grade.length,
    filters.section.length,
  ]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterSliderOpen(false);
    setPage(1);
  };

  const handleDeleteAppliedFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
    setPage(1);
  };

  const baseStudents = useMemo(() => {
    const gradeOn =
      optionalGrade !== undefined &&
      optionalGrade !== null &&
      String(optionalGrade).trim() !== "";
    const sectionOn =
      optionalSection !== undefined && String(optionalSection).trim() !== "";
    if (!gradeOn && !sectionOn) return students;

    const filtered = students.filter((row: any) => {
      const gradeOk = !gradeOn || String(row.grade) === String(optionalGrade);
      const sectionOk =
        !sectionOn || sameSection(row.classSection, optionalSection);
      return gradeOk && sectionOk;
    });

    return filtered.length > 0 ? filtered : students;
  }, [students, optionalGrade, optionalSection]);

  const normalizedStudents = useMemo(
    () =>
      baseStudents.map((s: any) => {
        const user = s.user ?? s;

        return {
          ...s,
          user: {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email ?? undefined,
            student_id: user.student_id ?? undefined,
            phone: user.phone ?? undefined,
            gender: user.gender ?? "N/A",
          },
          className: s.classSection ?? "N/A",
          parent: s.parent ?? {
            id: s.parent_id ?? undefined,
            name: s.parent_name ?? "",
            phone: s.phone ?? undefined,
          },
        };
      }),
    [baseStudents]
  );

  const filteredStudents = useMemo(
    () =>
      filterBySearchAndFilters(
        normalizedStudents,
        {
          grade: filters.grade ?? [],
          section: (filters.section ?? []).map((s) => String(s).trim()),
        },
        searchTerm,
        "student"
      ),
    [normalizedStudents, filters, searchTerm]
  );

  const sortedStudents = useMemo(() => {
    // Standard sorting for all columns
    return [...filteredStudents].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case "studentIdDisplay":
          aValue = a.user.student_id || "";
          bValue = b.user.student_id || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "name":
          aValue = a.user.name || "";
          bValue = b.user.name || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "gender":
          aValue = a.user.gender || "";
          bValue = b.user.gender || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "grade":
          aValue = a.grade || 0;
          bValue = b.grade || 0;
          return order === "asc" ? aValue - bValue : bValue - aValue;
        case "classSection":
          aValue = a.classSection || "";
          bValue = b.classSection || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "phoneNumber":
          aValue = a.parent?.phone || "";
          bValue = b.parent?.phone || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }
    });
  }, [filteredStudents, orderBy, order]);

  const [studentPerformanceMap, setStudentPerformanceMap] = useState<
    Map<string, string>
  >(new Map());
  useEffect(() => {
    const fetchStudentPerformance = async () => {
      if (optionalGrade == null || optionalSection == null || issTotal) {
        return;
      }
      setIsPerformanceLoading(true);
      const performanceMap = new Map<string, string>();
      const currentClass = Array.isArray(data.classData)
        ? data.classData[0]
        : undefined;
      const classId = currentClass?.id ?? "";
      try {
        const courseIds =
          currentClass?.courses?.map((course) => course.id) ?? [];
        if (courseIds.length === 0) {
          sortedStudents.forEach((student) => {
            performanceMap.set(student.user.id, "Not Tracked");
          });
          setStudentPerformanceMap(performanceMap);
          return;
        }

        const _classUtil = new ClassUtil();
        const groups = await _classUtil.divideStudents(classId, courseIds);

        const processGroup = (band: string, status: string) => {
          const group = groups.get(band);
          if (group && Array.isArray(group)) {
            group.forEach((item: any) => {
              const student = item.get("student");
              if (student && student.id) {
                performanceMap.set(student.id, status);
              }
            });
          }
        };

        processGroup(BANDS.GREENGROUP, "Doing Good");
        processGroup(BANDS.YELLOWGROUP, "Still Learning");
        processGroup(BANDS.REDGROUP, "Need Help");
        processGroup(BANDS.GREYGROUP, "Not Tracked");

        setStudentPerformanceMap(performanceMap);
      } catch (error) {
        console.error("Error fetching student performance data:", error);
        sortedStudents.forEach((student) => {
          performanceMap.set(student.user.id, "Not Tracked");
        });
        setStudentPerformanceMap(performanceMap);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    fetchStudentPerformance();
  }, [sortedStudents, optionalGrade, optionalSection, issTotal, baseStudents]);

  const studentsForCurrentPage = useMemo((): DisplayStudent[] => {
    let filtered = sortedStudents.map(
      (s_api): DisplayStudent => ({
        id: s_api.user.id,
        studentIdDisplay: s_api.user.student_id ?? "N/A",
        name: s_api.user.name ?? "N/A",
        gender: s_api.user.gender ?? "N/A",
        grade: s_api.grade ?? 0,
        classSection: s_api.classSection ?? "N/A",
        phoneNumber: s_api.parent?.phone ?? "N/A",
        class: (s_api.grade ?? 0) + (s_api.classSection ?? ""),
        schstudents_performance: studentPerformanceMap.get(s_api.user.id) ?? "Not Tracked",
      })
    );
    // Filter by performance if not "all"
    if (performanceFilter !== PerformanceLevel.ALL) {
      filtered = filtered.filter((student) => {
        const perf = student.schstudents_performance?.toLowerCase().replace(" ", "_");
        return perf === performanceFilter;
      });
    }
    return filtered;
  }, [sortedStudents, performanceFilter, studentPerformanceMap]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / ROWS_PER_PAGE);
  }, [totalCount, filters, searchTerm, filteredStudents.length]);

  const isDataPresent = studentsForCurrentPage.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== "" ||
    Object.values(filters).some((f) => f.length > 0);

  const handleFilterIconClick = useCallback(() => {
    setTempFilters(filters);
    setIsFilterSliderOpen(true);
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({ grade: [], section: [] });
    setTempFilters({ grade: [], section: [] });
    setPage(1);
  }, []);

  const handleSliderFilterChange = useCallback((name: string, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  }, []);
  const handleCancelFilters = useCallback(() => {
    setIsFilterSliderOpen(false);
  }, []);

  const columns: Column<DisplayStudent>[] = useMemo(() => {
    const commonColumns: Column<DisplayStudent>[] = [
      {
        key: "studentIdDisplay",
        label: t("Student ID"),
        sortable: !issTotal ? false : undefined,
      },
      {
        key: "name",
        label: t("Student Name"),
        align: "left",
        render: (s) => (
          <Typography variant="body2" className="student-name-data">
            {s.name}
          </Typography>
        ),
      },
    ];
    if (!issTotal) {
      return [
        ...commonColumns,
        {
          key: "schstudents_interact",
          label: t("Interact"),
          sortable: false,
          render: (s) => (
            <Box
              sx={{
                display: "flex",
                justifyContent: "left",
                alignItems: "left",
              }}
            >
              <IconButton
                size="small"
                onClick={() => console.log("Engage with student:", s.id)}
              >
                <img
                  src="/assets/icons/Interact.svg"
                  alt="Interact"
                  style={{ width: 30, height: 30 }}
                />
              </IconButton>
            </Box>
          ),
        },
        {
          key: "gender",
          label: t("Gender"),
          sortable: false,
          render: (s) => (
            <Typography variant="body2" className="student-name-data">
              {s.gender
                ? s.gender.charAt(0).toUpperCase() +
                  s.gender.slice(1).toLowerCase()
                : ""}
            </Typography>
          ),
        },
        {
          key: "schstudents_performance",
          label: t("Performance"),
          sortable: false,
          render: (s) => (
            <Chip
              label={t(s.schstudents_performance || "Not Tracked")}
              size="small"
              className={getPerformanceChipClass(
                s.schstudents_performance || "Not Tracked"
              )}
              sx={{
                fontWeight: 500,
                fontSize: "0.75rem",
                height: 24,
                borderRadius: "4px",
              }}
            />
          ),
        },
        {
          key: "schstudents_actions",
          label: "",
          sortable: false,
          render: (s) => (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton
                size="small"
                onClick={() => console.log("More actions for student:", s.id)}
                sx={{
                  color: "#6B7280",
                  "&:hover": { bgcolor: "#F3F4F6" },
                }}
              >
                <MoreHoriz sx={{ fontSize: 20, fontWeight: 800 }} />
              </IconButton>
            </Box>
          ),
        },
      ];
    } else {
      return [
        ...commonColumns,
        {
          key: "gender",
          label: t("Gender"),
          render: (s) => (
            <Typography variant="body2" className="student-name-data">
              {s.gender
                ? s.gender.charAt(0).toUpperCase() +
                  s.gender.slice(1).toLowerCase()
                : ""}
            </Typography>
          ),
        },
        { key: "phoneNumber", label: t("Phone Number") },
        { key: "class", label: t("Class") },
      ];
    }
  }, [issTotal]);

  const classOptions = useMemo(() => {
    const classes = data.classData || (data as any).classdata || [];
    if (!classes || classes.length === 0) return [];
    return classes
      .map((c: any) => ({ value: c.id, label: c.name }))
      .filter((opt: any) => opt.value && opt.label)
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }, [data.classData, (data as any).classdata]);

  const currentClass = useMemo(() => {
    if (
      !issTotal &&
      optionalGrade !== undefined &&
      optionalSection !== undefined
    ) {
      const matchingStudent = baseStudents.find((student: any) => {
        const classInfo = student.classWithidname;
        return (
          student.grade === optionalGrade &&
          sameSection(student.classSection, optionalSection) &&
          classInfo?.id &&
          classInfo?.name
        );
      });
      return matchingStudent?.classWithidname || null;
    }
    return null;
  }, [issTotal, optionalGrade, optionalSection, baseStudents]);

  const addStudentFields: FieldConfig[] = useMemo(() => {
    const fields: FieldConfig[] = [
      {
        name: "studentName",
        label: "Student Name",
        kind: "text" as const,
        required: true,
        placeholder: "Enter Student Name",
        column: 2 as const,
      },
      {
        name: "gender",
        label: "Gender",
        kind: "select" as const,
        required: true,
        column: 0 as const,
        options: [
          { label: t("GIRL"), value: GENDER.GIRL },
          { label: t("BOY"), value: GENDER.BOY },
          {
            label: t("UNSPECIFIED"),
            value: GENDER.OTHER,
          },
        ],
      },
      {
        name: "ageGroup",
        label: "Age",
        kind: "select" as const,
        required: true,
        placeholder: "Select Age Group",
        column: 1 as const,
        options: [
          {
            value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
            label: `≤${t("4 years")}`,
          },
          { value: AGE_OPTIONS.FIVE, label: t("5 years") },
          { value: AGE_OPTIONS.SIX, label: t("6 years") },
          { value: AGE_OPTIONS.SEVEN, label: t("7 years") },
          { value: AGE_OPTIONS.EIGHT, label: t("8 years") },
          { value: AGE_OPTIONS.NINE, label: t("9 years") },
          {
            value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
            label: `≥${t("10 years")}`,
          },
        ],
      },
      {
        name: "phone",
        label: "Phone Number",
        kind: "phone" as const,
        required: true,
        placeholder: "Enter phone number",
        column: 2 as const,
      },
    ];

    if (issTotal) {
      fields.splice(3, 0, {
        name: "class",
        label: "Class",
        kind: "select" as const,
        required: true,
        column: 0 as const,
        options: classOptions,
      });
    }

    return fields;
  }, [baseStudents, issTotal, classOptions]);

  const handleAddNewStudent = useCallback(() => {
    setIsAddStudentModalOpen(true);
    setErrorMessage(undefined);
  }, [history]);

  const handleCloseAddStudentModal = useCallback(() => {
    setIsAddStudentModalOpen(false);
    setErrorMessage(undefined);
    setIsSubmitting(false);
  }, []);

  const handleSubmitAddStudentModal = useCallback(
    async (formValues: Record<string, string>) => {
      setIsSubmitting(true);
      setErrorMessage(undefined);

      const normalizedPhone = normalizePhone10(
        (formValues.phone ?? "").toString()
      );

      if (normalizedPhone.length !== 10) {
        setErrorMessage({
          text: "Phone number must be 10 digits.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      const classId = issTotal ? formValues.class : currentClass?.id;

      if (!classId) {
        setErrorMessage({
          text: "Please select a class.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const api = ServiceConfig.getI().apiHandler;
        const result = await api.addStudentWithParentValidation({
          phone: normalizedPhone,
          name: formValues.studentName || "",
          gender: formValues.gender || "",
          age: formValues.ageGroup || "",
          classId: classId,
          schoolId: schoolId,
        });

        if (result.success) {
          setIsAddStudentModalOpen(false);
          setErrorMessage(undefined);
          setPage(1);
          fetchStudents(1, debouncedSearchTerm);
        } else {
          setErrorMessage({
            text: result.message,
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error adding student:", error);
        setErrorMessage({
          text: "An unexpected error occurred. Please try again.",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [schoolId, fetchStudents, debouncedSearchTerm, issTotal, currentClass]
  );

  const filterConfigsForSchool = [{ key: "grade", label: "Grade" }];

  const performanceFilters = [
    { key: PerformanceLevel.ALL, label: t("All") },
    { key: PerformanceLevel.NEED_HELP, label: t("Need Help") },
    { key: PerformanceLevel.DOING_GOOD, label: t("Doing Good") },
    { key: PerformanceLevel.STILL_LEARNING, label: t("Still Learning") },
    { key: PerformanceLevel.NOT_TRACKED, label: t("Not Tracked") },
  ];

  return (
    <div className="schoolStudents-pageContainer">
      <FormCard
        open={isAddStudentModalOpen}
        title={
          !issTotal && currentClass
            ? `${t("Add New Student")} - ${currentClass.name}`
            : t("Add New Student")
        }
        submitLabel={isSubmitting ? t("Adding...") : t("Add Student")}
        fields={addStudentFields}
        onClose={handleCloseAddStudentModal}
        onSubmit={handleSubmitAddStudentModal}
        message={errorMessage}
      />
      <Box className="schoolStudents-headerActionsRow">
        <Box className="schoolStudents-titleArea">
          <Typography variant="h5" className="schoolStudents-titleHeading">
            {t(custoomTitle)}
          </Typography>
          {issTotal && (
            <Typography variant="body2" className="schoolStudents-totalText">
              {t("Total")}: {totalCount} {t("students")}
            </Typography>
          )}
        </Box>
        <Box className="schoolStudents-actionsGroup">
          <MuiButton
            variant="outlined"
            onClick={handleAddNewStudent}
            className="schoolStudents-newStudentButton-outlined"
          >
            <AddIcon className="schoolStudents-newStudentButton-outlined-icon" />
            {!isSmallScreen && t("New Student")}
          </MuiButton>
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={handleFilterIconClick}
            onClearFilters={handleClearFilters}
            isFilter={issFilter}
          />
        </Box>
      </Box>

      {!issTotal && (
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          {performanceFilters.map((filter) => {
            const isActive = performanceFilter === filter.key;

            let className = "performance-filter-pill";
            if (isActive) {
              switch (filter.key) {
                case PerformanceLevel.ALL:
                  className = "performance-filter-pill-active-all";
                  break;
                case PerformanceLevel.DOING_GOOD:
                  className = "performance-filter-pill-active-doing-good";
                  break;
                case PerformanceLevel.NEED_HELP:
                  className = "performance-filter-pill-active-need-help";
                  break;
                case PerformanceLevel.STILL_LEARNING:
                  className = "performance-filter-pill-active-still-learning";
                  break;
                case PerformanceLevel.NOT_TRACKED:
                  className = "performance-filter-pill-active-not-tracked";
                  break;
              }
            }

            return (
              <Chip
                key={filter.key}
                label={filter.label}
                onClick={() => setPerformanceFilter(filter.key)}
                className={className}
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  height: "26px",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </Box>
      )}

      {Object.values(filters).some((arr) => arr.length > 0) && (
        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteAppliedFilter}
        />
      )}
      <FilterSlider
        isOpen={isFilterSliderOpen}
        onClose={() => setIsFilterSliderOpen(false)}
        filters={tempFilters}
        filterOptions={{
          grade: getGradeOptions(baseStudents),
        }}
        onFilterChange={handleSliderFilterChange}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        filterConfigs={filterConfigsForSchool}
      />

      {isLoading || isPerformanceLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      ) : isDataPresent ? (
        <>
          <div className="schoolStudents-table-container">
            <DataTableBody
              columns={columns}
              rows={studentsForCurrentPage}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
            />
          </div>
          {pageCount > 1 && (
            <div className="schoolStudents-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="schoolStudents-emptyStateContainer">
          <Typography variant="h6" className="schoolStudents-emptyStateTitle">
            {t(custoomTitle)}
          </Typography>
          <Typography className="schoolStudents-emptyStateMessage">
            {performanceFilter !== PerformanceLevel.ALL
              ? t("No student data found for the selected filter")
              : isFilteringOrSearching
              ? t("No students found matching your criteria.")
              : t("No students data found for the selected school")}
          </Typography>
          {!isFilteringOrSearching &&
            performanceFilter === PerformanceLevel.ALL && (
              <MuiButton
                variant="text"
                onClick={handleAddNewStudent}
                className="schoolStudents-emptyStateAddButton"
                startIcon={
                  <AddIcon className="schoolStudents-emptyStateAddButton-icon" />
                }
              >
                {t("Add Student")}
              </MuiButton>
            )}
        </Box>
      )}
    </div>
  );
};

export default SchoolStudents;
