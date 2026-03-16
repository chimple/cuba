import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import { useHistory, useLocation } from 'react-router';
import { PROGRAM_TAB, PROGRAM_TAB_LABELS } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Column } from '../components/DataTableBody';
import logger from '../../utility/logger';

export type Filters = Record<string, string[]>;
export type MigrationTab = 'migrate' | 'migrated';
type RowData = Record<string, any>;

const DEFAULT_PAGE_SIZE = 20;

export const INITIAL_FILTERS: Filters = {
  program: [],
  programType: [],
  state: [],
  district: [],
  cluster: [],
  block: [],
};

export const FILTER_KEYS = [
  'program',
  'programType',
  'state',
  'district',
  'cluster',
  'block',
] as const;

export const parseJSONParam = <T>(param: string | null, fallback: T): T => {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const normalizeFiltersFromQuery = (value: unknown): Filters => {
  if (!value || typeof value !== 'object') return INITIAL_FILTERS;
  const source = value as Record<string, unknown>;
  return FILTER_KEYS.reduce<Filters>(
    (acc, key) => {
      acc[key] = Array.isArray(source[key])
        ? (source[key] as unknown[]).filter(
            (item): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          )
        : [];
      return acc;
    },
    { ...INITIAL_FILTERS },
  );
};

export const normalizeAcademicYear = (value: any): string => {
  if (Array.isArray(value)) {
    const years = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
    return years.join(', ');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0)
            .join(', ');
        }
      } catch (_err) {
        return trimmed;
      }
    }

    return trimmed;
  }

  return '';
};

const normalizeLatestAcademicYear = (value: any): string => {
  if (Array.isArray(value)) {
    const years = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
    return years.at(-1) || '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const years = parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0);
          return years.at(-1) || '';
        }
      } catch (_err) {
        return trimmed;
      }
    }

    return trimmed;
  }

  return '';
};

export const normalizeProgramModel = (value: any): string => {
  const toLabel = (model: string): string => {
    const normalized = model.trim().toLowerCase();
    if (normalized === PROGRAM_TAB.AT_HOME) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.AT_HOME].replace(/\s+/g, '-');
    }
    if (normalized === PROGRAM_TAB.AT_SCHOOL) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.AT_SCHOOL].replace(/\s+/g, '-');
    }
    if (normalized === PROGRAM_TAB.HYBRID) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.HYBRID];
    }
    return model;
  };

  if (Array.isArray(value)) {
    const models = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0)
      .map(toLabel);
    return models.join(', ');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0)
            .map(toLabel)
            .join(', ');
        }
      } catch (_err) {
        return toLabel(trimmed);
      }
    }

    return toLabel(trimmed);
  }

  return '';
};

type MigratedMetricKey =
  | 'ukg_student_count'
  | 'class_2_student_count'
  | 'class_3_student_count'
  | 'class_4_student_count'
  | 'class_5_student_count';
type MigratedMetricValue = number | null | undefined;
type MigratedMetricSource = Partial<
  Record<MigratedMetricKey, MigratedMetricValue>
>;

const normalizeMigratedMetricValue = (
  value: MigratedMetricValue,
): string | number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  return 'NA';
};

const resolveMigratedMetricValue = (
  row: MigratedMetricSource,
  school: MigratedMetricSource,
  program: MigratedMetricSource,
  migrationMetrics: MigratedMetricSource,
  candidateKeys: readonly MigratedMetricKey[],
): string | number => {
  const sources = [migrationMetrics, row, school, program];

  for (const source of sources) {
    for (const key of candidateKeys) {
      if (source && Object.prototype.hasOwnProperty.call(source, key)) {
        return normalizeMigratedMetricValue(source[key]);
      }
    }
  }

  return 'NA';
};

export const buildNameCell = (
  schoolName: string,
  schoolUdise: string,
  schoolState: string,
) => {
  const subtitle =
    schoolUdise || schoolState
      ? `${schoolUdise ?? ''} - ${schoolState ?? ''}`.trim()
      : '--';

  return {
    value: schoolName,
    render: React.createElement(
      Box,
      {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      React.createElement(
        Typography,
        { className: 'migrate-schools-name' },
        schoolName,
      ),
      React.createElement(
        Typography,
        { className: 'migrate-schools-subname' },
        subtitle,
      ),
    ),
  };
};

export const useMigrateSchoolsPageLogic = () => {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState<MigrationTab>(() => {
    const tab = qs.get('tab');
    return tab === 'migrated' ? 'migrated' : 'migrate';
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const initialFilters = useMemo(
    () =>
      normalizeFiltersFromQuery(
        parseJSONParam<Record<string, unknown> | null>(
          qs.get('filters'),
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
  const [rows, setRows] = useState<RowData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const parsed = Number(qs.get('page'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [orderBy, setOrderBy] = useState(() => qs.get('orderBy') || '');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>(() => {
    const direction = qs.get('orderDir');
    return direction === 'desc' ? 'desc' : 'asc';
  });
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isFailurePopupOpen, setIsFailurePopupOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const isLoading = isFilterLoading || isDataLoading;
  const currentAcademicYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return `${currentYear - 1}-${String(currentYear).slice(-2)}`;
  }, []);
  const migratedAcademicYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${String(currentYear + 1).slice(-2)}`;
  }, []);
  const academicYears = useMemo(
    () => [currentAcademicYear],
    [currentAcademicYear],
  );
  const migratedAcademicYears = useMemo(
    () => [migratedAcademicYear],
    [migratedAcademicYear],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'migrate') params.set('tab', activeTab);
    if (searchTerm.trim()) params.set('search', searchTerm);
    if (page !== 1) params.set('page', String(page));
    if (orderBy) params.set('orderBy', orderBy);
    if (orderDir !== 'asc') params.set('orderDir', orderDir);

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => Array.isArray(value) && value.length > 0,
      ),
    );
    if (Object.keys(cleanedFilters).length > 0) {
      params.set('filters', JSON.stringify(cleanedFilters));
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
        logger.error('Failed to fetch filter options', error);
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
      if (backendOrderBy === 'name') backendOrderBy = 'school_name';
      if (backendOrderBy === 'district') backendOrderBy = 'district';
      if (backendOrderBy === 'academicYear') backendOrderBy = 'academic_year';

      const requestedAcademicYears =
        activeTab === 'migrated' ? migratedAcademicYears : academicYears;
      const response = await api.getSchoolsWithProgramAccess({
        academicYears: requestedAcademicYears,
        filters: cleanedFilters,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        orderBy: backendOrderBy || undefined,
        orderDir,
        search: searchTerm,
        includeMigratedCounts: activeTab === 'migrated',
      });

      const data = response?.data || [];
      setTotal(response?.total || 0);
      const fetchedProgramNames = Array.from(
        new Set(
          data
            .map((item: any) => item?.program?.name)
            .filter(
              (value: unknown): value is string =>
                typeof value === 'string' && value.trim().length > 0,
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
          row?.school && typeof row.school === 'object' ? row.school : {};
        const program =
          row?.program && typeof row.program === 'object' ? row.program : {};
        const migrationMetrics =
          row?.migration_metrics && typeof row.migration_metrics === 'object'
            ? row.migration_metrics
            : {};
        const schoolName = school.school_name || school.name || '--';
        const schoolUdise = school.udise_code || school.udise || '--';
        const schoolState = school.state || school.group1 || '--';
        const schoolDistrict = school.district || school.group2 || '--';
        const schoolBlock = school.block || school.group3 || '--';
        const schoolCluster = school.cluster || school.group4 || '--';
        const resolvedAcademicYear =
          activeTab === 'migrated'
            ? normalizeLatestAcademicYear(
                school.academic_year ?? school.academicYear,
              ) || ''
            : normalizeLatestAcademicYear(
                school.academic_year ?? school.academicYear,
              ) || '';
        const resolvedId =
          school.sch_id ||
          school.id ||
          school.school_id ||
          program.school_id ||
          `school-${index}`;
        const ukg = resolveMigratedMetricValue(
          row,
          school,
          program,
          migrationMetrics,
          ['ukg_student_count'],
        );
        const class2 = resolveMigratedMetricValue(
          row,
          school,
          program,
          migrationMetrics,
          ['class_2_student_count'],
        );
        const class3 = resolveMigratedMetricValue(
          row,
          school,
          program,
          migrationMetrics,
          ['class_3_student_count'],
        );
        const class4 = resolveMigratedMetricValue(
          row,
          school,
          program,
          migrationMetrics,
          ['class_4_student_count'],
        );
        const class5 = resolveMigratedMetricValue(
          row,
          school,
          program,
          migrationMetrics,
          ['class_5_student_count'],
        );

        return {
          ...school,
          id: resolvedId,
          sch_id: resolvedId,
          program_users: Array.isArray(row?.program_users)
            ? row.program_users
            : [],
          name: buildNameCell(schoolName, schoolUdise, schoolState),
          programName:
            program.program_name ||
            program.name ||
            school.program_name ||
            school.program ||
            '--',
          programModel:
            normalizeProgramModel(program.model ?? school.model) || '--',
          academicYear: resolvedAcademicYear,
          district: schoolDistrict,
          cluster: schoolCluster,
          block: schoolBlock,
          ukg,
          class2,
          class3,
          class4,
          class5,
        };
      });

      setRows(formatted);
    } catch (error) {
      logger.error('Failed to fetch migrate schools list', error);
      setRows([]);
      setTotal(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [
    academicYears,
    activeTab,
    api,
    filters,
    migratedAcademicYears,
    orderBy,
    orderDir,
    page,
    searchTerm,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedSchoolIds([]);
  }, [activeTab, academicYears, migratedAcademicYears]);

  const columns: Column<Record<string, any>>[] = useMemo(
    () =>
      activeTab === 'migrated'
        ? [
            {
              key: 'name',
              label: t('School Name'),
              width: '24%',
              sortable: false,
            },
            {
              key: 'programName',
              label: t('Program Name'),
              width: '16%',
              sortable: false,
            },
            {
              key: 'programModel',
              label: t('Program Model'),
              width: '14%',
              sortable: false,
            },
            {
              key: 'academicYear',
              label: t('Academic Year'),
              width: '13%',
              sortable: false,
            },
            {
              key: 'ukg',
              label: t('UKG'),
              width: '8%',
              sortable: false,
            },
            {
              key: 'class2',
              label: t('Class 2'),
              width: '8%',
              sortable: false,
            },
            {
              key: 'class3',
              label: t('Class 3'),
              width: '8%',
              sortable: false,
            },
            {
              key: 'class4',
              label: t('Class 4'),
              width: '8%',
              sortable: false,
            },
            {
              key: 'class5',
              label: t('Class 5'),
              width: '8%',
              sortable: false,
            },
          ]
        : [
            {
              key: 'name',
              label: t('School Name'),
              width: '24%',
              sortable: false,
            },
            {
              key: 'programName',
              label: t('Program Name'),
              width: '16%',
              sortable: false,
            },
            {
              key: 'programModel',
              label: t('Program Model'),
              width: '14%',
              sortable: false,
            },
            {
              key: 'academicYear',
              label: t('Academic Year'),
              width: '13%',
              sortable: false,
            },
            {
              key: 'district',
              label: t('District'),
              width: '12%',
              sortable: false,
            },
            {
              key: 'cluster',
              label: t('Cluster'),
              width: '11%',
              sortable: false,
            },
            {
              key: 'block',
              label: t('Block'),
              width: '10%',
              sortable: false,
            },
          ],
    [activeTab],
  );

  const filterConfigsForSchool = useMemo(
    () => [
      { key: 'program', label: t('Select Program') },
      { key: 'programType', label: t('Select Program Type') },
      { key: 'state', label: t('Select State') },
      { key: 'district', label: t('Select District') },
      { key: 'cluster', label: t('Select Cluster') },
      { key: 'block', label: t('Select Block') },
    ],
    [],
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      const sortableKeys = ['name', 'academicYear', 'district'];
      if (!sortableKeys.includes(columnKey)) return;

      if (orderBy === columnKey) {
        setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setOrderBy(columnKey);
        setOrderDir('asc');
      }
      setPage(1);
    },
    [orderBy],
  );

  const handleToggleSchoolSelection = useCallback(
    (schoolId: string | number) => {
      const id = String(schoolId);
      setSelectedSchoolIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    },
    [],
  );

  const handleSelectAllVisible = useCallback(
    (checked: boolean, visibleRows: any[]) => {
      const visibleIds = visibleRows
        .map((row) => String(row.sch_id || row.id))
        .filter(Boolean);

      setSelectedSchoolIds((prev) => {
        if (checked) return Array.from(new Set([...prev, ...visibleIds]));
        return prev.filter((id) => !visibleIds.includes(id));
      });
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setTempFilters(INITIAL_FILTERS);
    setPage(1);
    setIsFilterOpen(false);
  }, []);

  const handleOpenFilter = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const handleDeleteFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: prev[key].filter((item) => item !== value),
      };
      setTempFilters(updated);
      return updated;
    });
    setPage(1);
  }, []);

  const handleFilterSliderClose = useCallback(() => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  }, [filters]);

  const handleTempFilterChange = useCallback(
    (name: string, value: string[]) => {
      setTempFilters((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  }, [tempFilters]);

  const handleTabChange = useCallback((value: MigrationTab) => {
    setActiveTab(value);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleOpenMigrateDialog = useCallback(() => {
    if (selectedSchoolIds.length === 0) return;
    setIsMigrateDialogOpen(true);
  }, [selectedSchoolIds.length]);

  const handleCloseMigrateDialog = useCallback(() => {
    if (isMigrating) return;
    setIsMigrateDialogOpen(false);
  }, [isMigrating]);

  const handleCloseSuccessPopup = useCallback(() => {
    setIsSuccessPopupOpen(false);
    setActiveTab('migrated');
    setPage(1);
  }, []);

  const handleCloseFailurePopup = useCallback(() => {
    setIsFailurePopupOpen(false);
  }, []);

  const handleConfirmMigrate = useCallback(async () => {
    if (isMigrating) return;

    const schoolIds = selectedSchoolIds
      .map((id) => String(id ?? '').trim())
      .filter((id) => id.length > 0);

    if (schoolIds.length === 0) return;

    setIsMigrating(true);
    setIsSuccessPopupOpen(false);
    setIsFailurePopupOpen(false);

    try {
      const isMigrated = await api.migrateSchoolData({
        school_ids: schoolIds,
      });
      if (isMigrated) {
        setIsMigrateDialogOpen(false);
        setIsSuccessPopupOpen(true);
        return;
      }
      setIsMigrateDialogOpen(false);
      setIsFailurePopupOpen(true);
    } catch (error) {
      logger.error('Failed to migrate selected schools', error);
      setIsMigrateDialogOpen(false);
      setIsFailurePopupOpen(true);
    } finally {
      setIsMigrating(false);
    }
  }, [api, isMigrating, selectedSchoolIds]);

  useEffect(() => {
    if (!isSuccessPopupOpen && !isFailurePopupOpen) return;

    const timeoutId = window.setTimeout(() => {
      if (isSuccessPopupOpen) {
        handleCloseSuccessPopup();
      } else {
        handleCloseFailurePopup();
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isFailurePopupOpen,
    isSuccessPopupOpen,
    handleCloseFailurePopup,
    handleCloseSuccessPopup,
  ]);

  const pageCount = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const isSelectionActionVisible =
    activeTab === 'migrate' && selectedSchoolIds.length > 0;

  return {
    activeTab,
    searchTerm,
    filters,
    tempFilters,
    filterOptions,
    isFilterOpen,
    isLoading,
    rows,
    orderBy,
    orderDir,
    selectedSchoolIds,
    isMigrateDialogOpen,
    isSuccessPopupOpen,
    isFailurePopupOpen,
    isMigrating,
    page,
    pageCount,
    columns,
    filterConfigsForSchool,
    isSelectionActionVisible,
    setPage,
    handleSort,
    handleToggleSchoolSelection,
    handleSelectAllVisible,
    handleClearFilters,
    handleOpenFilter,
    handleDeleteFilter,
    handleFilterSliderClose,
    handleTempFilterChange,
    handleApplyFilters,
    handleTabChange,
    handleSearchChange,
    handleOpenMigrateDialog,
    handleCloseMigrateDialog,
    handleCloseSuccessPopup,
    handleCloseFailurePopup,
    handleConfirmMigrate,
  };
};
