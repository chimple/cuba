import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, PROGRAM_TAB, PROGRAM_TAB_LABELS, USER_ROLE } from "../../common/constants";
import "./SchoolList.css";
import DataTablePagination from "../components/DataTablePagination";
import DataTableBody, { Column } from "../components/DataTableBody";
import { t } from "i18next";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import FileUpload from "../components/FileUpload";
import { FileUploadOutlined, Add } from "@mui/icons-material";
import { BsFillBellFill } from "react-icons/bs";
import { useLocation, useHistory } from "react-router";
import { RoleType } from "../../interface/modelInterfaces";

const filterConfigsForSchool = [
  { key: "partner", label: t("Select Partner") },
  { key: "programManager", label: t("Select Program Manager") },
  { key: "fieldCoordinator", label: t("Select Field Coordinator") },
  { key: "programType", label: t("Select Program Type") },
  { key: "state", label: t("Select State") },
  { key: "district", label: t("Select District") },
  { key: "block", label: t("Select Block") },
  { key: "cluster", label: t("Select Cluster") },
];

type Filters = Record<string, string[]>;

const INITIAL_FILTERS: Filters = {
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
};

const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(([value, label]) => ({
  label,
  value: value as PROGRAM_TAB,
}));

const DEFAULT_PAGE_SIZE = 8;

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);

  function parseJSONParam<T>(param: string | null, fallback: T): T {
    try {
      return param ? (JSON.parse(param) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  const [selectedTab, setSelectedTab] = useState(() => {
    const v = qs.get("tab") || PROGRAM_TAB.ALL;
    return Object.values(PROGRAM_TAB).includes(v as PROGRAM_TAB)
      ? (v as PROGRAM_TAB)
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get("search") || "");
  const [filters, setFilters] = useState<Filters>(() =>
    parseJSONParam(qs.get("filters"), INITIAL_FILTERS)
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get("page") || "", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const [schools, setSchools] = useState<any[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isLoading = isFilterLoading || isDataLoading;

  const [showUploadPage, setShowUploadPage] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  const userRoles = JSON.parse(
    localStorage.getItem(USER_ROLE) || "[]"
  );
  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType)
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set("tab", String(selectedTab));
    if (searchTerm) params.set("search", searchTerm);
    if (Object.values(filters).some((arr) => arr.length))
      params.set("filters", JSON.stringify(filters));
    if (page !== 1) params.set("page", String(page));
    history.replace({ search: params.toString() });
  }, [selectedTab, searchTerm, filters, page, history]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions({
            programType: data.programType || [],
            partner: data.partner || [],
            programManager: data.programManager || [],
            fieldCoordinator: data.fieldCoordinator || [],
            state: data.state || [],
            district: data.district || [],
            block: data.block || [],
            cluster: data.cluster || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTab, filters, page, orderBy, orderDir, searchTerm]);

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const tabModelFilter = { model: [selectedTab] };
      const cleanedFilters = Object.fromEntries(
        Object.entries({ ...filters, ...tabModelFilter }).filter(
          ([_, v]) => Array.isArray(v) && v.length > 0
        )
      );

      let backendOrderBy = orderBy;
      if (backendOrderBy === "name") backendOrderBy = "school_name";
      if (backendOrderBy === "students") backendOrderBy = "num_students";
      if (backendOrderBy === "teachers") backendOrderBy = "num_teachers";

      const response = await api.getFilteredSchoolsForSchoolListing({
        filters: cleanedFilters,
        page,
        page_size: pageSize,
        order_by: backendOrderBy,
        order_dir: orderDir,
        search: searchTerm,
      });
      const data = response?.data || [];
      setTotal(response?.total || 0);

      const enrichedSchools = data.map((school: any) => ({
        ...school,
        id: school.sch_id,
        students: school.num_students || 0,
        teachers: school.num_teachers || 0,
        programManagers:
          school.program_managers?.join(", ") || t("not assigned yet"),
        fieldCoordinators:
          school.field_coordinators?.join(", ") || t("not assigned yet"),
        name: {
          value: school.school_name,
          render: (
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="subtitle2">{school.school_name}</Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontSize={"12px"}
              >
                {school.udise_code || school.district
                  ? `${school.udise_code ?? ""} - ${
                      school.district ?? ""
                    }`.trim()
                  : ""}
              </Typography>
            </Box>
          ),
        },
      }));

      setSchools(enrichedSchools);
    } catch (error) {
      console.error("Failed to fetch filtered schools:", error);
      setSchools([]);
      setTotal(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [
    api,
    filters,
    page,
    pageSize,
    orderBy,
    orderDir,
    searchTerm,
    selectedTab,
  ]);

  const columns: Column<Record<string, any>>[] = [
    {
      key: "name",
      label: t("Schools"),
      width: "30%",
      sortable: true,
      orderBy: "name",
    },
    {
      key: "students",
      label: t("No. of Students"),
      width: "fit-content",
      sortable: true,
      orderBy: "students",
    },
    {
      key: "teachers",
      label: t("No. of Teachers"),
      width: "fit-content",
      sortable: true,
      orderBy: "teachers",
    },
    {
      key: "programManagers",
      label: t("Program Manager"),
      sortable: false,
    },
    {
      key: "fieldCoordinators",
      label: t("Field Coordinator"),
      sortable: false,
    },
  ];

  const handleSort = (colKey: string) => {
    const sortableKeys = ["name", "students", "teachers", "district"];
    if (!sortableKeys.includes(colKey)) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("desc");
    }
    setPage(1);
  };

  function onCancleClick(): void {
    setShowUploadPage(false);
  }

  const handleCancelFilters = () => {
    const reset = {
      partner: [],
      programManager: [],
      fieldCoordinator: [],
      programType: [],
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

  const pageCount = Math.ceil(total / pageSize);

  if (showUploadPage) {
    return (
      <div>
        <div className="school-list-upload-text">{t("Upload File")}</div>
        <div>
          <FileUpload onCancleClick={onCancleClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="school-list-ion-page">
      <div className="school-list-main-container">
        <div className="school-list-page-header">
          <span className="school-list-page-header-title">{t("Schools")}</span>
          <IconButton className="school-list-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>
        <div className="school-list-header-and-search-filter">
          <div className="school-list-search-filter">
            <div className="school-list-tab-wrapper">
              <Tabs
                value={selectedTab}
                onChange={(e, val) => {
                  setSelectedTab(val);
                  setPage(1);
                }}
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                className="school-list-tabs-div"
              >
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.value}
                    label={tab.label}
                    value={tab.value}
                    className="school-list-tab"
                  />
                ))}
              </Tabs>
            </div>

            <div className="school-list-button-and-search-filter">
              {haveAccess &&
              <Button
                variant="outlined"
                onClick={() => {
                  history.push({
                    pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
                  });
                }}
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
                <Add className="school-list-upload-icon" />

                {!isSmallScreen && (
                  <span className="school-list-upload-text1">
                    {t("Add School")}
                  </span>
                )}
              </Button>
              }
              <Button
                variant="outlined"
                onClick={() => setShowUploadPage(true)}
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
                <FileUploadOutlined className="school-list-upload-icon" />
                {!isSmallScreen && (
                  <span className="school-list-upload-text1">
                    {t("Upload")}
                  </span>
                )}
              </Button>

              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                filters={filters}
                onFilterClick={() => setIsFilterOpen(true)}
                onClearFilters={handleCancelFilters}
              />
            </div>
          </div>

          <SelectedFilters
            filters={filters}
            onDeleteFilter={(key, value) => {
              setFilters((prev) => {
                const updated = {
                  ...prev,
                  [key]: prev[key].filter((v) => v !== value),
                };
                setTempFilters(updated);
                return updated;
              });
              setPage(1);
            }}
          />

          <FilterSlider
            isOpen={isFilterOpen}
            onClose={() => {
              setIsFilterOpen(false);
              setTempFilters(filters);
            }}
            filters={tempFilters}
            filterOptions={filterOptions}
            onFilterChange={(name, value) =>
              setTempFilters((prev) => ({ ...prev, [name]: value }))
            }
            onApply={() => {
              setFilters(tempFilters);
              setIsFilterOpen(false);
              setPage(1);
            }}
            onCancel={() => {
              const empty = {
                state: [],
                district: [],
                block: [],
                programType: [],
                partner: [],
                programManager: [],
                fieldCoordinator: [],
              };
              setTempFilters(empty);
              setFilters(empty);
              setIsFilterOpen(false);
              setPage(1);
            }}
            autocompleteStyles={{}}
            filterConfigs={filterConfigsForSchool}
          />
        </div>
        <div
          className={`school-list-table-container ${
            !isLoading && schools.length === 0 ? "school-list-no-schools" : ""
          }`}
        >
          {!isLoading && schools.length > 0 && (
            <DataTableBody
              columns={columns}
              rows={schools}
              orderBy={orderBy}
              order={orderDir}
              onSort={handleSort}
              loading={isLoading}
            />
          )}

          {!isLoading && schools.length === 0 && t("No schools found.")}
        </div>

        {!isLoading && schools.length > 0 && (
          <div className="school-list-footer">
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(val) => setPage(val)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
