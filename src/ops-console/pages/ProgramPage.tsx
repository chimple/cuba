import React, { useEffect, useState } from "react";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import { useDataTableLogic } from "../OpsUtility/useDataTableLogic";
import {
  Box,
  Chip,
  Typography,
  Button,
  Skeleton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import "./ProgramPage.css";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import SearchAndFilter from "../components/SearchAndFilter";
import HeaderTab from "../components/HeaderTab";
import { Add } from "@mui/icons-material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { useHistory } from "react-router";
import {
  PAGES,
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  TabType,
  USER_ROLE,
} from "../../common/constants";
import { RoleType } from "../../interface/modelInterfaces";
import { BsFillBellFill } from "react-icons/bs";

type ProgramRow = {
  programName: any;
  institutes: any;
  students: any;
  devices: any;
  manager: any;
};

const columns: Column<ProgramRow>[] = [
  { key: "programName", label: "Program Name", align: "left" },
  { key: "institutes", label: "No of Institutes", align: "left" },
  { key: "students", label: "No of Students", align: "left" },
  { key: "devices", label: "No of Devices", align: "left" },
  { key: "manager", label: "Program Manager" },
];

const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(([key, label]) => ({
  value: key as PROGRAM_TAB,
  label,
}));

const ProgramsPage: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    partner: [],
    program_type: [],
    model: [],
    state: [],
    district: [],
    block: [],
    village: [],
    cluster: [],
  });
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    partner: [],
    program_type: [],
    model: [],
    state: [],
    district: [],
    block: [],
    village: [],
    cluster: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProgramManager, setIsProgramManager] = useState(false);
  const [isOpsRole, setIsOpsRole] = useState(false);
  const tab: TabType = tabOptions[activeTabIndex].value;

  const showNewProgramButton = isOpsRole || isProgramManager;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingFilters(true);

        const [filterResponse, isManager] = await Promise.all([
          api.getProgramFilterOptions(),
          api.isProgramManager(),
        ]);

        setFilterOptions(filterResponse);
        setIsProgramManager(!!isManager);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsProgramManager(false);
      } finally {
        setLoadingFilters(false);
      }

      const userRole = localStorage.getItem(USER_ROLE);
      const isOps =
        userRole === RoleType.SUPER_ADMIN || userRole === RoleType.OPERATIONAL_DIRECTOR;
      setIsOpsRole(isOps);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      const user = await auth.getCurrentUser();
      const currentUserId = user?.id;
      setLoadingPrograms(true);
      try {
        if (!currentUserId) {
          setPrograms([]);
          return;
        }
        const { data } = await api.getPrograms({
          currentUserId,
          filters,
          searchTerm,
          tab,
        });
        setPrograms(data);
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setPage(1);
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [filters, searchTerm, tab]);

  const transformedRows = programs.map((row) => ({
    id: row.id,
    programName: {
      value: row.name,
      render: (
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="subtitle2">{row.name}</Typography>
          <Typography variant="body2" color="text.secondary"  textAlign={"left"}>
            {row.state}
          </Typography>
        </Box>
      ),
    },
    institutes: row.institutes_count ?? 0,
    students: row.students_count ?? 0,
    devices: {
      value: row.devices_count ?? 0,
      render: <Chip label={row.devices_count ?? 0} size="small" />,
    },
    manager: row.manager_names,
  }));

  const { orderBy, order, page, setPage, handleSort, paginatedRows } =
    useDataTableLogic(transformedRows);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTabIndex(newValue);
  };

  const handleFilterChange = (name: string, value: any) => {
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const updatedFilters = {
        ...prev,
        [key]: prev[key].filter((v) => v !== value),
      };
      setTempFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const onFilterClick = () => setIsFilterOpen(true);
  const handelClose = () => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleCancelFilters = () => {
    const reset = {
      partner: [],
      program_type: [],
      model: [],
      state: [],
      district: [],
      block: [],
      village: [],
      cluster: [],
    };
    setTempFilters(reset);
    setFilters(reset);
    setIsFilterOpen(false);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const autocompleteStyles = {
    "& .MuiOutlinedInput-root": { padding: "6px!important" },
    "& .MuiAutocomplete-paper": { boxShadow: "none", border: "none" },
    "& .MuiAutocomplete-listbox": { padding: 0 },
  };

  const filterConfigsForProgram = [
    { key: "Partner", label: t("Select Partner") },
    { key: "Program Manager", label: t("Select Program Manager") },
    { key: "Program Type", label: t("Select Program Type") },
    { key: "state", label: t("Select State") },
    { key: "district", label: t("Select District") },
    { key: "block", label: t("Select Block") },
    { key: "village", label: t("Select Village") },
    { key: "cluster", label: t("Select Cluster") },
  ];

  return (
    <div className="program-page">
      <div className="program-page-header">
        {t("Programs")}
        <IconButton sx={{ color: "black" }}>
          <BsFillBellFill />
        </IconButton>
      </div>

      <div className="program-header-and-search-filter">
        <div className="program-search-filter">
          <div className="program-tab-wrapper">
            <HeaderTab
              activeTab={activeTabIndex}
              handleTabChange={handleTabChange}
              tabs={tabOptions}
            />
          </div>

          <div className="program-button-and-search-filter">
            {!loadingFilters && showNewProgramButton && (
              <Button
                variant="outlined"
                onClick={() =>
                  history.replace(PAGES.SIDEBAR_PAGE + PAGES.NEW_PROGRAM)
                }
                sx={{
                  borderColor: "#e0e0e0",
                  border: "1px solid",
                  borderRadius: 20,
                  boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
                  height: "36px",
                  minWidth: isSmallScreen ? "48px" : "auto",
                  padding: isSmallScreen ? 0 : "6px 16px",
                  textTransform: "none",
                }}
              >
                <Add />
                {!isSmallScreen && <span style={{ color: "black" }}>{t("New Program")}</span>}
              </Button>
            )}
            {loadingFilters ? (
              <CircularProgress />
            ) : (
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterClick={onFilterClick}
              />
            )}
          </div>
        </div>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
        />

        <FilterSlider
          isOpen={isFilterOpen}
          onClose={handelClose}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          autocompleteStyles={autocompleteStyles}
          filterConfigs={filterConfigsForProgram}
        />
      </div>

      <div className="program-table">
        {loadingPrograms ? (
          <Box padding={2}>
            {[...Array(10)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={40}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        ) : programs.length === 0 ? (
          <Box padding={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {t("No programs found")}
            </Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={paginatedRows}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
            detailPageRouteBase="programs"
          />
        )}
      </div>

      <div className="program-page-pagination">
        <DataTablePagination
          page={page}
          pageCount={Math.ceil(programs.length / 10)}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default ProgramsPage;
