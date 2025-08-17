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
} from "@mui/material"; // Import CircularProgress
import { Add as AddIcon } from "@mui/icons-material";
import { t } from "i18next";
import SearchAndFilter from "../SearchAndFilter";
import FilterSlider from "../FilterSlider";
import SelectedFilters from "../SelectedFilters";
import "./SchoolStudents.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { StudentInfo } from "../../../common/constants";

type ApiStudentData = StudentInfo;

interface DisplayStudent {
  id: string;
  studentIdDisplay: string;
  name: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
}

interface SchoolStudentsProps {
  data: {
    students?: ApiStudentData[];
    totalStudentCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
}

// Dynamically generate grade options from student data
const getGradeOptions = (students: ApiStudentData[]) => {
  const gradesSet = new Set<string>();
  students.forEach((s) => {
    if (s.grade) {
      gradesSet.add(`Grade ${s.grade}`);
    }
  });
  return Array.from(gradesSet).sort((a, b) => {
    // Sort numerically by grade
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    return numA - numB;
  });
};

const ROWS_PER_PAGE = 20;

const SchoolStudents: React.FC<SchoolStudentsProps> = ({
  data,
  schoolId,
  isMobile,
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

  const fetchStudents = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getStudentInfoBySchoolId(
          schoolId,
          currentPage,
          ROWS_PER_PAGE
        );
        setStudents(response.data);
        setTotalCount(response.total);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId]
  );

  useEffect(() => {
    // Don't fetch on the initial render for page 1, because we already have the data from props.
    if (
      page === 1 &&
      !searchTerm &&
      filters.grade.length === 0 &&
      filters.section.length === 0
    ) {
      setStudents(data.students || []);
      setTotalCount(data.totalStudentCount || 0);
      return;
    }
    fetchStudents(page);
  }, [page, fetchStudents, data.students, data.totalStudentCount]);

  //Handlers now just update state. The useEffect will trigger the fetch. ---
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
    setPage(1); // Reset to page 1 on sort
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

  const filteredStudents = useMemo(() => {
    if (!searchTerm && filters.grade.length === 0 && filters.section.length === 0) {
      return students;
    }
    let filtered = students;
    if (filters.grade.length > 0) {
      filtered = filtered.filter((s) => filters.grade.includes(`Grade ${s.grade}`));
    }
    if (filters.section.length > 0) {
      filtered = filtered.filter((s) => filters.section.includes(s.classSection));
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.user.name && s.user.name.toLowerCase().includes(term)) ||
          (s.user.student_id && s.user.student_id.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [students, filters, searchTerm]);

  // Sorting
  const sortedStudents = useMemo(() => {
    const arr = [...filteredStudents];
    if (orderBy) {
      arr.sort((a, b) => {
        let aValue, bValue;
        if (orderBy === "grade") {
          aValue = a.grade;
          bValue = b.grade;
        } else if (orderBy === "name") {
          aValue = a.user.name || "";
          bValue = b.user.name || "";
        } else {
          aValue = a[orderBy] || "";
          bValue = b[orderBy] || "";
        }
        if (aValue < bValue) return order === "asc" ? -1 : 1;
        if (aValue > bValue) return order === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [filteredStudents, orderBy, order]);

  // Pagination for filtered and sorted students
  const paginatedStudents = useMemo(() => {
    const startIdx = (page - 1) * ROWS_PER_PAGE;
    return sortedStudents.slice(startIdx, startIdx + ROWS_PER_PAGE);
  }, [sortedStudents, page]);

  const studentsForCurrentPage = useMemo((): DisplayStudent[] => {
    return paginatedStudents.map(
      (s_api): DisplayStudent => ({
        id: s_api.user.id,
        studentIdDisplay: s_api.user.student_id || "N/A",
        name: s_api.user.name || "N/A",
        gender: s_api.user.gender || "N/A",
        grade: s_api.grade,
        classSection: s_api.classSection || "N/A",
        phoneNumber: s_api.user.phone || "N/A",
      })
    );
  }, [paginatedStudents]);

  const pageCount = useMemo(() => {
    return Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
  }, [filteredStudents]);

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
      key: "grade",
      label: t("Grade"),
      renderCell: (s) => (
        <Typography variant="body2">
          {s.grade > 0 ? String(s.grade) : t("N/A")}
        </Typography>
      ),
    },
    {
      key: "classSection",
      label: t("Class Section"),
      renderCell: (s) => (
        <Typography variant="body2">{s.classSection || t("N/A")}</Typography>
      ),
    },
    { key: "phoneNumber", label: t("Phone Number") },
  ];

  const filterConfigsForSchool = [{ key: "grade", label: "Grade" }];
  console.log("SchoolStudents totalCount", totalCount);
  return (
    <div className="schoolStudents-pageContainer">
      <Box className="schoolStudents-headerActionsRow">
        <Box className="schoolStudents-titleArea">
          <Typography variant="h5" className="schoolStudents-titleHeading">
            {t("Students")}
          </Typography>
          <Typography variant="body2" className="schoolStudents-totalText">
            {t("Total")}: {totalCount} {t("students")}
          </Typography>
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
          grade: getGradeOptions(students)
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
            {t("Students")}
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
