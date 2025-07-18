import React, { useEffect, useMemo, useState } from "react";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import { useDataTableLogic } from "../OpsUtility/useDataTableLogic";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import "./ProgramConnectedSchoolPageOps.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Breadcrumb from "../components/Breadcrumb";
import SearchAndFilter from "../components/SearchAndFilter";

interface ProgramConnectedSchoolPageProps {
  id: string;
}
const DEFAULT_PAGE_SIZE = 8;

const ProgramConnectedSchoolPage: React.FC<ProgramConnectedSchoolPageProps> = ({
  id,
}) => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [programName, setProgramName] = useState("");
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [total, setTotal] = useState(0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const onFilterClick = () => {
    return;
  };

  const fetchSchools = async () => {
    setLoadingData(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => Array.isArray(v) && v.length > 0
        )
      );

      const programData = await api.getProgramData(id);
      const name =
        programData?.programDetails?.find((d) => d.label === "Program Name")
          ?.value ?? "";
      setProgramName(name);

      let backendOrderBy = orderBy;
      if (backendOrderBy === "name") backendOrderBy = "school_name";
      if (backendOrderBy === "students") backendOrderBy = "num_students";
      if (backendOrderBy === "teachers") backendOrderBy = "num_teachers";

      const response = await api.getFilteredSchoolsForSchoolListing({
        programId: id,
        filters: cleanedFilters,
        page,
        page_size: DEFAULT_PAGE_SIZE,
        order_by: backendOrderBy,
        order_dir: orderDir,
        search: searchTerm,
      });

      const data = response?.data || [];
      setTotal(response?.total || 0);

      const formatted = data.map((school: any) => ({
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
                {school.district || ""}
              </Typography>
            </Box>
          ),
        },
      }));

      setSchools(formatted);
    } catch (error) {
      console.error("Error loading schools:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [id, filters, searchTerm, orderBy, orderDir, page]);

  const filteredSchools = useMemo(() => {
    return schools.filter((school) =>
      school.name.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const columns: Column<Record<string, any>>[] = [
    {
      key: "name",
      label: t("Schools"),
      sortable: true,
      orderBy: "name",
    },
    {
      key: "students",
      label: t("No of Students"),
      sortable: true,
      orderBy: "students",
    },
    {
      key: "teachers",
      label: t("No of Teachers"),
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
    const sortableKeys = ["name", "students", "teachers"];
    if (!sortableKeys.includes(colKey)) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(colKey);
      setOrderDir("asc");
    }
    setPage(1);
  };

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return (
    <div className="ops-program-schools-page-container">
      <Box className="ops-program-schools-page-header">
        <Box className="ops-program-schools-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="ops-program-schools-title-mobile">
                {programName}
              </Typography>
              <IconButton className="ops-program-schools-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="ops-program-schools-title">
                {programName}
              </Typography>
              <IconButton className="ops-program-schools-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>

        <Box className="ops-program-schools-page-header-row">
          {!isMobile && (
            <div className="ops-program-schools-page-container-two">
              <Breadcrumb
                crumbs={[
                  {
                    label: t("Programs"),
                    onClick: () =>
                      history.push(
                        `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`
                      ),
                  },
                  { label: programName, onClick: () => history.goBack() },
                  { label: t("Schools") },
                ]}
              />
            </div>
          )}
          <div className="ops-program-schools-header-and-search-filter">
            <div className="ops-program-schools-button-and-search-filter">
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
        </Box>
      </Box>

      <div className="ops-program-schools-table-container">
        {!loadingData && filteredSchools.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography align="center">{t("No schools found.")}</Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={filteredSchools}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={loadingData}
          />
        )}
      </div>

      {!loadingData && filteredSchools.length > 0 && (
        <div className="ops-program-schools-list-footer">
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

export default ProgramConnectedSchoolPage;
