import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
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
  REQUEST_TABS,
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

const filterConfigsForRequests = [
  { key: "request_type", label: t("Request Type") },
  { key: "school", label: t("Select School") },
];

type Filters = Record<string, string[]>;

const INITIAL_FILTERS: Filters = {
  request_type: [],
  school: [],
};

const tabOptions = Object.entries(REQUEST_TABS).map(([key, val]) => ({
  label: val,
  value: val,
}));

const RequestList: React.FC = () => {
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
  const [selectedTab, setSelectedTab] = useState<REQUEST_TABS>(() => {
    const v = qs.get("tab") as REQUEST_TABS | null;
    return v && Object.values(REQUEST_TABS).includes(v)
      ? v
      : REQUEST_TABS.PENDING;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get("search") || "");
  const [filters, setFilters] = useState<Filters>(() =>
    parseJSONParam(qs.get("filters"), INITIAL_FILTERS)
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get("page") || "", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const [requestData, setRequestData] = useState<any[]>([]);

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isLoading = isFilterLoading || isDataLoading;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== REQUEST_TABS.PENDING)
      params.set("tab", String(selectedTab));
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
        const data = await api.getRequestFilterOptions();
        if (data) {
          setFilterOptions({
            request_type: data.requestType || [],
            school: data.school || [],
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

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const tempTab: EnumType<"ops_request_status"> =
        selectedTab === REQUEST_TABS.PENDING
          ? Constants.public.Enums.ops_request_status[0]
          : selectedTab === REQUEST_TABS.APPROVED
            ? Constants.public.Enums.ops_request_status[2]
            : Constants.public.Enums.ops_request_status[1];
      const cleanedFilters = Object.fromEntries(
        Object.entries({ ...filters }).filter(
          ([_, v]) => Array.isArray(v) && v.length > 0
        )
      );

      const data = await api.getOpsRequests(
        tempTab,
        page,
        pageSize,
        cleanedFilters,
        searchTerm
      );

      let mappedData: any[] = [];

      switch (selectedTab) {
        case REQUEST_TABS.APPROVED:
          mappedData = (data || []).map((req) => {
            return {
              request_id: req.request_id,
              request_type: req.request_type,
              school_name: req.school?.name || "-",
              class: req.classInfo?.name || "-",
              from: req.requestedBy?.name || "-",
              approved_date: formatDateOnly(req.updated_at),
              approved_by: req.respondedBy?.name || "-",
            };
          });
          break;

        case REQUEST_TABS.REJECTED:
          mappedData = (data || []).map((req) => {
            return {
              request_id: req.request_id,
              request_type: req.request_type,
              school_name: req.school?.name || "-",
              class: req.classInfo?.name || "-",
              from: req.requestedBy?.name || "-",
              rejected_date: formatDateOnly(req.updated_at),
              rejected_reason: req.rejected_reason_type || "-",
              rejected_by: req.respondedBy?.name || "-",
            };
          });
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
      setTotal(data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      setRequestData([]);
      setTotal(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [selectedTab, filters, page, orderBy, orderDir, searchTerm]);

  const pendingColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: true,
      orderBy: "request_id",
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: true,
      orderBy: "request_type",
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
      sortable: true,
      orderBy: "class",
    },
    {
      key: "from",
      label: t("From"),
      width: "fit-content",
      orderBy: "from",
    },
    {
      key: "requested_date",
      label: t("Requested Date"),
      width: "fit-content",
      orderBy: "requested_date",
    },
  ];
  const approvedColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: true,
      orderBy: "request_id",
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: true,
      orderBy: "request_type",
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
      sortable: true,
      orderBy: "class",
    },
    {
      key: "from",
      label: t("From"),
      width: "15%",
      orderBy: "from",
    },
    {
      key: "approved_date",
      label: t("Approved Date"),
      width: "15%",
      orderBy: "approved_date",
    },
    {
      key: "approved_by",
      label: t("Approved By"),
      width: "10%",
      orderBy: "approved_by",
    },
  ];

  const rejectedColumns: Column<Record<string, any>>[] = [
    {
      key: "request_id",
      label: t("Request ID"),
      width: "10%",
      sortable: true,
      orderBy: "request_id",
    },
    {
      key: "request_type",
      label: t("Request Type"),
      width: "15%",
      sortable: true,
      orderBy: "request_type",
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
      sortable: true,
      orderBy: "class",
    },
    {
      key: "from",
      label: t("From"),
      width: "10%",
      orderBy: "from",
    },
    {
      key: "rejected_date",
      label: t("Rejected Date"),
      width: "15%",
      orderBy: "rejected_date",
    },
    {
      key: "rejected_reason",
      label: t("Reason"),
      width: "10%",
      orderBy: "rejected_reason",
    },
    {
      key: "rejected_by",
      label: t("Rejected By"),
      width: "10%",
      orderBy: "rejected_by",
    },
  ];
  const columns = useMemo(() => {
    switch (selectedTab) {
      case REQUEST_TABS.APPROVED:
        return approvedColumns;
      case REQUEST_TABS.REJECTED:
        return rejectedColumns;
      case REQUEST_TABS.PENDING:
      default:
        return pendingColumns;
    }
  }, [selectedTab]);
  const handleSort = (colKey: string) => {
    const column = columns.find((c) => c.key === colKey);
    if (!column?.sortable) return;

    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("asc");
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
          <DataTableBody
            columns={columns}
            rows={requestData}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={isLoading}
          />
        </div>

        {!isLoading && requestData.length === 0 && (
          <Typography align="center" sx={{ mt: 4 }}>
            {t("No requests found.")}
          </Typography>
        )}
        {!isLoading && requestData.length > 0 && (
          <div className="request-list-footer">
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

export default RequestList;
