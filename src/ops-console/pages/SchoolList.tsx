import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  PAGES,
  PROGRAM_TAB,
  FilteredSchoolsForSchoolListingOps,
} from '../../common/constants';
import {
  DEFAULT_DATE_RANGE,
  DATE_RANGE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  filterConfigsForSchool,
  INITIAL_FILTERS,
  tabOptions,
  type DateRangeValue,
  type Filters,
  pickFirstNumber,
  getSchoolCoordinatorList,
  resolvePerformanceStatus,
  getStatusMeta,
  buildSchoolSubtitle,
  renderMetricCell,
  renderMetricWithPercentCell,
} from './SchoolList.helpers';
import './SchoolList.css';
import DataTablePagination from '../components/DataTablePagination';
import DataTableBody, { Column } from '../components/DataTableBody';
import { t } from 'i18next';
import SearchAndFilter from '../components/SearchAndFilter';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import FileUpload from '../components/FileUpload';
import SchoolListDateRangeDropdown from '../components/SchoolListDateRangeDropdown';
import { FileUploadOutlined, Add } from '@mui/icons-material';
import { BsFillBellFill } from 'react-icons/bs';
import { useLocation, useHistory } from 'react-router';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';

type SchoolMetricCell = {
  value: unknown;
  render: React.ReactNode;
};

const isSchoolMetricCell = (value: unknown): value is SchoolMetricCell =>
  typeof value === 'object' &&
  value !== null &&
  'render' in value &&
  'value' in value;

type SchoolListRow = FilteredSchoolsForSchoolListingOps & {
  id: string | number;
  sch_id?: string | number;
  school_id?: string | number;
  udise?: string;
  total_students?: number;
  average_time_spent_mins?: number;
  avg_time_spent_minutes?: number;
  total_activities_assigned?: number;
  assignments_assigned?: number;
  fieldCoordinators?: string;
  name: SchoolMetricCell;
  schoolPerformance: SchoolMetricCell;
  onboardedStudents: SchoolMetricCell;
  activatedStudents: SchoolMetricCell;
  activeStudents: SchoolMetricCell;
  avgTimeSpent: SchoolMetricCell;
  activeTeachers: SchoolMetricCell;
  activitiesAssigned: SchoolMetricCell;
  avgAssignmentsCompleted: SchoolMetricCell;
  avgActivitiesCompleted: SchoolMetricCell;
};

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);

  function parseJSONParam<T>(param: string | null, fallback: T): T {
    try {
      return param ? (JSON.parse(param) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  const [selectedTab, setSelectedTab] = useState(() => {
    const v = qs.get('tab') || PROGRAM_TAB.ALL;
    return Object.values(PROGRAM_TAB).includes(v as PROGRAM_TAB)
      ? (v as PROGRAM_TAB)
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    () => qs.get('search') || '',
  );
  const [filters, setFilters] = useState<Filters>(() =>
    parseJSONParam(qs.get('filters'), INITIAL_FILTERS),
  );
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeValue>(
    () => {
      const queryRange = qs.get('range');
      return DATE_RANGE_OPTIONS.some((option) => option.value === queryRange)
        ? (queryRange as DateRangeValue)
        : DEFAULT_DATE_RANGE;
    },
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get('page') || '', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const [schools, setSchools] = useState<SchoolListRow[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isLoading = isFilterLoading || isDataLoading;

  const [showUploadPage, setShowUploadPage] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<Filters>(INITIAL_FILTERS);
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [openDetails, setOpenDetails] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(null);
  const skipNextAutoFetchRef = useRef(false);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType),
  );
  const isActionsMenuOpen = Boolean(actionsAnchorEl);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set('tab', String(selectedTab));
    if (searchTerm) params.set('search', searchTerm);
    if (Object.values(filters).some((arr) => arr.length))
      params.set('filters', JSON.stringify(filters));
    if (selectedDateRange !== DEFAULT_DATE_RANGE)
      params.set('range', selectedDateRange);
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [selectedTab, searchTerm, filters, selectedDateRange, page, history]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (page !== 1) setPage(1);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions({
            programType: data.programType || [],
            partner: data.partner || [],
            programManager: data.programManager || [],
            fieldCoordinator: data.fieldCoordinator || [],
            state: data.state || [],
            district: data.district || [],
            block: data.block || [],
            cluster: data.cluster || [],
          });
        }
      } catch (error) {
        logger.error('Failed to fetch filter options', error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (skipNextAutoFetchRef.current) {
      skipNextAutoFetchRef.current = false;
      return;
    }
    fetchData();
  }, [
    selectedTab,
    filters,
    page,
    orderBy,
    orderDir,
    debouncedSearchTerm,
    selectedDateRange,
  ]);

  const fetchData = useCallback(
    async (overrides?: {
      dateRange?: DateRangeValue;
      page?: number;
      searchTerm?: string;
    }) => {
      setIsDataLoading(true);
      try {
        const effectivePage = overrides?.page ?? page;
        const effectiveDateRange = overrides?.dateRange ?? selectedDateRange;
        const effectiveSearchTerm =
          overrides?.searchTerm ?? debouncedSearchTerm;
        const cleanedFilters = Object.fromEntries(
          Object.entries(filters).filter(
            ([_, v]) => Array.isArray(v) && v.length > 0,
          ),
        );
        const tabModelFilter =
          selectedTab !== PROGRAM_TAB.ALL
            ? ({ model: [selectedTab] } as Filters)
            : ({} as Filters);
        const requestFilters = { ...cleanedFilters, ...tabModelFilter };

        let backendOrderBy = orderBy;
        const orderByMap: Record<string, string> = {
          name: 'school_name',
          schoolName: 'school_name',
          onboardedStudents: 'onboarded_students',
          activatedStudents: 'activated_students',
          activeStudents: 'active_students',
          avgTimeSpent: 'avg_time_spent',
          activeTeachers: 'active_teachers',
          activitiesAssigned: 'activities_assigned',
          avgAssignmentsCompleted: 'avg_assignments_completed',
          avgActivitiesCompleted: 'avg_activities_completed',
        };
        backendOrderBy = orderByMap[backendOrderBy] ?? backendOrderBy;

        const getSchoolListing =
          api.getSchoolMetricsForSchoolListing?.bind(api) ??
          api.getFilteredSchoolsForSchoolListing?.bind(api);

        if (!getSchoolListing) {
          throw new Error('School listing API is not available');
        }

        const response = await getSchoolListing({
          filters: requestFilters,
          page: effectivePage,
          page_size: pageSize,
          order_by: backendOrderBy,
          order_dir: orderDir,
          search: effectiveSearchTerm,
          date_range: effectiveDateRange,
        });
        const data = (response?.data || []) as SchoolListRow[];
        setTotal(response?.total || 0);

        const enrichedSchools: SchoolListRow[] = data.map((school) => {
          const onboardedStudents = pickFirstNumber(
            school.onboarded_students,
            school.total_students,
          );
          const activatedStudents = pickFirstNumber(school.activated_students);
          const activeStudents = pickFirstNumber(school.active_students);
          const activeTeachers = pickFirstNumber(school.active_teachers);
          const completionAssignments = pickFirstNumber(
            school.avg_assignments_completed,
          );
          const completionActivities = pickFirstNumber(
            school.avg_activities_completed,
          );

          return {
            ...school,
            id: school.sch_id ?? school.school_id ?? school.id ?? '',
            fieldCoordinators:
              getSchoolCoordinatorList(school).join(', ') ||
              String(t('not assigned yet')),
            name: {
              value: school.school_name,
              render: (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="flex-start"
                >
                  <Typography variant="subtitle2">
                    {school.school_name}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontSize={'12px'}
                  >
                    {buildSchoolSubtitle(school)}
                  </Typography>
                </Box>
              ),
            },
            schoolPerformance: (() => {
              const status = resolvePerformanceStatus(school);
              const meta = getStatusMeta(status);
              return {
                value: status || '--',
                render: (
                  <Chip
                    label={status ? t(status) : '--'}
                    size="small"
                    sx={{
                      backgroundColor: `${meta.bg} !important`,
                      color: `${meta.color} !important`,
                      border: 'none',
                      fontWeight: 600,
                      height: 24,
                      '& .MuiChip-label': {
                        px: 1,
                        color: `${meta.color} !important`,
                        fontWeight: 600,
                      },
                    }}
                  />
                ),
              };
            })(),
            onboardedStudents: renderMetricCell(onboardedStudents),
            activatedStudents: renderMetricWithPercentCell(
              activatedStudents,
              onboardedStudents && activatedStudents
                ? (activatedStudents / onboardedStudents) * 100
                : null,
            ),
            activeStudents: renderMetricWithPercentCell(
              activeStudents,
              activatedStudents && activeStudents
                ? (activeStudents / activatedStudents) * 100
                : null,
            ),
            avgTimeSpent: renderMetricCell(
              pickFirstNumber(
                school.avg_time_spent,
                school.average_time_spent_mins,
                school.avg_time_spent_minutes,
              ),
              'm',
              { maxFractionDigits: 0 },
            ),
            activeTeachers: renderMetricWithPercentCell(
              activeTeachers,
              activeTeachers && activeTeachers > 0 ? 100 : null,
            ),
            activitiesAssigned: renderMetricCell(
              pickFirstNumber(
                school.activities_assigned,
                school.total_activities_assigned,
                school.assignments_assigned,
              ),
            ),
            avgAssignmentsCompleted: renderMetricCell(completionAssignments),
            avgActivitiesCompleted: renderMetricCell(completionActivities),
          };
        });

        setSchools(enrichedSchools);
      } catch (error) {
        logger.error('Failed to fetch filtered schools:', error);
        setSchools([]);
        setTotal(0);
      } finally {
        setIsDataLoading(false);
      }
    },
    [
      api,
      filters,
      page,
      pageSize,
      orderBy,
      orderDir,
      debouncedSearchTerm,
      selectedDateRange,
      selectedTab,
    ],
  );

  // Column widths are tuned for horizontal scrolling on smaller screens.
  const columns: Column<SchoolListRow>[] = [
    {
      key: 'name',
      label: t('School Name'),
      width: '20%',
      sortable: true,
      orderBy: 'name',
    },
    {
      key: 'schoolPerformance',
      label: t('School Performance'),
      width: '7.78%',
      align: 'center',
      sortable: false,
    },
    {
      key: 'onboardedStudents',
      label: t('Onboarded Students'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'onboarded_students',
    },
    {
      key: 'activatedStudents',
      label: t('Activated Students'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'activated_students',
    },
    {
      key: 'activeStudents',
      label: t('Active Students'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'active_students',
    },
    {
      key: 'avgTimeSpent',
      label: t('Average Time Spent'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'avg_time_spent',
    },
    {
      key: 'activeTeachers',
      label: t('Active Teachers'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'active_teachers',
    },
    {
      key: 'activitiesAssigned',
      label: t('Activities Assigned'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'activities_assigned',
    },
    {
      key: 'avgAssignmentsCompleted',
      label: t('Avg Assignments Completed'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'avg_assignments_completed',
    },
    {
      key: 'avgActivitiesCompleted',
      label: t('Avg Activities Completed'),
      width: '7.78%',
      align: 'center',
      sortable: false,
      orderBy: 'avg_activities_completed',
    },
  ];

  const handleSort = (colKey: string) => {
    const sortableKeys = ['name'];
    if (!sortableKeys.includes(colKey)) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colKey);
      setOrderDir('desc');
    }
    setPage(1);
  };

  function onCancleClick(): void {
    setShowUploadPage(false);
  }

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setActionsAnchorEl(event.currentTarget);
  };

  const handleCloseActionsMenu = () => {
    setActionsAnchorEl(null);
  };

  const handleSelectDateRange = (nextRange: DateRangeValue) => {
    skipNextAutoFetchRef.current = true;
    setSelectedDateRange(nextRange);
    setPage(1);
    void fetchData({ dateRange: nextRange, page: 1 });
  };

  const handleOpenUploadPage = () => {
    setShowUploadPage(true);
  };

  const handleOpenAddSchoolPage = () => {
    history.push({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
    });
  };

  const handleOpenMigratePage = () => {
    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`,
    );
  };

  const actionItems = !isExternalUser
    ? [
        ...(haveAccess
          ? [
              {
                key: 'migrate',
                label: t('Migrate'),
                icon: (
                  <img
                    id="school-list-actions-migrate-icon"
                    src="assets/icons/migrateArrow.svg"
                    alt=""
                    className="school-list-actions-menu-icon-image"
                  />
                ),
                onClick: handleOpenMigratePage,
              },
            ]
          : []),
        {
          key: 'upload',
          label: t('Upload'),
          icon: <FileUploadOutlined className="school-list-upload-icon" />,
          onClick: handleOpenUploadPage,
        },
        ...(haveAccess
          ? [
              {
                key: 'add-school',
                label: t('Add School'),
                icon: <Add className="school-list-upload-icon" />,
                onClick: handleOpenAddSchoolPage,
              },
            ]
          : []),
      ]
    : [];
  const actionMenuEntries = actionItems.flatMap((item, index) => {
    const nodes = [
      <MenuItem
        key={item.key}
        className="school-list-actions-menu-item"
        onClick={() => {
          handleCloseActionsMenu();
          item.onClick();
        }}
      >
        <ListItemIcon className="school-list-actions-menu-item-icon">
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            className: 'school-list-actions-menu-item-label',
          }}
        />
      </MenuItem>,
    ];

    if (index < actionItems.length - 1) {
      nodes.push(
        <Divider
          key={`${item.key}-divider`}
          className="school-list-actions-menu-divider"
        />,
      );
    }

    return nodes;
  });

  const handleCancelFilters = () => {
    const reset = {
      partner: [],
      programManager: [],
      fieldCoordinator: [],
      programType: [],
      state: [],
      district: [],
      block: [],
      cluster: [],
    };
    setTempFilters(reset);
    setFilters(reset);
    setSelectedDateRange(DEFAULT_DATE_RANGE);
    setIsFilterOpen(false);
    setPage(1);
  };

  const pageCount = Math.ceil(total / pageSize);

  if (showUploadPage) {
    return (
      <div>
        <div className="school-list-upload-text">{t('Upload File')}</div>
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
          <span className="school-list-page-header-title">{t('Schools')}</span>
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
              <SchoolListDateRangeDropdown
                value={selectedDateRange}
                onChange={handleSelectDateRange}
              />
              <div className="school-list-search-control">
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  filters={filters}
                  onFilterClick={() => setIsFilterOpen(true)}
                  onClearFilters={handleCancelFilters}
                />
              </div>
              <div className="school-list-actions-group">
                {!isExternalUser && (
                  <Button
                    variant="outlined"
                    id="school-list-actions-button"
                    className="school-list-actions-button"
                    onClick={handleOpenActionsMenu}
                    aria-controls={
                      isActionsMenuOpen ? 'school-list-actions-menu' : undefined
                    }
                    aria-expanded={isActionsMenuOpen ? 'true' : undefined}
                    aria-haspopup="menu"
                    endIcon={
                      <ArrowDropDownIcon
                        className={`school-list-actions-chevron ${
                          isActionsMenuOpen
                            ? 'school-list-actions-chevron-open'
                            : ''
                        }`}
                      />
                    }
                  >
                    {t('Actions')}
                  </Button>
                )}
                <Menu
                  id="school-list-actions-menu"
                  anchorEl={actionsAnchorEl}
                  open={isActionsMenuOpen}
                  onClose={handleCloseActionsMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    className: 'school-list-actions-menu',
                  }}
                >
                  {actionMenuEntries}
                </Menu>
              </div>
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
            onCancel={() => {
              const empty = {
                state: [],
                district: [],
                block: [],
                programType: [],
                partner: [],
                programManager: [],
                fieldCoordinator: [],
              };
              setTempFilters(empty);
              setFilters(empty);
              setIsFilterOpen(false);
              setPage(1);
            }}
            autocompleteStyles={{}}
            filterConfigs={filterConfigsForSchool}
          />
        </div>
        <div
          className={`school-list-table-container ${
            !isLoading && schools.length === 0 ? 'school-list-no-schools' : ''
          }`}
        >
          {isLoading && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={240}
              width="100%"
            >
              <CircularProgress size={28} />
            </Box>
          )}

          {!isLoading && schools.length > 0 && (
            <DataTableBody
              columns={columns}
              rows={schools}
              orderBy={orderBy}
              order={orderDir}
              onSort={handleSort}
              loading={isLoading}
              // School listing needs the wider, scrollable table treatment only.
              tableMinWidth={1700}
              tableWidth="max-content"
              headerClampLines={2}
              headerNoEllipsis
              headerAlign="center"
            />
          )}

          {!isLoading && schools.length === 0 && t('No schools found.')}
        </div>

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
