import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Button as MuiButton, Typography, Box } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { t } from "i18next";
import SearchAndFilter from "../SearchAndFilter";
import FilterSlider from "../FilterSlider";
import SelectedFilters from "../SelectedFilters";

import "./SchoolStudents.css";

interface UserType {
  id: string;
  student_id?: string | null; 
  name: string | null;
  gender: string | null;
  phone: string | null;
}
interface ApiStudentData {
  user: UserType;
  grade: number; 
  classSection: string; 
}

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
    students: ApiStudentData[]; 
  };
  isMobile: boolean;
}
const studentFilterSliderOptions: Record<string, string[]> = {
  grade: [
    ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`), 
  ],
};

const ROWS_PER_PAGE = 6;

const SchoolStudents: React.FC<SchoolStudentsProps> = ({ data, isMobile }) => {
  const history = useHistory();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [isFilterSliderOpen, setIsFilterSliderOpen] = useState(false);
  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const handleAddNewStudent = useCallback(() => {
    // history.push("/add-student"); 
  }, [history]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setPage(1);
    },
    []
  );

  const handleFilterIconClick = useCallback(() => {
    setTempFilters(filters);
    setIsFilterSliderOpen(true);
  }, [filters]);

  const handleSliderFilterChange = useCallback((name: string, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setIsFilterSliderOpen(false);
    setPage(1);
  }, [tempFilters]);

  const handleCancelFilters = useCallback(() => {
    const clearedFilters = { grade: [], section: [] };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setIsFilterSliderOpen(false);
    setPage(1);
  }, []);

  const handleDeleteAppliedFilter = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const updated = {
          ...prev,
          [key]: prev[key].filter((v) => v !== value),
        };
        setTempFilters(updated);
        return updated;
      });
      setPage(1);
    },
    []
  );

  const handleSort = useCallback(
    (key: string) => {
      const isAsc = orderBy === key && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(key);
    },
    [order, orderBy]
  );

  const allFilteredStudents = useMemo(() => {
    const studentsFromApi: ApiStudentData[] = data?.students || [];
    let filteredApiStudents = [...studentsFromApi];
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filteredApiStudents = filteredApiStudents.filter(
        (s_api) =>
          s_api.user.name?.toLowerCase().includes(lowerSearch) ||
          s_api.user.student_id?.toLowerCase().includes(lowerSearch) ||
          s_api.user.phone?.includes(lowerSearch) ||
          s_api.classSection?.toLowerCase().includes(lowerSearch) || 
          String(s_api.grade).includes(lowerSearch) 
      );
    }
    const activeGradeFilters = filters.grade || [];
    const activeSectionFilters = filters.section || [];
    if (activeGradeFilters.length > 0) {
      filteredApiStudents = filteredApiStudents.filter((s_api) => {
        return activeGradeFilters.some((filterGradeString) => {
          let numericValueToMatch: number | undefined;
            const gradeMatch = filterGradeString.match(/^Grade (\d+)$/);
            if (gradeMatch) {
              numericValueToMatch = parseInt(gradeMatch[1], 10);
            }
          return (
            numericValueToMatch !== undefined &&
            s_api.grade === numericValueToMatch
          );
        });
      });
    }

    if (activeSectionFilters.length > 0) {
      filteredApiStudents = filteredApiStudents.filter(
        (s_api) =>
          s_api.classSection &&
          activeSectionFilters.includes(s_api.classSection.toUpperCase())
      );
    }

    return filteredApiStudents.map(
      (s_api): DisplayStudent => ({
        id: s_api.user.id || "N/A",
        studentIdDisplay: s_api.user.student_id || "N/A",
        name: s_api.user.name || "N/A",
        gender: s_api.user.gender || "N/A",
        grade: s_api.grade,
        classSection: s_api.classSection || "N/A",
        phoneNumber: s_api.user.phone || "N/A",
      })
    );
  }, [data?.students, searchTerm, filters]);

  useEffect(() => {
    const newPageCount = Math.ceil(allFilteredStudents.length / ROWS_PER_PAGE);
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    } else if (page === 0 && newPageCount > 0) {
      setPage(1);
    }
  }, [allFilteredStudents.length, page]);

  const studentsForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allFilteredStudents.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allFilteredStudents, page]);

  const getGradeDisplayValue = (gradeNumeric: number): string => {
    if (gradeNumeric > 0) return String(gradeNumeric); 
    return t("N/A");
  };

  const columns: Column<DisplayStudent>[] = [
    { key: "studentIdDisplay", label: t("Student ID") },
    {
      key: "name",
      label: t("Student Name"),
      renderCell: (student) => (
        <Typography variant="body2" className="student-name-data">
          {student.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    {
      key: "grade",
      label: t("Grade"),
      renderCell: (student) => (
        <Typography variant="body2">
          {getGradeDisplayValue(student.grade)}
        </Typography>
      ),
    },
    {
      key: "classSection",
      label: t("Class Section"),
      renderCell: (student) => (
        <Typography variant="body2">
          {student.classSection || t("N/A")}
        </Typography>
      ),
    },
    { key: "phoneNumber", label: t("Phone Number") },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage !== page) setPage(newPage);
  };

  const isDataPresent = allFilteredStudents.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== "" ||
    Object.values(filters).some((f) => f.length > 0);

  return (
    <div className="schoolStudents-pageContainer">
      {isDataPresent || isFilteringOrSearching ? (
        <Box className="schoolStudents-headerActionsRow">
          <Box className="schoolStudents-titleArea">
            <Typography variant="h5" className="schoolStudents-titleHeading">
              {t("Students")}
            </Typography>
            <Typography variant="body2" className="schoolStudents-totalText">
              {t("Total")}: {allFilteredStudents.length} {t("students")}
            </Typography>
          </Box>
          <Box className="schoolStudents-actionsGroup">
            <MuiButton
              variant="outlined"
              onClick={handleAddNewStudent}
              className="schoolStudents-newStudentButton-outlined"
            >
              <AddIcon className="schoolStudents-newStudentButton-outlined-icon" />
              {t("New Student")}
            </MuiButton>
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              filters={filters}
              onFilterClick={handleFilterIconClick}
            />
          </Box>
        </Box>
      ) : (
        <div />
      )}

      {(isDataPresent || isFilteringOrSearching) &&
        Object.values(filters).some((arr) => arr.length > 0) && (
          <SelectedFilters
            filters={filters}
            onDeleteFilter={handleDeleteAppliedFilter}
          />
        )}

      <FilterSlider
        isOpen={isFilterSliderOpen}
        onClose={() => setIsFilterSliderOpen(false)}
        filters={tempFilters}
        filterOptions={studentFilterSliderOptions}
        onFilterChange={handleSliderFilterChange}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
      />

      {isDataPresent ? (
        <div className="schoolStudents-dataTableContainer">
          <DataTableBody
            columns={columns}
            rows={studentsForCurrentPage}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
          />
          {pageCount > 1 && (
            <div className="schoolStudents-school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
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
