import React, { useEffect, useState } from "react";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory, useLocation } from "react-router";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Breadcrumb from "../components/Breadcrumb";
import { t } from "i18next";
import { PAGES } from "../../common/constants";
import "./ActivitiesPage.css";
import SchoolNameHeaderComponent from "../components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import { OpsUtil } from "../OpsUtility/OpsUtil";

const DEFAULT_PAGE_SIZE = 10;

const ActivitiesPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const school: any = location.state;
  const api = ServiceConfig.getI().apiHandler;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingData, setLoadingData] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [orderBy, setOrderBy] = useState("date"); 
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingData(true);
      try {
        const activities = await api.getActivitiesBySchoolId(school.id);
        const grouped: Record<string, any> = {};

        for (const item of activities) {
          const date = OpsUtil.formatDateToDDMMMyyyy(item.created_at);
          
          if (!grouped[date]) {
            grouped[date] = {
              date,
              rawDate: item.created_at,
              visitType: "--",     
              distance: "--",      
              f2f: 0,
              calls: 0,
              issues: 0,
              checkIn: "--",
              checkOut: "--",
              activitiesList: [],
              visitDetails: null,
              visitId: null,
            };
          }
          grouped[date].activitiesList.push(item);

          if (item.contact_method === "call") grouped[date].calls += 1;
          else if (item.contact_method === "in_person") grouped[date].f2f += 1;

          if (item.tech_issues_reported) grouped[date].issues += 1;
        }
        for (const key in grouped) {
          const visitIds = new Set(
            grouped[key].activitiesList
              .map((act: any) => act.visit_id)
              .filter((id: any) => id !== null)
          );
          const visitIdsArray = Array.from(visitIds);
          console.log("Unique visit IDs for date", key, ":", visitIds);
          const visitDetailsList = await api.getSchoolVisitById(visitIdsArray as string[]);

          // 🔹 collect types
          const visitTypeSet = new Set<string>();

          // 🔹 min distance
          let minDistance: number = Infinity;

          for (const visit of visitDetailsList) {
            if (visit?.type) {
              visitTypeSet.add(visit.type);
            }
            if (typeof visit?.distance_from_school === "number"){
              minDistance = Math.min(minDistance, visit.distance_from_school);
            }
          }

          // ✅ CHECK-IN → 0th index
          if (visitDetailsList[0]?.check_in_at) {
            grouped[key].checkIn = OpsUtil.formatTimeToIST(
              visitDetailsList[0].check_in_at
            );
          } else {
            grouped[key].checkIn = "--";
          }

          // ✅ CHECK-OUT → last index
          let checkOutValue: string | null = null;

          for (let i = visitDetailsList.length - 1; i >= 0; i--) {
            const checkOutAt = visitDetailsList[i]?.check_out_at;
            if (checkOutAt) {
              checkOutValue = OpsUtil.formatTimeToIST(checkOutAt);
              break;
            }
          }
          grouped[key].checkOut = checkOutValue ?? "--";

          grouped[key].visitType =
            visitTypeSet.size > 0
              ? Array.from(visitTypeSet).join(", ")
              : "--";

          grouped[key].distance =
            minDistance !== Infinity
              ? `${minDistance} km`
              : "--";
        }

        const finalData = Object.values(grouped);
        setAllActivities(finalData);
        setTotal(finalData.length);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchActivities();
  }, [school, page]);

  useEffect(() => {
    if (!orderBy) return;

    const sorted = [...allActivities].sort((a, b) => {
      const valA = new Date(a.rawDate).getTime();
      const valB = new Date(b.rawDate).getTime();
      return orderDir === "asc" ? valA - valB : valB - valA;
    });

    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    const pagedData = sorted.slice(start, start + DEFAULT_PAGE_SIZE);

    setActivities(pagedData);
  }, [orderBy, orderDir, page, allActivities]);

  const columns: Column<Record<string, any>>[] = [
    {
      key: "date",
      label: t("Date"),
      sortable: true,
      orderBy: "date",
    },
    {
      key: "visitType",
      label: t("Visit Type"),
      sortable: false,
    },
    {
      key: "f2f",
      label: t("F2F- Discussions"),
      sortable: false,
    },
    {
      key: "calls",
      label: t("Calls Made"),
      sortable: false,
    },
    {
      key: "issues",
      label: t("Tech Issues"),
      sortable: false,
      render: (row: any) => (
    <Chip
      label={row.issues}
      size="small"
      sx={{
        backgroundColor: "#FFEDD4",
        color: "#CA3500",
        fontWeight: 500,
        padding: "0 6px",
      }}
    />
  ),
    },
    {
      key: "checkIn",
      label: t("Checked-In"),
      sortable: false,
    },
    {
      key: "checkOut",
      label: t("Checked-Out"),
      sortable: false,
    },
    {
      key: "distance",
      label: t("Distance"),
      sortable: false,
    },
  ];

  const handleSort = (colKey: string) => {
    if (colKey !== "date") return;

    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("asc");
    }

    setPage(1);
  };
  const handleRowClick = (id: string | number, row: any) => {
    const data = {
      schoolName:school.name,
      date: row.date,
      activities: row.activitiesList, 
      visitDetails: row.visitDetails || null,
    };

    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}${PAGES.SCHOOL_ACTIVITIES}`,
      data
    );
  };

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return (
    <div className="activities-container" id="act-container">
      <div className="activities-header">
        <SchoolNameHeaderComponent schoolName={"Interactions"} />
      </div>
      <div className="activities-secondary-header" id="act-breadcrumb">
        <Breadcrumb
          crumbs={[
            {
              label: t("Schools"),
              onClick: () =>
                history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
            },
            {
              label: school.name,
              onClick: () =>
                history.replace(
                  `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${school.id}`
                ),
            },
            {
              label: t("Interactions"),
            },
          ]}
        />
      </div>

      <div className="activities-table-container" id="act-table">
        {!loadingData && activities.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography align="center">{t("No activities found.")}</Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={activities}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={loadingData}
            onRowClick={handleRowClick}
          />
        )}
      </div>
      {!loadingData && activities.length > 0 && (
        <div className="activities-footer" id="act-footer">
          <DataTablePagination
            pageCount={pageCount}
            page={page}
            onPageChange={(val) => setPage(val)}
          />
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
