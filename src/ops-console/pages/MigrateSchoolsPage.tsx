import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Tab, Tabs, Typography } from "@mui/material";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PROGRAM_TAB } from "../../common/constants";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import { BsFillBellFill } from "react-icons/bs";
import "./MigrateSchoolsPage.css";

type Filters = Record<string, string[]>;
type MigrationTab = "migrate" | "migrated";

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS: Filters = {
  program: [],
  programType: [],
  state: [],
  district: [],
  cluster: [],
  block: [],
};

const filterConfigsForSchool = [
  { key: "program", label: t("Select Program") },
  { key: "programType", label: t("Select Program Type") },
  { key: "state", label: t("Select State") },
  { key: "district", label: t("Select District") },
  { key: "cluster", label: t("Select Cluster") },
  { key: "block", label: t("Select Block") },
];

const MigrateSchoolsPage: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const [activeTab, setActiveTab] = useState<MigrationTab>("migrate");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);

  const isLoading = isFilterLoading || isDataLoading;

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions({
            program: data.program || data.partner || [],
            programType: data.programType || [],
            state: data.state || [],
            district: data.district || [],
            cluster: data.cluster || [],
            block: data.block || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchFilterOptions();
  }, [api]);

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const modelFilter =
        activeTab === "migrate"
          ? [PROGRAM_TAB.AT_HOME, PROGRAM_TAB.HYBRID]
          : [PROGRAM_TAB.AT_SCHOOL];

      const { program = [], ...remainingFilters } = filters;
      const cleanedFilters = Object.fromEntries(
        Object.entries({
          ...remainingFilters,
          partner: program,
          model: modelFilter,
        }).filter(
          ([, value]) => Array.isArray(value) && value.length > 0,
        ),
      );

      let backendOrderBy = orderBy;
      if (backendOrderBy === "name") backendOrderBy = "school_name";
      if (backendOrderBy === "district") backendOrderBy = "district";

      const response = await api.getFilteredSchoolsForSchoolListing({
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
        name: {
          value: school.school_name || "--",
          render: (
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography className="migrate-schools-name">
                {school.school_name || "--"}
              </Typography>
              <Typography className="migrate-schools-subname">
                {school.udise_code || school.state
                  ? `${school.udise_code ?? ""} - ${school.state ?? ""}`.trim()
                  : "--"}
              </Typography>
            </Box>
          ),
        },
        programName: school.program_name || school.program || "--",
        programType:
          school.program_type ||
          school.programType ||
          (school.model === PROGRAM_TAB.AT_HOME
            ? "At-Home"
            : school.model === PROGRAM_TAB.AT_SCHOOL
              ? "At-School"
              : school.model === PROGRAM_TAB.HYBRID
                ? "Hybrid"
                : "--"),
        academicYear:
          school.academic_year || school.academicYear || "2024-2025",
        district: school.district || "--",
        cluster: school.cluster || "--",
        block: school.block || "--",
      }));

      setRows(formatted);
    } catch (error) {
      console.error("Failed to fetch migrate schools list", error);
      setRows([]);
      setTotal(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeTab, api, filters, orderBy, orderDir, page, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedSchoolIds([]);
  }, [activeTab, filters, searchTerm, page]);

  const columns: Column<Record<string, any>>[] = useMemo(
    () => [
      {
        key: "name",
        label: t("School Name"),
        width: "24%",
        sortable: false,
      },
      {
        key: "programName",
        label: t("Program Name"),
        width: "16%",
        sortable: false,
      },
      {
        key: "programType",
        label: t("Program Type"),
        width: "14%",
        sortable: false,
      },
      {
        key: "academicYear",
        label: t("Academic Year"),
        width: "13%",
        sortable: false,
      },
      {
        key: "district",
        label: t("District"),
        width: "12%",
        sortable: false,
      },
      {
        key: "cluster",
        label: t("Cluster"),
        width: "11%",
        sortable: false,
      },
      {
        key: "block",
        label: t("Block"),
        width: "10%",
        sortable: false,
      },
    ],
    [],
  );

  const handleSort = (columnKey: string) => {
    const sortableKeys = ["name", "district"];
    if (!sortableKeys.includes(columnKey)) return;

    if (orderBy === columnKey) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(columnKey);
      setOrderDir("asc");
    }
    setPage(1);
  };

  const handleToggleSchoolSelection = (schoolId: string | number) => {
    const id = String(schoolId);
    setSelectedSchoolIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllVisible = (checked: boolean, visibleRows: any[]) => {
    const visibleIds = visibleRows
      .map((row) => String(row.sch_id || row.id))
      .filter(Boolean);

    setSelectedSchoolIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      return prev.filter((id) => !visibleIds.includes(id));
    });
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setTempFilters(INITIAL_FILTERS);
    setPage(1);
    setIsFilterOpen(false);
  };

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const isSelectionActionVisible =
    activeTab === "migrate" && selectedSchoolIds.length > 0;

  return (
    <div className="migrate-schools-page">
      <div className="migrate-schools-header">
        <div className="migrate-schools-title-row">
          <h1 className="migrate-schools-title">{t("Migrate Schools")}</h1>
          <IconButton className="migrate-schools-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>

        <div className="migrate-schools-controls-row">
          <Tabs
            value={activeTab}
            onChange={(_, value) => {
              setActiveTab(value as MigrationTab);
              setPage(1);
            }}
            className="migrate-schools-tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label={t("Migrate")}
              value="migrate"
              className="migrate-schools-tab"
            />
            <Tab
              label={t("Migrated")}
              value="migrated"
              className="migrate-schools-tab"
            />
          </Tabs>

          <div className="migrate-schools-top-right">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              filters={filters}
              onFilterClick={() => setIsFilterOpen(true)}
              onClearFilters={handleClearFilters}
              isFilter
              filterIconSrc="assets/icons/filterIcon.svg"
            />
          </div>
        </div>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={(key, value) => {
            setFilters((prev) => {
              const updated = {
                ...prev,
                [key]: prev[key].filter((item) => item !== value),
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
          onCancel={handleClearFilters}
          autocompleteStyles={{}}
          filterConfigs={filterConfigsForSchool}
        />
      </div>

      <div className="migrate-schools-table-wrap">
        {!isLoading && rows.length > 0 && (
          <DataTableBody
            columns={columns}
            rows={rows}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={isLoading}
            selectableRows
            selectedRowIds={selectedSchoolIds}
            onToggleRowSelection={handleToggleSchoolSelection}
            onToggleSelectAll={handleSelectAllVisible}
            getRowId={(row) => String(row.sch_id || row.id)}
            disableRowNavigation
          />
        )}

        {!isLoading && rows.length === 0 && (
          <div className="migrate-schools-empty">{t("No schools found.")}</div>
        )}
      </div>

      {!isLoading && rows.length > 0 && (
        <div
          className={`migrate-schools-footer${
            isSelectionActionVisible ? " migrate-schools-footer-with-action" : ""
          }`}
        >
          <div className="migrate-schools-footer-pagination">
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(value) => setPage(value)}
            />
          </div>

          {isSelectionActionVisible && (
            <div className="migrate-schools-footer-action">
              <span className="migrate-schools-selected-count">
                ({selectedSchoolIds.length}) {t("Schools Selected")}
              </span>
              <Button
                variant="contained"
                className="migrate-schools-action-button"
              >
                {t("Migrate")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrateSchoolsPage;
