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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { t } from "i18next";
import SearchAndFilter from "../SearchAndFilter";
import FilterSlider from "../FilterSlider";
import SelectedFilters from "../SelectedFilters";
import "./SchoolStudents.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { StudentInfo } from "../../../common/constants";
import {
  getGradeOptions,
  filterBySearchAndFilters,
  sortSchoolTeachers,
  paginateSchoolTeachers,
} from "../../OpsUtility/SearchFilterUtility";

type ApiStudentData = StudentInfo;

interface DisplayStudent {
  id: string;
  studentIdDisplay: string;
  name: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  class: string;
}

interface SchoolStudentsProps {
  data: {
    students?: ApiStudentData[];
    totalStudentCount?: number;
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

  const studentsForCurrentPage = useMemo((): DisplayStudent[] => {
    return sortedStudents.map(
      (s_api): DisplayStudent => ({
        id: s_api.user.id,
        studentIdDisplay: s_api.user.student_id ?? "N/A",
        name: s_api.user.name ?? "N/A",
        gender: s_api.user.gender ?? "N/A",
        grade: s_api.grade ?? 0,
        classSection: s_api.classSection ?? "N/A",
        phoneNumber: s_api.parent?.phone ?? "N/A",
        class: (s_api.grade ?? 0) + (s_api.classSection ?? ""),
      })
    );
  }, [sortedStudents]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / ROWS_PER_PAGE);
  }, [totalCount, filters, searchTerm, filteredStudents.length]);

  const isDataPresent = studentsForCurrentPage.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== "" ||
    Object.values(filters).some((f) => f.length > 0);

  const handleAddNewStudent = useCallback(() => {}, [history]);
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

  const columns: Column<DisplayStudent>[] = [
    { key: "studentIdDisplay", label: t("Student ID") },
    {
      key: "name",
      label: t("Student Name"),
      renderCell: (s) => (
        <Typography variant="body2" className="student-name-data">
          {s.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    {
      key: "class",
      label: t("Class Name"),
      renderCell: (s) => (
        <Typography variant="body2" className="student-name-data">
          {s.class}
        </Typography>
      ),
    },
    { key: "phoneNumber", label: t("Phone Number") },
  ];

  const filterConfigsForSchool = [{ key: "grade", label: "Grade" }];
  return (
    <div className="schoolStudents-pageContainer">
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

      {isLoading ? (
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
            {isFilteringOrSearching
              ? t("No students found matching your criteria.")
              : t("No students data found for the selected school")}
          </Typography>
          {!isFilteringOrSearching && (
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
