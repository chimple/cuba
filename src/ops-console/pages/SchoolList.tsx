import React, { useEffect, useState, useMemo } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  PROGRAM_TAB,
} from "../../common/constants";
import "./SchoolList.css";
import DataTablePagination from "../components/DataTablePagination";
import { IonPage } from "@ionic/react";
import DataTableBody, { Column } from "../components/DataTableBody";
import Loading from "../../components/Loading";
import { t } from "i18next";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";

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

const tabOptions = [
  { label: "All", value: PROGRAM_TAB.ALL },
  { label: "At School", value: PROGRAM_TAB.AT_SCHOOL },
  { label: "At Home", value: PROGRAM_TAB.AT_HOME },
  // { label: "Hybrid", value: PROGRAM_TAB.HYBRID },
];

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const [selectedTab, setSelectedTab] = useState(PROGRAM_TAB.ALL);
  const [page, setPage] = useState(1);
  const rowsPerPage = 7;

  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);

  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

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

      const filteredSchools = await api.getFilteredSchoolsForSchoolListing(cleanedFilters);
      const enrichedSchools = filteredSchools.map((school: any) => ({
        ...school,
        students: school.num_students || 0,
        teachers: school.num_teachers || 0,
        programManagers: school.program_managers?.join(", ") || t("not assigned yet"),
        fieldCoordinators: school.field_coordinators?.join(", ") || t("not assigned yet"),
        name: {
          value: school.school_name,
          render: (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="subtitle2">{school.school_name}</Typography>
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

  const filteredSchools = useMemo(() => {
    return schools.filter((school) =>
      school.name.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const paginatedSchools = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredSchools.slice(start, start + rowsPerPage);
  }, [filteredSchools, page, rowsPerPage]);

 return (
    <IonPage className="school-list-ion-page">
      <div className="school-container">
        <div className="school-list-header">
          <div className="school-heading">{t("Schools")}</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1 }}>
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
            <div style={{ minWidth: 280, maxWidth: 400 }}>
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                filters={filters}
                onFilterClick={() => setIsFilterOpen(true)}
              />
            </div>
          </div>
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
              rows={paginatedSchools}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
            />
            <div className="school-list-footer">
              <DataTablePagination
                pageCount={Math.ceil(filteredSchools.length / rowsPerPage)}
                page={page}
                onPageChange={(val) => setPage(val)}
              />
            </div>
          </>
        )}
      </div>
    </IonPage>
  );
};

export default SchoolList;