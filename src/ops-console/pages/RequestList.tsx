import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  DEFAULT_PAGE_SIZE,
  EnumType,
  PAGES,
  REQUEST_TABS,
  RequestTypes,
  USER_ROLE,
} from "../../common/constants";
import DataTablePagination from "../components/DataTablePagination";
import DataTableBody, { Column } from "../components/DataTableBody";
import { t } from "i18next";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import { BsFillBellFill } from "react-icons/bs";
import { useLocation, useHistory } from "react-router";
import "./RequestList.css";
import { Constants } from "../../services/database";
import { RoleType } from "../../interface/modelInterfaces";

const filterConfigsForRequests = [
  { key: "school", label: t("Select School") },
  { key: "request_type", label: t("Request Type") },
];

type Filters = Record<string, string[]>;

type FilterOptions = {
  request_type: string[];
  school: Array<{ id: string; name: string }>;
};

const INITIAL_FILTERS: Filters = {
  request_type: [],
  school: [],
};

const INITIAL_FILTER_OPTIONS: FilterOptions = {
  request_type: [],
  school: [],
};

const getTabOptions = () => {
  let userRoles: string[] = [];
  try {
    userRoles = JSON.parse(
      localStorage.getItem(USER_ROLE) || "[]"
    );
  } catch (error) {
    console.error("Failed to parse user roles from localStorage:", error);
  }
  // Only Super Admin and Operational Director can see the Flagged tab
  const canSeeFlaggedTab = 
    userRoles.includes(RoleType.SUPER_ADMIN) ||
    userRoles.includes(RoleType.OPERATIONAL_DIRECTOR);
  
  const allTabs = Object.entries(REQUEST_TABS).map(([key, val]) => ({
    label: val,
    value: val,
  }));
  
  // Filter out FLAGGED tab for users who don't have permission
  if (!canSeeFlaggedTab) {
    return allTabs.filter((tab) => tab.value !== REQUEST_TABS.FLAGGED);
  }
  
  return allTabs;
};

const RequestList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const tabOptions = useMemo(() => getTabOptions(), []);

  function parseJSONParam<T>(param: string | null, fallback: T): T {
    try {
      return param ? (JSON.parse(param) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  const [selectedTab, setSelectedTab] = useState<REQUEST_TABS>(() => {
    const v = qs.get("tab") as REQUEST_TABS | null;
    return v && Object.values(REQUEST_TABS).includes(v)
      ? v
      : REQUEST_TABS.PENDING;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get("search") || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [filters, setFilters] = useState<Filters>(() =>
    parseJSONParam(qs.get("filters"), INITIAL_FILTERS)
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get("page") || "", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const [requestData, setRequestData] = useState<any[]>([]);
  const [rawRequestData, setRawRequestData] = useState<any[]>([]);

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isLoading = isFilterLoading || isDataLoading;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState(INITIAL_FILTER_OPTIONS);
  const [schoolNameToIdMap, setSchoolNameToIdMap] = useState<Map<string, string>>(new Map());
  const [orderBy, setOrderBy] = useState("school_name");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== REQUEST_TABS.PENDING)
      params.set("tab", String(selectedTab));
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (Object.values(filters).some((arr) => arr.length))
      params.set("filters", JSON.stringify(filters));
    if (page !== 1) params.set("page", String(page));
    history.replace({ search: params.toString() });
  }, [selectedTab, debouncedSearchTerm, filters, page, history]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getRequestFilterOptions();
        if (data) {
          setFilterOptions({
            request_type: data.requestType || [],
            school: data.school || [],
          });
          
          const nameToIdMap = new Map<string, string>();
          (data.school || []).forEach((school: { id: string; name: string }) => {
            nameToIdMap.set(school.name, school.id);
          });
          setSchoolNameToIdMap(nameToIdMap);
        }
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchFilterOptions();
  }, [api]);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        let tempTab: EnumType<"ops_request_status">;
        switch (selectedTab) {
          case REQUEST_TABS.PENDING:
            tempTab = Constants.public.Enums.ops_request_status[0];
            break;
          case REQUEST_TABS.APPROVED:
            tempTab = Constants.public.Enums.ops_request_status[2];
            break;
          case REQUEST_TABS.REJECTED:
            tempTab = Constants.public.Enums.ops_request_status[1];
            break;
          case REQUEST_TABS.FLAGGED:
            tempTab = Constants.public.Enums.ops_request_status[3];
            break;
          default:
            tempTab = Constants.public.Enums.ops_request_status[0];
        }

        const filtersWithSchoolIds = {
          ...filters,
          school: filters.school.map((name) => schoolNameToIdMap.get(name) || name).filter(Boolean),
        };

        const cleanedFilters = Object.fromEntries(
          Object.entries(filtersWithSchoolIds).filter(
            ([_, v]) => Array.isArray(v) && v.length > 0
          )
        );

        const orderByMapping = {
          approved_date: "updated_at",
          rejected_date: "updated_at",
          requested_date: "created_at",
          flagged_date: "updated_at",
          school_name: "school(name)",
        };
        
        const backendOrderBy = orderByMapping[orderBy] || orderBy;

        // console.log("🚀 MAKING API CALL WITH:", {
        //   status: tempTab,
        //   page: page,
        //   pageSize: pageSize,
        //   orderBy: backendOrderBy,
        //   orderDir: orderDir,
        //   filters: cleanedFilters,
        //   search: debouncedSearchTerm,
        // });

        const { data, total } = await api.getOpsRequests(
          tempTab,
          page,
          pageSize,
          backendOrderBy,
          orderDir,
          cleanedFilters,
          debouncedSearchTerm
        );

        setRawRequestData(data || []);
        let mappedData: any[] = [];
        switch (selectedTab) {
          case REQUEST_TABS.APPROVED:
            mappedData = (data || []).map((req) => ({
              request_id: req.request_id,
              request_type: req.request_type,
              school_name: req.school?.name || "-",
              class: req.classInfo?.name || "-",
              from: req.requestedBy?.name || "-",
              approved_date: formatDateOnly(req.updated_at),
              approved_by: req.respondedBy?.name || "-",
            }));
            break;

          case REQUEST_TABS.REJECTED:
            mappedData = (data || []).map((req) => ({
              request_id: req.request_id,
              request_type: req.request_type,
              school_name: req.school?.name || "-",
              class: req.classInfo?.name || "-",
              from: req.requestedBy?.name || "-",
              rejected_date: formatDateOnly(req.updated_at),
              rejected_reason: req.rejected_reason_type || "-",
              rejected_by: req.respondedBy?.name || "-",
            }));
            break;

          case REQUEST_TABS.FLAGGED:
            mappedData = (data || []).map((req) => ({
              request_id: req.request_id,
              request_type: req.request_type,
              school_name: req.school?.name || "-",
              class: req.classInfo?.name || "-",
              from: req.requestedBy?.name || "-",
              flagged_date: formatDateOnly(req.updated_at),
              flagged_by: req.respondedBy?.name || "-",
            }));
            break;

          case REQUEST_TABS.PENDING:
          default:
            mappedData = (data || []).map((req) => {
              const requestedDate = new Date(req.created_at).toLocaleString(
                "en-IN",
                {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              );
              return {
                request_id: req.request_id,
                request_type: req.request_type,
                school_name: req.school?.name || "-",
                class: req.classInfo?.name || "-",
                from: req.requestedBy?.name || "-",
                requested_date: requestedDate,
              };
            });
            break;
        }
        setRequestData(mappedData);
        setTotal(total || 0);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        setRequestData([]);
        setTotal(0);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
    tableScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    api,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    filters,
    debouncedSearchTerm,
    schoolNameToIdMap,
  ]);

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const pendingColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: false,
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: false,
    },
    {
      key: "school_name",
      label: t("School Name"),
      width: "fit-content",
      sortable: true,
      orderBy: "school_name",
    },
    {
      key: "class",
      label: t("Class"),
      width: "fit-content",
      sortable: false,
    },
    {
      key: "from",
      label: t("From"),
      width: "fit-content",
      sortable: false,
    },
    {
      key: "requested_date",
      label: t("Requested Date"),
      width: "fit-content",
      sortable: true,
      orderBy: "requested_date",
    },
  ];
  const approvedColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: false,
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: false,
    },
    {
      key: "school_name",
      label: t("School Name"),
      width: "15%",
      sortable: true,
      orderBy: "school_name",
    },
    {
      key: "class",
      label: t("Class"),
      width: "10%",
      sortable: false,
    },
    {
      key: "from",
      label: t("From"),
      width: "15%",
      sortable: false,
    },
    {
      key: "approved_date",
      label: t("Approved Date"),
      width: "15%",
      sortable: true,
      orderBy: "approved_date",
    },
    {
      key: "approved_by",
      label: t("Approved By"),
      width: "10%",
      sortable: false,
    },
  ];

  const rejectedColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: false,
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: false,
    },
    {
      key: "school_name",
      label: t("School Name"),
      width: "15%",
      sortable: true,
      orderBy: "school_name",
    },
    {
      key: "class",
      label: t("Class"),
      width: "10%",
      sortable: false,
    },
    {
      key: "from",
      label: t("From"),
      width: "10%",
      sortable: false,
    },
    {
      key: "rejected_date",
      label: t("Rejected Date"),
      width: "15%",
      sortable: true,
      orderBy: "rejected_date",
    },
    {
      key: "rejected_by",
      label: t("Rejected By"),
      width: "20%",
      sortable: false,
    },
  ];
  const flaggedColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: false,
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: false,
    },
    {
      key: "school_name",
      label: t("School Name"),
      width: "15%",
      sortable: true,
      orderBy: "school_name",
    },
    {
      key: "class",
      label: t("Class"),
      width: "10%",
      sortable: false,
    },
    {
      key: "from",
      label: t("From"),
      width: "15%",
      sortable: false,
    },
    {
      key: "flagged_date",
      label: t("Flagged Date"),
      width: "15%",
      sortable: true,
      orderBy: "flagged_date",
    },
    {
      key: "flagged_by",
      label: t("Flagged By"),
      width: "10%",
      sortable: false,
    },
  ];

  const columns = useMemo(() => {
    switch (selectedTab) {
      case REQUEST_TABS.APPROVED:
        return approvedColumns;
      case REQUEST_TABS.REJECTED:
        return rejectedColumns;
      case REQUEST_TABS.FLAGGED:
        return flaggedColumns;
      case REQUEST_TABS.PENDING:
      default:
        return pendingColumns;
    }
  }, [selectedTab, t]); // Added 't' to dependency array as it's used inside

  const handleSort = (colKey: string) => {
    const column = columns.find((c) => c.key === colKey);
    if (!column?.sortable) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("desc");
    }
    setPage(1);
  };

  const handleCancelFilters = () => {
    setTempFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setIsFilterOpen(false);
    setPage(1);
  };
  const pageCount = Math.ceil(total / pageSize);
  
  const filterOptionsForSlider: Record<string, string[]> = {
    request_type: filterOptions.request_type,
    school: filterOptions.school.map((s) => s.name),
  };

  const handleRowClick = (id: string | number, row: any) => {
    // Ensure request_type exists and is a string
    if (!row.request_type || typeof row.request_type !== "string") return;

    // Normalize request type
    const type = row.request_type.toLowerCase();

    // Supported roles
    const validTypes = [
      RequestTypes.STUDENT,
      RequestTypes.TEACHER,
      RequestTypes.PRINCIPAL,
      RequestTypes.SCHOOL,
    ];
    const matchedType = validTypes.find((t) => type.includes(t));
    if (!matchedType) {
      console.warn("Unhandled request type:", row.request_type);
      return;
    }

    // Find the full request data
    const fullRequestData = rawRequestData.find(
      (r) => r.request_id === row.request_id
    );
    if (!fullRequestData) {
      console.error("Could not find full request data for ID:", row.request_id);
      return;
    }

    // Consolidate roles with same paths
    const opsRoles = [RequestTypes.TEACHER, RequestTypes.PRINCIPAL]; // Both use OPS paths
    const roleKey = opsRoles.includes(matchedType) ? "ops" : matchedType;

    // Map role + tab → path
    const pathMap: Record<string, Record<string, string>> = {
      student: {
        [REQUEST_TABS.PENDING]: PAGES.STUDENT_PENDING_REQUEST,
        [REQUEST_TABS.APPROVED]: PAGES.OPS_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.OPS_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
      ops: {
        [REQUEST_TABS.PENDING]: PAGES.PRINCIPAL_TEACHER_PENDING_REQUEST, // can also be PRINCIPAL_PENDING_REQUEST if needed
        [REQUEST_TABS.APPROVED]: PAGES.OPS_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.OPS_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
      school: {
        [REQUEST_TABS.PENDING]: PAGES.SCHOOL_PENDING_REQUEST,
        [REQUEST_TABS.APPROVED]: PAGES.SCHOOL_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.SCHOOL_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
    };

    const rolePaths = pathMap[roleKey];
    const pathToNavigate = rolePaths[selectedTab]
      ? `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}${rolePaths[selectedTab]}/${row.request_id}`
      : "";

    if (!pathToNavigate) {
      console.warn(
        `Unhandled request tab for ${matchedType} request:`,
        selectedTab
      );
      return;
    }

    // Navigate with state
    history.push({
      pathname: pathToNavigate,
      state: { request: fullRequestData },
    });
  };

  return (
    <div className="request-list-ion-page">
      <div className="request-list-main-container">
        <div className="request-list-page-header">
          <span className="request-list-page-header-title">
            {t("Requests")}
          </span>
          <IconButton className="request-list-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>
        <div className="request-list-header-and-search-filter">
          <div className="request-list-search-filter">
            <div className="request-list-tab-wrapper">
              <Tabs
                value={selectedTab}
                onChange={(e, val) => {
                  setSelectedTab(val);
                  setPage(1);
                }}
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                className="request-list-tabs-div"
              >
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.value}
                    label={tab.label}
                    value={tab.value}
                    className="request-list-tab"
                  />
                ))}
              </Tabs>
            </div>

            <div className="request-list-button-and-search-filter">
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={(e) => {
                  setSearchTerm(e.target.value);
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
            filterOptions={filterOptionsForSlider}
            onFilterChange={(name, value) =>
              setTempFilters((prev) => ({ ...prev, [name]: value }))
            }
            onApply={() => {
              setFilters(tempFilters);
              setIsFilterOpen(false);
              setPage(1);
            }}
            onCancel={() => {
              setTempFilters(INITIAL_FILTERS);
              setFilters(INITIAL_FILTERS);
              setIsFilterOpen(false);
              setPage(1);
            }}
            autocompleteStyles={{}}
            filterConfigs={filterConfigsForRequests}
          />
        </div>

        <div className="request-list-table-container">
          {(isLoading || requestData.length > 0) && (
            <DataTableBody
              columns={columns}
              rows={requestData}
              orderBy={orderBy}
              order={orderDir}
              onSort={handleSort}
              loading={isLoading} // let DataTableBody show skeleton/loader
              onRowClick={handleRowClick}
              ref={tableScrollRef}
            />
          )}
        </div>

        {!isLoading && requestData.length === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {t("No requests found.")}
            </Typography>
          </Box>
        )}
        {!isLoading && requestData.length > 0 && (
          <div className="request-list-footer">
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(val) => {
                setPage(val);
                tableScrollRef.current?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestList;
