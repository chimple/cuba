import React, { useEffect, useState, useMemo } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PROGRAM_TAB, PROGRAM_TAB_LABELS } from "../../common/constants";
import "./SchoolList.css";
import DataTablePagination from "../components/DataTablePagination";
import { IonPage } from "@ionic/react";
import DataTableBody, { Column } from "../components/DataTableBody";
import Loading from "../../components/Loading";
import { t } from "i18next";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import FileUpload from "../components/FileUpload";
import UploadButton from "../components/UploadButton";
import { useDataTableLogic } from "../OpsUtility/useDataTableLogic";

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

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const [selectedTab, setSelectedTab] = useState(PROGRAM_TAB.ALL);

  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showUploadPage, setShowUploadPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTab, filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const tabModelFilter = { model: [selectedTab] };
      const cleanedFilters = Object.fromEntries(
        Object.entries({ ...filters, ...tabModelFilter }).filter(
          ([_, v]) => Array.isArray(v) && v.length > 0
        )
      );

      const filteredSchools =
        await api.getFilteredSchoolsForSchoolListing(cleanedFilters);
      const enrichedSchools = filteredSchools.map((school: any) => ({
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
                {school.group2 || ""}
              </Typography>
            </Box>
          ),
        },
      }));

      setSchools(enrichedSchools);
      setPage(1);
    } catch (error) {
      console.error("Failed to fetch filtered schools:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<Record<string, any>>[] = [
    { key: "name", label: t("Schools") },
    { key: "students", label: t("No of Students") },
    { key: "teachers", label: t("No of Teachers") },
    { key: "programManagers", label: t("Program Manager") },
    { key: "fieldCoordinators", label: t("Field Coordinator") },
  ];

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

  const filteredSchools = useMemo(() => {
    return schools.filter((school) =>
      school.name.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const {
    orderBy,
    order,
    page,
    pageCount,
    setPage,
    handleSort,
    paginatedRows,
  } = useDataTableLogic(filteredSchools);

  function onCancleClick(): void {
    setShowUploadPage(false);
  }
  if (showUploadPage) {
    return (
      <div>
        <div className="school-list-upload-text"> {t("Upload File")}</div>
        <div>
          <FileUpload onCancleClick={onCancleClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="school-list-ion-page">
      <div className="school-list-main-container">
        <div className="school-list-header">
          <div className="school-heading">{t("Schools")}</div>
          <div className="school-list-container">
            <div>
              <Tabs
                value={selectedTab}
                onChange={(e, val) => {
                  setPage(1);
                  setSelectedTab(val);
                }}
                indicatorColor="primary"
                textColor="primary"
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
            <div className="school-list-filter-container-2">
              <div className="school-list-file-upload-conatainer">
                <UploadButton
                  onClick={() => {
                    setShowUploadPage(true);
                  }}
                />
              </div>
              <div>
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={(e) => setSearchTerm(e.target.value)}
                  filters={filters}
                  onFilterClick={() => setIsFilterOpen(true)}
                />
              </div>
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

              <Box className="selected-filters-container">
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
              </Box>
            </div>
          </div>
        </div>
        {isLoading ? (
          <Loading isLoading={true} />
        ) : filteredSchools.length === 0 ? (
          <Typography align="center" sx={{ mt: 4 }}>
            {t("No schools found.")}
          </Typography>
        ) : (
          <>
            <DataTableBody
              columns={columns}
              rows={paginatedRows}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
            <div className="school-list-footer">
              <DataTablePagination
                pageCount={pageCount}
                page={page}
                onPageChange={(val) => setPage(val)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
