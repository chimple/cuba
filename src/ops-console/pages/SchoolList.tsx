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
import { PAGES, PROGRAM_TAB, PROGRAM_TAB_LABELS } from "../../common/constants";
import "./SchoolList.css";
import DataTablePagination from "../components/DataTablePagination";
import DataTableBody, { Column } from "../components/DataTableBody";
import { t } from "i18next";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import FileUpload from "../components/FileUpload";
import { FileUploadOutlined } from "@mui/icons-material";
import { BsFillBellFill } from "react-icons/bs";

const filterConfigsForSchool = [
  { key: "Partner", label: t("Select Partner") },
  { key: "Program Manager", label: t("Select Program Manager") },
  { key: "Field Coordinator", label: t("Select Field Coordinator") },
  { key: "Program Type", label: t("Select Program Type") },
  { key: "state", label: t("Select State") },
  { key: "district", label: t("Select District") },
  { key: "block", label: t("Select Block") },
  { key: "village", label: t("Select Village") },
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
  village: [],
};

const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(([value, label]) => ({
  label,
  value: value as PROGRAM_TAB,
}));

const DEFAULT_PAGE_SIZE = 8;

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const [selectedTab, setSelectedTab] = useState(PROGRAM_TAB.ALL);
  const [schools, setSchools] = useState<any[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isLoading = isFilterLoading || isDataLoading;

  const [showUploadPage, setShowUploadPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions({
            programType: data.program_type || [],
            partner: data.partner || [],
            programManager: data.program_manager || [],
            fieldCoordinator: data.field_coordinator || [],
            state: data.state || [],
            district: data.district || [],
            block: data.block || [],
            village: data.village || [],
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
                {school.district || ""}
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
      label: t("No of Students"),
      width: "fit-content",
      sortable: true,
      orderBy: "students",
    },
    {
      key: "teachers",
      label: t("No of Teachers"),
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
      setOrderDir("asc");
    }
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [filters, selectedTab, searchTerm]);

  function onCancleClick(): void {
    setShowUploadPage(false);
  }

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
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                filters={filters}
                onFilterClick={() => setIsFilterOpen(true)}
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
            }}
            onCancel={() => {
              const empty = {
                state: [],
                district: [],
                block: [],
                village: [],
                programType: [],
                partner: [],
                programManager: [],
                fieldCoordinator: [],
              };
              setTempFilters(empty);
              setFilters(empty);
              setIsFilterOpen(false);
            }}
            autocompleteStyles={{}}
            filterConfigs={filterConfigsForSchool}
          />
        </div>

        <div className="school-list-table-container">
          <DataTableBody
            columns={columns}
            rows={schools}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={isLoading}
          />
        </div>

        {!isLoading && schools.length === 0 && (
          <Typography align="center" sx={{ mt: 4 }}>
            {t("No schools found.")}
          </Typography>
        )}
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
