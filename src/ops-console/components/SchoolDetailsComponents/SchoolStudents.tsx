import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Button as MuiButton, Typography, Box, Button } from "@mui/material";
import { Add, Add as AddIcon } from "@mui/icons-material";
import { t } from "i18next";

import SearchAndFilter from "../SearchAndFilter";
import FilterSlider from "../FilterSlider";
import SelectedFilters from "../SelectedFilters";

import "./SchoolStudents.css";

interface RawStudentData {
  studentId: string;
  name: string | null;
  gender: string | null;
  className: string | null;
  phoneNumber: string | null;
  id: string;
}
interface ProcessedStudent extends Omit<RawStudentData, "className"> {
  grade: number | string | null;
  classSection: string | null;
  studentIdDisplay: string;
  originalClassName: string | null;
}
interface SchoolStudentsProps {
  data: { students: RawStudentData[] };
  isMobile: boolean;
}
const KNOWN_NON_NUMERIC_GRADES = [
  "UKG",
  "LKG",
  "NURSERY",
  "PLAYGROUP",
  "PRE KG",
  "PRE-KG",
];
const parseClassName = (
  classNameInput: string | null
): { grade: number | string | null; classSection: string | null } => {
  /* ...your existing parseClassName logic... */
  if (!classNameInput || classNameInput.trim() === "") {
    return { grade: null, classSection: null };
  }
  const className = classNameInput.trim();
  const upperClassName = className.toUpperCase();
  if (/^\d+$/.test(className)) {
    return { grade: parseInt(className, 10), classSection: null };
  }
  for (const nonNumericGrade of KNOWN_NON_NUMERIC_GRADES) {
    if (upperClassName.startsWith(nonNumericGrade)) {
      const potentialSection = className
        .substring(nonNumericGrade.length)
        .trim()
        .toUpperCase();
      if (potentialSection && /^[A-Z]+$/.test(potentialSection)) {
        return { grade: nonNumericGrade, classSection: potentialSection };
      }
      return { grade: nonNumericGrade, classSection: potentialSection || null };
    }
  }
  const numericThenAlphaMatch = className.match(/^(\d+)\s*([a-zA-Z]+)$/);
  if (numericThenAlphaMatch) {
    const gradePart = numericThenAlphaMatch[1];
    const sectionPart = numericThenAlphaMatch[2];
    return {
      grade: parseInt(gradePart, 10),
      classSection: sectionPart.toUpperCase(),
    };
  }
  if (/^[a-zA-Z\s]+$/.test(className) && !/\d/.test(className)) {
    return { grade: null, classSection: className.toUpperCase() };
  }
  const startsWithNumberFallback = className.match(/^(\d+)\s*(.*)$/);
  if (startsWithNumberFallback) {
    const grade = parseInt(startsWithNumberFallback[1], 10);
    const section = startsWithNumberFallback[2].trim().toUpperCase() || null;
    return { grade, classSection: section };
  }
  return { grade: className.toUpperCase(), classSection: null };
};
const studentFilterSliderOptions: Record<string, string[]> = {
  grade: [
    ...KNOWN_NON_NUMERIC_GRADES,
    ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  ],
  section: ["A", "B", "C", "D", "E", "F"],
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
    console.log("Navigate to Add New Student page");
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
    const studentsFromProps = data?.students || [];
    let processedAndFiltered = studentsFromProps.map((student) => {
      const { grade, classSection } = parseClassName(student.className);
      return {
        studentId: student.studentId,
        name: student.name || "N/A",
        gender: student.gender || "N/A",
        phoneNumber: student.phoneNumber || "N/A",
        id: student.id || student.studentId,
        originalClassName: student.className,
        grade,
        classSection,
        studentIdDisplay: student.studentId || "N/A",
      };
    });
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      processedAndFiltered = processedAndFiltered.filter(
        (s) =>
          s.name?.toLowerCase().includes(lowerSearch) ||
          s.studentId?.toLowerCase().includes(lowerSearch) ||
          s.phoneNumber?.includes(lowerSearch) ||
          s.originalClassName?.toLowerCase().includes(lowerSearch)
      );
    }
    const activeGradeFilters = filters.grade || [];
    const activeSectionFilters = filters.section || [];
    if (activeGradeFilters.length > 0) {
      processedAndFiltered = processedAndFiltered.filter((s) => {
        if (s.grade === null) return false;
        const studentGradeString =
          typeof s.grade === "number"
            ? `Grade ${s.grade}`
            : String(s.grade).toUpperCase();
        return activeGradeFilters.includes(studentGradeString);
      });
    }
    if (activeSectionFilters.length > 0) {
      processedAndFiltered = processedAndFiltered.filter(
        (s) =>
          s.classSection !== null &&
          activeSectionFilters.includes(s.classSection.toUpperCase())
      );
    }
    return processedAndFiltered;
  }, [data?.students, searchTerm, filters]);

  useEffect(() => {
    const newPageCount = Math.ceil(allFilteredStudents.length / ROWS_PER_PAGE);
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    }
  }, [allFilteredStudents, page]);

  const studentsForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allFilteredStudents.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allFilteredStudents, page]);

  const columns: Column<ProcessedStudent>[] = [
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
          {student.grade !== null ? student.grade : t("N/A")}
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
              <AddIcon className="schoolStudents-newStudentButton-outlined-icon" />{" "}
              {/* Class for icon */}
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

      {(isDataPresent || isFilteringOrSearching) && (
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
          {allFilteredStudents.length > 0 && (
            <div className="school-list-pagination">
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
        </Box>
      )}
    </div>
  );
};

export default SchoolStudents;
