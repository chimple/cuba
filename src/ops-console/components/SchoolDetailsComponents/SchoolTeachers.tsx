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

interface UserType {
  id: string;
  name: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

interface ApiTeacherData {
  user: UserType;
  grade: number;
  classSection: string;
}

export interface Teachers {
  id: string;
  name: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  email: string | null;
  emailDisplay: string;
}

interface SchoolTeachersProps {
  data: {
    teachers: ApiTeacherData[];
  };
  isMobile: boolean;
}

const teacherFilterSliderOptions: Record<string, string[]> = {
  grade: [...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)],
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
    const teachersFromProps: ApiTeacherData[] = data?.teachers || [];
    let filtered: ApiTeacherData[] = [...teachersFromProps];

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.user.name?.toLowerCase().includes(lowerSearch) ||
          t.user.email?.toLowerCase().includes(lowerSearch) ||
          t.user.phone?.toLowerCase().includes(lowerSearch)
      );
    }

    const activeGradeFilters =
      filters.grade?.map((g) => parseInt(g.replace("Grade ", ""))) || [];
    const activeSectionFilters = filters.section || [];

    if (activeGradeFilters.length > 0) {
      filtered = filtered.filter((t) => activeGradeFilters.includes(t.grade));
    }
    if (activeSectionFilters.length > 0) {
      filtered = filtered.filter((t) =>
        activeSectionFilters.includes(t.classSection)
      );
    }

    return filtered.map(
      (apiTeacher): Teachers => ({
        id: apiTeacher.user.id,
        name: apiTeacher.user.name || "N/A",
        gender: apiTeacher.user.gender || "N/A",
        grade: apiTeacher.grade, // This is a number
        classSection: apiTeacher.classSection, // This is a string
        phoneNumber: apiTeacher.user.phone || "N/A",
        email: apiTeacher.user.email, // Original email, can be null
        emailDisplay: apiTeacher.user.email || "N/A",
      })
    );
  }, [data?.teachers, searchTerm, filters]);

  useEffect(() => {
    const newPageCount = Math.ceil(allFilteredTeachers.length / ROWS_PER_PAGE);
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page === 0 && newPageCount > 0) {
      setPage(1);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    }
  }, [allFilteredTeachers.length, page]);

  const teachersForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allFilteredTeachers.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allFilteredTeachers, page]);

  const columns: Column<Teachers>[] = [
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
          {pageCount > 1 && (
            <div className="schoolTeachers-school-list-pagination">
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
          {!isFilteringOrSearching && (
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
          )}
        </Box>
      )}
    </div>
  );
};

export default SchoolTeachers;
