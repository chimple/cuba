import React, { useEffect, useMemo, useState } from "react";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Button,
  Chip,
} from "@mui/material";
import "./SchoolActivities.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { useHistory, useLocation } from "react-router";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  PAGES,
  PERFORMANCE_UI,
  PerformanceLevel,
} from "../../common/constants";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Breadcrumb from "../components/Breadcrumb";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import ActivityDetailsPanel from "./ActivityDetailsPanel";
import { FcActivity } from "../../interface/modelInterfaces";


const DEFAULT_PAGE_SIZE = 10;

const SchoolActivities: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const activityData: any = location.state;

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>(
    {}
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [total, setTotal] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<FcActivity | null>(null);

  useEffect(() => {
    const fetchActivitiesWithMeta = async () => {
      setLoadingData(true);
      try {
        let data = await Promise.all(
          activityData.activities.map(async (act: any) => ({
            raw: act,
            user: await api.getUserByDocId(act.contact_user_id),
            classInfo: act.class_id
              ? await api.getClassById(act.class_id)
              : null,
          }))
        );

        if (searchTerm) {
          data = data.filter((d) =>
            (d.user?.name ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        }

        Object.entries(filters).forEach(([key, values]) => {
          if (!values.length) return;
          data = data.filter((d) => {
            switch (key) {
              case "contactType":
                return values.map((v) => v.toLowerCase()).includes(d.raw.contact_target.toLowerCase());
              case "performance":
                return values.includes(
                  PERFORMANCE_UI[d.raw.support_level as PerformanceLevel]?.label
                );

              default:
                return true;
            }
          });
        });

        if (orderBy) {
          data.sort((a, b) => {
            const A = getSortField(a);
            const B = getSortField(b);
            return orderDir === "asc" ? A.localeCompare(B) : B.localeCompare(A);
          });
        }

        setTotal(data.length);
        const start = (page - 1) * DEFAULT_PAGE_SIZE;
        data = data.slice(start, start + DEFAULT_PAGE_SIZE);

        setActivities(
          data.map((d) => {
            const perf =
              PERFORMANCE_UI[d.raw.support_level as PerformanceLevel];
            return {
              raw: d.raw,
              user: d.user,
              classInfo: d.classInfo,
              visitDetails: activityData.visitDetails,

              name: d.user?.name ?? "--",
              contactType:
                d.raw.contact_target.charAt(0).toUpperCase() +
                d.raw.contact_target.slice(1),

              performance: (
                <Chip
                  label={perf?.label ?? "Not Tracked"}
                  size="small"
                  sx={{
                    backgroundColor: perf?.bgColor,
                    color: perf?.textColor,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    height: 24,
                  }}
                />
              ),
              class: d.classInfo?.name ?? "--",
              time: OpsUtil.formatTimeToIST(d.raw.created_at),
              techIssues: d.raw.tech_issues_reported ? (
                <Chip
                  label="Yes"
                  size="small"
                  icon={<img src="/assets/icons/Wrench.svg" />}
                  sx={{
                    backgroundColor: "#FFEDD4",
                    color: "#CA3500",
                    fontWeight: 500,
                    height: 24,
                  }}
                />
              ) : (
                "--"
              ),
              details: {
                render: <ChevronRightIcon />,
              },
            };
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchActivitiesWithMeta();
  }, [filters, searchTerm, orderBy, orderDir, page, activityData.activities]);

  const columns: Column<any>[] = [
    { 
    key: "name",
    label: t("Name"),
    sortable: true,
    onCellClick: true
  },
    { key: "contactType", label: t("Contact Type"), sortable: true },
    { key: "performance", label: t("Performance"), sortable: true },
    { key: "class", label: t("Class"), sortable: true },
    { key: "time", label: t("Time"), sortable: true },
    { key: "techIssues", label: t("Tech Issues"), sortable: false },
    { key: "details", label: t("Details"), sortable: false },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string[]) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteFilter = (key: string, value: string) => {
    const updated = {
      ...filters,
      [key]: filters[key].filter((v) => v !== value),
    };
    setFilters(updated);
    setTempFilters(updated);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  };

  const handleCancelFilters = () => {
    const reset = { performance: [], contactType: [] };
    setFilters(reset);
    setTempFilters(reset);
    setIsFilterOpen(false);
    setPage(1);
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const res = await api.getActivitiesFilterOptions();
        const transformed = {
          ...res,
          performance: (res.performance || []).map(
            (p: string) => PERFORMANCE_UI[p as PerformanceLevel]?.label || p
          ),
          contactType: (res.contactType || []).map(
            (ct: string) =>
              ct.charAt(0).toUpperCase() + ct.slice(1).toLowerCase()
          ),
        };

        setFilterOptions(transformed);
      } catch {
        setFilterOptions({});
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilterOptions();
  }, []);
  const getSortField = (data: any) => {
    switch (orderBy) {
      case "name":
        return data.user?.name ?? "";
      case "contactType":
        return data.raw.contact_target ?? "";
      case "performance":
        return (
          PERFORMANCE_UI[data.raw.support_level as PerformanceLevel]?.label ??
          ""
        );
      case "class":
        return data.classInfo?.name ?? "";
      case "time":
        return data.raw.created_at ?? "";
      default:
        return "";
    }
  };

  const handleSort = (colKey: string) => {
    const sortable = ["name", "contactType", "performance", "class", "time"];
    if (!sortable.includes(colKey)) return;

    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("asc");
    }
    setPage(1);
  };

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);

  const filterConfigs = useMemo(
    () =>
      [
        {
          key: "performance",
          label: t("Performance"),
          placeholder: t("Performance"),
        },
        {
          key: "contactType",
          label: t("Contact Type"),
          placeholder: t("Contact Type"),
        },
      ].filter((f) => (filterOptions[f.key] || []).length > 1),
    [filterOptions]
  );

 const handleRowClick = (id: string | number, row: FcActivity) => {
  setSelectedActivity(row);
};

  return (
    <div className="school-act-container" id="school-act">
      <Box className="school-act-header">
        <Box className="school-act-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="school-act-title-mobile">
                {t("Schools")}
              </Typography>
              <IconButton className="school-act-icon-button" id="notify-btn">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="school-act-title">
                {t("Schools")}
              </Typography>
              <IconButton className="school-act-icon-button" id="notify-btn">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>

        <Box className="school-act-header-row" id="school-act-breadcrumb">
          {!isMobile && (
            <Breadcrumb
              crumbs={[
                {
                  label: t("Schools"),
                  onClick: () =>
                    history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
                },
                {
                  label: activityData.schoolName,
                  onClick: () => history.goBack(),
                },
                {
                  label: t("Interactions"),
                  onClick: () => history.goBack(),
                },
                {
                  label: activityData.date,
                },
              ]}
            />
          )}

          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={() => setIsFilterOpen(true)}
            onClearFilters={handleCancelFilters}
          />
        </Box>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
        />

        <FilterSlider
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          filterConfigs={filterConfigs}
        />
      </Box>

      <div className="school-act-table-container" id="school-act-table">
        {!loadingData && activities.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography>{t("No activities found.")}</Typography>
          </Box>
        ) : (
          <DataTableBody
            loading={loadingData}
            rows={activities}
            columns={columns}
            order={orderDir}
            orderBy={orderBy}
            onSort={handleSort}
            onRowClick={handleRowClick}
          />
        )}

         {selectedActivity && (
    <ActivityDetailsPanel
      activity={selectedActivity}
      onClose={() => setSelectedActivity(null)}
    />
  )}
      </div>

      {activities.length > 0 && (
        <div className="school-act-footer" id="school-act-footer">
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={(v) => setPage(v)}
          />
        </div>
      )}
    </div>
  );
};

export default SchoolActivities;
