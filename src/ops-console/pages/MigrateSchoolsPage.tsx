import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PROGRAM_TAB } from "../../common/constants";
import { useHistory, useLocation } from "react-router";
import DataTableBody, { Column } from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import CommonPopup from "../components/CommonPopup";
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

const FILTER_KEYS = [
  "program",
  "programType",
  "state",
  "district",
  "cluster",
  "block",
] as const;

const parseJSONParam = <T,>(param: string | null, fallback: T): T => {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeFiltersFromQuery = (value: unknown): Filters => {
  if (!value || typeof value !== "object") return INITIAL_FILTERS;
  const source = value as Record<string, unknown>;
  return FILTER_KEYS.reduce<Filters>((acc, key) => {
    acc[key] = Array.isArray(source[key])
      ? (source[key] as unknown[]).filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];
    return acc;
  }, { ...INITIAL_FILTERS });
};

const MigrateSchoolsPage: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState<MigrationTab>(() => {
    const tab = qs.get("tab");
    return tab === "migrated" ? "migrated" : "migrate";
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get("search") || "");
  const initialFilters = useMemo(
    () =>
      normalizeFiltersFromQuery(
        parseJSONParam<Record<string, unknown> | null>(
          qs.get("filters"),
          INITIAL_FILTERS,
        ),
      ),
    [],
  );
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const parsed = Number(qs.get("page"));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [orderBy, setOrderBy] = useState(() => qs.get("orderBy") || "");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">(() => {
    const direction = qs.get("orderDir");
    return direction === "desc" ? "desc" : "asc";
  });
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);

  const isLoading = isFilterLoading || isDataLoading;
  const currentAcademicYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return `${currentYear - 1}-${String(currentYear).slice(-2)}`;
  }, []);
  const academicYears = useMemo(() => [currentAcademicYear], [currentAcademicYear]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "migrate") params.set("tab", activeTab);
    if (searchTerm.trim()) params.set("search", searchTerm);
    if (page !== 1) params.set("page", String(page));
    if (orderBy) params.set("orderBy", orderBy);
    if (orderDir !== "asc") params.set("orderDir", orderDir);

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => Array.isArray(value) && value.length > 0,
      ),
    );
    if (Object.keys(cleanedFilters).length > 0) {
      params.set("filters", JSON.stringify(cleanedFilters));
    }

    history.replace({ search: params.toString() });
  }, [activeTab, searchTerm, page, orderBy, orderDir, filters, history]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions((prev) => ({
            program:
              Array.isArray(data.program) && data.program.length > 0
                ? data.program
                : prev.program || [],
            programType: data.programType || [],
            state: data.state || [],
            district: data.district || [],
            cluster: data.cluster || [],
            block: data.block || [],
          }));
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
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => Array.isArray(value) && value.length > 0,
        ),
      );

      let backendOrderBy = orderBy;
      if (backendOrderBy === "name") backendOrderBy = "school_name";
      if (backendOrderBy === "district") backendOrderBy = "district";
      if (backendOrderBy === "academicYear") backendOrderBy = "academic_year";

      const normalizeAcademicYear = (value: any): string => {
        if (Array.isArray(value)) {
          const years = value
            .map((item) => String(item ?? "").trim())
            .filter((item) => item.length > 0);
          return years.join(", ");
        }

        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return "";

          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                return parsed
                  .map((item) => String(item ?? "").trim())
                  .filter((item) => item.length > 0)
                  .join(", ");
              }
            } catch (_err) {
              return trimmed;
            }
          }

          return trimmed;
        }

        return "";
      };

      const normalizeProgramModel = (value: any): string => {
        const toLabel = (model: string): string => {
          const normalized = model.trim().toLowerCase();
          if (normalized === "at_home") return "At-Home";
          if (normalized === "at_school") return "At-School";
          if (normalized === "hybrid") return "Hybrid";
          return model;
        };

        if (Array.isArray(value)) {
          const models = value
            .map((item) => String(item ?? "").trim())
            .filter((item) => item.length > 0)
            .map(toLabel);
          return models.join(", ");
        }

        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return "";

          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                return parsed
                  .map((item) => String(item ?? "").trim())
                  .filter((item) => item.length > 0)
                  .map(toLabel)
                  .join(", ");
              }
            } catch (_err) {
              return toLabel(trimmed);
            }
          }

          return toLabel(trimmed);
        }

        return "";
      };

      if (activeTab === "migrate") {
        const response = await api.getSchoolsWithProgramAccess({
          academicYears,
          filters: cleanedFilters,
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          orderBy: backendOrderBy || undefined,
          orderDir,
          search: searchTerm,
        });

        const data = response?.data || [];
        setTotal(response?.total || 0);
        const fetchedProgramNames = Array.from(
          new Set(
            data
              .map((item: any) => item?.program?.name)
              .filter(
                (value: unknown): value is string =>
                  typeof value === "string" && value.trim().length > 0,
              ),
          ),
        );
        if (fetchedProgramNames.length > 0) {
          setFilterOptions((prev) => ({
            ...prev,
            program: Array.from(
              new Set([...(prev.program || []), ...fetchedProgramNames]),
            ),
          }));
        }

        const formatted = data.map((row: any, index: number) => {
          const school =
            row?.school && typeof row.school === "object" ? row.school : {};
          const program =
            row?.program && typeof row.program === "object" ? row.program : {};
          const schoolName = school.school_name || school.name || "--";
          const schoolUdise = school.udise_code || school.udise || "--";
          const schoolState = school.state || school.group1 || "--";
          const schoolDistrict = school.district || school.group2 || "--";
          const schoolBlock = school.block || school.group3 || "--";
          const schoolCluster = school.cluster || school.group4 || "--";
          const resolvedAcademicYear =
            normalizeAcademicYear(
              school.academic_year ?? program.academic_year ?? school.academicYear,
            ) ||
            academicYears[0] ||
            "";
          const resolvedId =
            school.sch_id ||
            school.id ||
            school.school_id ||
            program.school_id ||
            `school-${index}`;

          return {
            ...school,
            id: resolvedId,
            sch_id: resolvedId,
            program_users: Array.isArray(row?.program_users)
              ? row.program_users
              : [],
            name: {
              value: schoolName,
              render: (
                <Box display="flex" flexDirection="column" alignItems="flex-start">
                  <Typography className="migrate-schools-name">
                    {schoolName}
                  </Typography>
                  <Typography className="migrate-schools-subname">
                    {schoolUdise || schoolState
                      ? `${schoolUdise ?? ""} - ${schoolState ?? ""}`.trim()
                      : "--"}
                  </Typography>
                </Box>
              ),
            },
            programName:
              program.program_name ||
              program.name ||
              school.program_name ||
              school.program ||
              "--",
            programModel:
              normalizeProgramModel(program.model ?? school.model) || "--",
            academicYear: resolvedAcademicYear,
            district: schoolDistrict,
            cluster: schoolCluster,
            block: schoolBlock,
          };
        });

        setRows(formatted);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Failed to fetch migrate schools list", error);
      setRows([]);
      setTotal(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [academicYears, activeTab, api, filters, orderBy, orderDir, page, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedSchoolIds([]);
  }, [activeTab, academicYears]);

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
        key: "programModel",
        label: t("Program Model"),
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
    const sortableKeys = ["name", "academicYear", "district"];
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

  const handleOpenMigrateDialog = () => {
    if (selectedSchoolIds.length === 0) return;
    setIsMigrateDialogOpen(true);
  };

  const handleCloseMigrateDialog = () => {
    setIsMigrateDialogOpen(false);
  };

  const handleCloseSuccessPopup = useCallback(() => {
    setIsSuccessPopupOpen(false);
    setActiveTab("migrated");
    setPage(1);
  }, []);

  const handleConfirmMigrate = () => {
    setIsMigrateDialogOpen(false);
    setIsSuccessPopupOpen(true);
  };

  useEffect(() => {
    if (!isSuccessPopupOpen) return;

    const timeoutId = window.setTimeout(() => {
      handleCloseSuccessPopup();
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSuccessPopupOpen, handleCloseSuccessPopup]);

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const isSelectionActionVisible =
    activeTab === "migrate" && selectedSchoolIds.length > 0;

  return (
    <div  id="migrate-schools-page" className="migrate-schools-page">
      <div id="migrate-schools-header" className="migrate-schools-header">
        <div id="migrate-schools-title-row" className="migrate-schools-title-row">
          <h1 id="migrate-schools-title" className="migrate-schools-title">{t("Migrate Schools")}</h1>
          <IconButton className="migrate-schools-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>

        <div id="migrate-schools-controls-row" className="migrate-schools-controls-row">
          <Tabs
            value={activeTab}
            onChange={(_, value) => {
              setActiveTab(value as MigrationTab);
              setPage(1);
            }}
            id="migrate-schools-tabs"
            className="migrate-schools-tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label={t("Migrate")}
              value="migrate"
              id="migrate-schools-migrate-tab"
              className="migrate-schools-tab"
            />
            <Tab
              label={t("Migrated")}
              value="migrated"
              id="migrate-schools-migrated-tab"
              className="migrate-schools-tab"
            />
          </Tabs>

          <div id="migrate-schools-top-right" className="migrate-schools-top-right">
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

      <div id="migrate-schools-table-wrap" className="migrate-schools-table-wrap">
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
          <div id="migrate-schools-empty" className="migrate-schools-empty">{t("No schools found.")}</div>
        )}
      </div>

      {!isLoading && rows.length > 0 && (
        <div
          id="migrate-schools-footer"
          className={`migrate-schools-footer${
            isSelectionActionVisible ? " migrate-schools-footer-with-action" : ""
          }`}
        >
          <div id="migrate-schools-footer-pagination" className="migrate-schools-footer-pagination">
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(value) => setPage(value)}
            />
          </div>

          {isSelectionActionVisible && (
            <div id="migrate-schools-footer-action" className="migrate-schools-footer-action">
              <span id="migrate-schools-selected-count" className="migrate-schools-selected-count">
                <span id="migrate-schools-selected-count-number" className="migrate-schools-selected-count-number">
                  ({selectedSchoolIds.length})
                </span>{" "}
                {t("Schools Selected")}
              </span>
              <Button
                variant="contained"
                id="migrate-schools-migrate-button"
                className="migrate-schools-action-button"
                onClick={handleOpenMigrateDialog}
              >
                {t("Migrate")}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isMigrateDialogOpen}
        onClose={handleCloseMigrateDialog}
        id="migrate-schools-confirm-dialog"
        className="migrate-schools-confirm-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogContent id="migrate-schools-confirm-content" className="migrate-schools-confirm-content">
          <Typography id="migrate-schools-confirm-text" className="migrate-schools-confirm-text">
            {t(
              "Are you sure you want to migrate the selected {{count}} schools to the next academic year?",
              { count: selectedSchoolIds.length },
            )}
          </Typography>

          <div id="migrate-schools-confirm-warning" className="migrate-schools-confirm-warning">
            {t("This cannot be reversed. Please be certain.")}
          </div>

          <div id="migrate-schools-confirm-actions" className="migrate-schools-confirm-actions">
            <Button
              variant="text"
              id="migrate-schools-cancel-button"
              className="migrate-schools-confirm-cancel"
              onClick={handleCloseMigrateDialog}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="contained"
              id="migrate-schools-confirm-button"
              className="migrate-schools-confirm-migrate"
              onClick={handleConfirmMigrate}
            >
              {t("Migrate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CommonPopup
        open={isSuccessPopupOpen}
        onClose={handleCloseSuccessPopup}
        icon={
          <img
            src="assets/icons/migratesuccess.svg"
            alt={String(t("Migration success"))}
            id="migrate-schools-success-icon"
            className="migrate-schools-success-icon"
          />
        }
        title={t("Successfully Migrated")}
        subtitle={t(
          "Selected {{count}} schools have migrated to the next academic year.",
          { count: selectedSchoolIds.length },
        )}
      />
    </div>
  );
};

export default MigrateSchoolsPage;
