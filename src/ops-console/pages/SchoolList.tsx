import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  MODEL,
  SCHOOL_TABS,
  SchoolRoleMap,
  TableTypes,
} from "../../common/constants";
import "./SchoolList.css";
import DataTablePagination from "../components/DataTablePagination";
import { IonPage } from "@ionic/react";
import DataTableBody, { Column } from "../components/DataTableBody";
import Loading from "../../components/Loading";
import { t } from "i18next";

const SchoolList: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<SCHOOL_TABS>(SCHOOL_TABS.ALL);
  const [schools, setSchools] = useState<any[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 7;
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const authInstance = ServiceConfig.getI().authHandler;
  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const user = await authInstance.getCurrentUser();
      if (!user) return;

      let fetchedSchools: TableTypes<"school">[] = [];

      if (selectedTab === SCHOOL_TABS.ALL) {
        fetchedSchools = await api.getSchoolsForAdmin(
          rowsPerPage,
          (page - 1) * rowsPerPage
        );
      } else {
        const model =
          selectedTab === SCHOOL_TABS.AT_HOME ? MODEL.AT_HOME : MODEL.AT_SCHOOL;
        fetchedSchools = await api.getSchoolsByModel(
          model,
          rowsPerPage,
          (page - 1) * rowsPerPage
        );
      }
      if (fetchedSchools.length === rowsPerPage) {
        // Possibly more data, increase page count
        setPageCount((prev) => Math.max(prev, page + 1));
      } else {
        // Last page — set pageCount exactly to this one
        setPageCount(page);
      }
      const schoolIds = fetchedSchools.map((s) => s.id);

      const [teachers, students, pms, fcs] = await Promise.all([
        api.getTeachersForSchools(schoolIds),
        api.getStudentsForSchools(schoolIds),
        api.getProgramManagersForSchools(schoolIds),
        api.getFieldCoordinatorsForSchools(schoolIds),
      ]);

      const mapFromRoleData = (
        data: SchoolRoleMap[],
        type: "count" | "names"
      ) => {
        return data.reduce<Record<string, any>>((acc, item) => {
          if (type === "count") acc[item.schoolId] = item.users.length;
          if (type === "names")
            acc[item.schoolId] = item.users.map((u) => u.name).join(", ");
          return acc;
        }, {});
      };

      const teachersMap = mapFromRoleData(teachers, "count");
      const studentsMap = mapFromRoleData(students, "count");
      const programManagersMap = mapFromRoleData(pms, "names");
      const fieldCoordinatorsMap = mapFromRoleData(fcs, "names");

      const enrichedSchools = fetchedSchools.map((school) => ({
        ...school,
        students: studentsMap[school.id] || 0,
        teachers: teachersMap[school.id] || 0,
        programManagers: programManagersMap[school.id] || t("not assigned yet"),
        fieldCoordinators:
          fieldCoordinatorsMap[school.id] || t("not assigned yet"),
        name: {
          value: school.name,
          render: (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="subtitle2">{school.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {school.group2 || ""}
              </Typography>
            </Box>
          ),
        },
      }));

      setSchools(enrichedSchools);
      setIsLoading(false);
    };

    fetchData();
  }, [selectedTab, page]);

  const columns: Column<Record<string, any>>[] = [
    { key: "name", label: t("Schools") },
    { key: "students", label: t("No of Students") },
    { key: "teachers", label: t("No of Teachers") },
    { key: "programManagers", label: t("Program Manager") },
    { key: "fieldCoordinators", label: t("Field Coordinator") },
  ];

  return (
    <IonPage className="school-list-ion-page">
      <div className="school-container">
        <div className="school-list-header">
          <div className="school-heading">{t("Schools")}</div>

          <div className="tab-wrapper">
            <Tabs
              value={selectedTab}
              onChange={(e, val) => {
                setPage(1);
                setSelectedTab(val);
              }}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className="tabs-div"
            >
              <Tab
                label={SCHOOL_TABS.ALL}
                value={SCHOOL_TABS.ALL}
                className="school-list-tab"
              />
              <Tab
                label={SCHOOL_TABS.AT_SCHOOL}
                value={SCHOOL_TABS.AT_SCHOOL}
                className="school-list-tab"
              />
              <Tab
                label={SCHOOL_TABS.AT_HOME}
                value={SCHOOL_TABS.AT_HOME}
                className="school-list-tab"
              />
            </Tabs>
          </div>

          <div></div>
          <div></div>
        </div>

        {selectedTab === SCHOOL_TABS.ALL && (
          <>
            <DataTableBody
              columns={columns}
              rows={schools}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
            <div className="school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={(newPage) => {
                  if (newPage !== page) {
                    setPage(newPage);
                  }
                }}
              />
            </div>
          </>
        )}

        {selectedTab === SCHOOL_TABS.AT_SCHOOL && (
          <>
            <DataTableBody
              columns={columns}
              rows={schools}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
            <div className="school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={(newPage) => {
                  if (newPage !== page) {
                    setPage(newPage);
                  }
                }}
              />
            </div>
          </>
        )}

        {selectedTab === SCHOOL_TABS.AT_HOME && (
          <>
            <DataTableBody
              columns={columns}
              rows={schools}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
            <div className="school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={(newPage) => {
                  if (newPage !== page) {
                    setPage(newPage);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
      <Loading isLoading={isLoading} msg="" />
    </IonPage>
  );
};

export default SchoolList;
