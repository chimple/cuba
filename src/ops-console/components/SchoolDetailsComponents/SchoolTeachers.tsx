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
import "./SchoolTeachers.css";

export interface Teacher {
  id: string;
  name: string | null;
  gender: string | null;
  grade: number | null;
  classSection: string | null;
  phoneNumber: string | null;
  email: string | null;
}

interface SchoolTeachersProps {
  data: {
    teachers: Teacher[];
  };
  isMobile: boolean;
}

const teacherFilterSliderOptions: Record<string, string[]> = {
  grade: ["Grade 1", "Grade 2", "Grade 3"],
  section: ["Section A", "Section B"],
};

const ROWS_PER_PAGE = 7;

const SchoolTeachers: React.FC<SchoolTeachersProps> = ({ data, isMobile }) => {
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

  const handleAddNewTeacher = useCallback(() => {
    history.push("/add-teacher");
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
    const cleared = { grade: [], section: [] };
    setTempFilters(cleared);
    setFilters(cleared);
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

  const allFilteredTeachers = useMemo(() => {
    const teachersFromProps = data?.teachers || [];
    let filtered = [...teachersFromProps];
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(lowerSearch) ||
          t.email?.toLowerCase().includes(lowerSearch) ||
          t.phoneNumber?.toLowerCase().includes(lowerSearch)
      );
    }
    const activeGradeFilters =
      filters.grade?.map((g) => parseInt(g.replace("Grade ", ""))) || [];
    const activeSectionFilters = filters.section || [];
    if (activeGradeFilters.length > 0) {
      filtered = filtered.filter(
        (t) => t.grade !== null && activeGradeFilters.includes(t.grade)
      );
    }
    if (activeSectionFilters.length > 0) {
      filtered = filtered.filter((t) =>
        activeSectionFilters.includes(t.classSection ?? "")
      );
    }
    return filtered.map((teacher) => ({
      ...teacher,
      id: teacher.id,
      name: teacher.name || "N/A",
      gender: teacher.gender || "N/A",
      grade: teacher.grade !== null ? teacher.grade : "N/A",
      classSection: teacher.classSection || "N/A",
      phoneNumber: teacher.phoneNumber || "N/A",
      emailDisplay: teacher.email || "N/A",
    }));
  }, [data?.teachers, searchTerm, filters]);

  useEffect(() => {
    const newPageCount = Math.ceil(allFilteredTeachers.length / ROWS_PER_PAGE);
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    }
  }, [allFilteredTeachers, page]);

  const teachersForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allFilteredTeachers.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allFilteredTeachers, page]);

  const columns: Column<Teacher & { emailDisplay: string }>[] = [
    {
      key: "name",
      label: t("Teacher Name"),
      renderCell: (teacher) => (
        <Typography variant="body2" className="teacher-name-data">
          {teacher.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    { key: "grade", label: t("Grade") },
    { key: "classSection", label: t("Class Section") },
    { key: "phoneNumber", label: t("Phone Number") },
    {
      key: "email",
      label: t("Email"),
      renderCell: (teacher) => (
        <Typography variant="body2" className="truncate-text">
          {teacher.emailDisplay}
        </Typography>
      ),
    },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage !== page) setPage(newPage);
  };

  const isDataPresent = allFilteredTeachers.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== "" ||
    Object.values(filters).some((f) => f.length > 0);

  return (
    <div className="schoolTeachers-pageContainer">
      {isDataPresent || isFilteringOrSearching ? (
        <Box className="schoolTeachers-headerActionsRow">
          <Box className="schoolTeachers-titleArea">
            <Typography variant="h5" className="schoolTeachers-titleHeading">
              {t("Teachers")}
            </Typography>
            <Typography variant="body2" className="schoolTeachers-totalText">
              {t("Total")}: {allFilteredTeachers.length} {t("teachers")}
            </Typography>
          </Box>
          <Box className="schoolTeachers-actionsGroup">
            <MuiButton
              variant="outlined"
              onClick={handleAddNewTeacher}
              className="schoolTeachers-newTeacherButton-outlined"
            >
              <AddIcon className="schoolTeachers-newTeacherButton-outlined-icon" />
              {t("New Teacher")}
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
        filterOptions={teacherFilterSliderOptions}
        onFilterChange={handleSliderFilterChange}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
      />

      {isDataPresent ? (
        <div className="schoolTeachers-dataTableContainer">
          <DataTableBody
            columns={columns}
            rows={teachersForCurrentPage}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
          />
          {allFilteredTeachers.length > 0 && (
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
        <Box className="schoolTeachers-emptyStateContainer">
          <Typography variant="h6" className="schoolTeachers-emptyStateTitle">
            {t("Teachers")}
          </Typography>
          <Typography className="schoolTeachers-emptyStateMessage">
            {isFilteringOrSearching
              ? t("No teachers found matching your criteria.")
              : t("No teachers data found for the selected school")}
          </Typography>
          <MuiButton
            variant="text"
            onClick={handleAddNewTeacher}
            className="schoolTeachers-emptyStateAddButton"
            startIcon={
              <AddIcon className="schoolTeachers-emptyStateAddButton-icon" />
            }
          >
            {t("Add Teacher")}
          </MuiButton>
        </Box>
      )}
    </div>
  );
};

export default SchoolTeachers;
