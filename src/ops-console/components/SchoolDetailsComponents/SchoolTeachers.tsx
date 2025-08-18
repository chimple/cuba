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
import "./SchoolTeachers.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { TeacherInfo } from "../../../common/constants";
import { getGradeOptions, filterBySearchAndFilters, sortItems, paginateItems } from "../../OpsUtility/SearchFilterUtility";

interface DisplayTeacher {
  id: string;
  name: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  emailDisplay: string;
}

interface SchoolTeachersProps {
  data: {
    teachers?: TeacherInfo[];
    totalTeacherCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
}

const ROWS_PER_PAGE = 20;

const SchoolTeachers: React.FC<SchoolTeachersProps> = ({
  data,
  schoolId,
  isMobile,
}) => {
  const history = useHistory();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [teachers, setTeachers] = useState<TeacherInfo[]>(data.teachers || []);
  const [totalCount, setTotalCount] = useState<number>(
    data.totalTeacherCount || 0
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

  const fetchTeachers = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getTeacherInfoBySchoolId(
          schoolId,
          currentPage,
          ROWS_PER_PAGE
        );
        setTeachers(response.data);
        setTotalCount(response.total);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId]
  );

  useEffect(() => {
    if (
      page === 1 &&
      !searchTerm &&
      filters.grade.length === 0 &&
      filters.section.length === 0
    ) {
      setTeachers(data.teachers || []);
      setTotalCount(data.totalTeacherCount || 0);
      return;
    }
    fetchTeachers(page);
  }, [
    page,
    fetchTeachers,
    data.teachers,
    data.totalTeacherCount,
    searchTerm,
    filters,
  ]);

  const handlePageChange = (newPage: number) => setPage(newPage);
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

  const normalizedTeachers = useMemo(() => 
    teachers.map(t => ({
      ...t,
      user: {
        ...t.user,
        name: t.user.name ?? undefined,
        email: t.user.email ?? undefined,
        student_id: t.user.student_id ?? undefined,
      }
    }))
  , [teachers]);

  const filteredTeachers = useMemo(() => filterBySearchAndFilters(normalizedTeachers, filters, searchTerm, 'teacher'), [normalizedTeachers, filters, searchTerm]);
  const sortedTeachers = useMemo(() => sortItems(filteredTeachers, orderBy, order), [filteredTeachers, orderBy, order]);
  const paginatedTeachers = useMemo(() => paginateItems(sortedTeachers, page, ROWS_PER_PAGE), [sortedTeachers, page]);

  const displayTeachers = useMemo((): DisplayTeacher[] => {
    return paginatedTeachers.map(
      (apiTeacher): DisplayTeacher => ({
        id: apiTeacher.user.id,
        name: apiTeacher.user.name || "N/A",
        gender: apiTeacher.user.gender || "N/A",
        grade: apiTeacher.grade,
        classSection: apiTeacher.classSection,
        phoneNumber: apiTeacher.user.phone || "N/A",
        emailDisplay: apiTeacher.user.email || "N/A",
      })
    );
  }, [paginatedTeachers]);

  const pageCount = useMemo(() => {
    return Math.ceil(filteredTeachers.length / ROWS_PER_PAGE);
  }, [filteredTeachers]);
  const isDataPresent = displayTeachers.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== "" ||
    Object.values(filters).some((f) => f.length > 0);

  const handleAddNewTeacher = useCallback(() => {}, [history]);
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
  const handleCancelFilters = useCallback(
    () => setIsFilterSliderOpen(false),
    []
  );

  const columns: Column<DisplayTeacher>[] = [
    {
      key: "name",
      label: t("Teacher Name"),
      renderCell: (t) => (
        <Typography variant="body2" className="teacher-name-data">
          {t.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    { key: "grade", label: t("Grade") },
    { key: "classSection", label: t("Class Section") },
    { key: "phoneNumber", label: t("Phone Number") },
    {
      key: "emailDisplay",
      label: t("Email"),
      renderCell: (t) => (
        <Typography variant="body2" className="truncate-text">
          {t.emailDisplay}
        </Typography>
      ),
    }, // Change key from "email" to "emailDisplay"
  ];

  const handleClearFilters = useCallback(() => {
    setFilters({ grade: [], section: [] });
    setTempFilters({ grade: [], section: [] });
    setPage(1);
  }, []);

  const filterConfigsForTeachers = [{ key: "grade", label: "Grade" }];

  return (
    <div className="schoolTeachers-pageContainer">
      <Box className="schoolTeachers-headerActionsRow">
        <Box className="schoolTeachers-titleArea">
          <Typography variant="h5" className="schoolTeachers-titleHeading">
            {t("Teachers")}
          </Typography>
          <Typography variant="body2" className="schoolTeachers-totalText">
            {t("Total")}: {totalCount} {t("teachers")}
          </Typography>
        </Box>
        <Box className="schoolTeachers-actionsGroup">
          <MuiButton
            variant="outlined"
            onClick={handleAddNewTeacher}
            className="schoolTeachers-newTeacherButton-outlined"
          >
            <AddIcon className="schoolTeachers-newTeacherButton-outlined-icon" />
            {!isSmallScreen && t("New Teacher")}
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
          grade: getGradeOptions(teachers)
        }}
        onFilterChange={handleSliderFilterChange}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        filterConfigs={filterConfigsForTeachers}
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
          <div className="schoolTeachers-table-container">
            <DataTableBody
              columns={columns}
              rows={displayTeachers}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
          </div>
          {pageCount > 1 && (
            <div className="schoolTeachers-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
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
