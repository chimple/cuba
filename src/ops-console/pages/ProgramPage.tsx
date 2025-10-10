import React, { useEffect, useMemo, useState } from "react";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  useMediaQuery,
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
import { useHistory, useLocation } from "react-router";
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
  schools: any;
  students: any;
  devices: any;
  manager: any;
};

const columns: Column<ProgramRow>[] = [
  {
    key: "programName",
    label: "Program Name",
    align: "left",
    width: "30%",
    sortable: true,
  },
  {
    key: "schools",
    label: "No. of Schools",
    align: "left",
    sortable: true,
  },
  { key: "students", label: "No. of Students", align: "left", sortable: true },
  { key: "devices", label: "No. of Devices", align: "left", sortable: true },
  {
    key: "manager",
    label: "Program Manager",
    align: "left",
    width: "25%",
    sortable: false,
  },
];

const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(([key, label]) => ({
  value: key as PROGRAM_TAB,
  label,
}));

const orderByMap: Record<string, string> = {
  programName: "name",
  schools: "institutes_count",
  students: "students_count",
  devices: "devices_count",
  manager: "manager_names",
};

const PAGE_SIZE = 8;

const ProgramsPage: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  const location = useLocation();
  const qs = new URLSearchParams(location.search);

  function parseJSONParam<T>(param: string | null, fallback: T): T {
    try {
      return param ? (JSON.parse(param) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const n = parseInt(qs.get("tab") || "", 10);
    return isNaN(n) ? 0 : n;
  });
  const [filters, setFilters] = useState<Record<string, string[]>>(() =>
    parseJSONParam(qs.get("filters"), {})
  );
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState(() => qs.get("search") || "");
  const [programs, setPrograms] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>(
    {}
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProgramManager, setIsProgramManager] = useState(false);
  const [isOpsRole, setIsOpsRole] = useState(false);
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get("page") || "", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const tab: TabType = tabOptions[activeTabIndex].value;
  const tableScrollRef = React.useRef<HTMLDivElement>(null);

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
        userRole?.includes(RoleType.SUPER_ADMIN) ||
        userRole?.includes(RoleType.OPERATIONAL_DIRECTOR);
      setIsOpsRole(!!isOps);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page !== 1) params.set("page", String(page));
    if (searchTerm) params.set("search", searchTerm);
    if (Object.values(filters).some((arr) => arr.length))
      params.set("filters", JSON.stringify(filters));
    if (activeTabIndex !== 0) params.set("tab", String(activeTabIndex));
    history.replace({ search: params.toString() });
  }, [page, searchTerm, filters, activeTabIndex, history]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const user = await auth.getCurrentUser();
      const currentUserId = user?.id;
      setLoadingPrograms(true);
      try {
        if (!currentUserId) {
          setPrograms([]);
          setTotalCount(0);
          return;
        }
        const { data } = await api.getPrograms({
          currentUserId,
          filters,
          searchTerm,
          tab,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          orderBy,
          order,
        });
        setPrograms(data);
        setTotalCount(data.length > 0 ? data[0].total_count : 0);
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        setPrograms([]);
        setTotalCount(0);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [filters, searchTerm, tab, page, orderBy, order]);

  // Memo for rendering
  const transformedRows = useMemo(
    () =>
      programs.map((row) => ({
        id: row.id,
        programName: {
          value: row.name,
          render: (
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="subtitle2">{row.name}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign={"left"}
              >
                {row.state}
              </Typography>
            </Box>
          ),
        },
        schools:
          typeof row.institutes_count === "number" ? row.institutes_count : "—",
        students:
          typeof row.students_count === "number" ? row.students_count : "—",
        devices:
          typeof row.devices_count === "number" ? row.devices_count : "—",
        manager:
          row.manager_names && row.manager_names.trim() !== ""
            ? row.manager_names
            : "—",
      })),
    [programs]
  );

  const handleSort = (col: string) => {
    const backendOrderBy = orderByMap[col] || "name";
    if (orderBy === backendOrderBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(backendOrderBy);
      setOrder("desc");
    }
    setPage(1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTabIndex(newValue);
    setPage(1);
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
    setPage(1);
  };

  const onFilterClick = () => setIsFilterOpen(true);
  const handelClose = () => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  };

  const handleCancelFilters = () => {
    const reset = {
      partner: [],
      program_type: [],
      model: [],
      state: [],
      district: [],
      block: [],
      cluster: [],
    };
    setTempFilters(reset);
    setFilters(reset);
    setIsFilterOpen(false);
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
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
    { key: "cluster", label: t("Select Cluster") },
  ];

  return (
    <div className="program-page">
      <div className="program-page-header">
        <span className="program-page-header-title">{t("Programs")}</span>
        <IconButton className="bell-icon" sx={{ color: "black" }}>
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
                {!isSmallScreen && (
                  <span style={{ color: "black" }}>{t("New Program")}</span>
                )}
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
                onClearFilters={handleCancelFilters}
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
        {programs.length === 0 && !loadingPrograms ? (
          <Box padding={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {t("No programs found")}
            </Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={transformedRows}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
            detailPageRouteBase="programs"
            ref={tableScrollRef}
            loading={loadingPrograms}
          />
        )}
      </div>

      <div className="program-page-pagination">
        <DataTablePagination
          page={page}
          pageCount={Math.ceil(totalCount / PAGE_SIZE)}
          onPageChange={(newPage) => {
            setPage(newPage);
            tableScrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
};

export default ProgramsPage;
