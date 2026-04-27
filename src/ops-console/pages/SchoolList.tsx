import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ServiceConfig } from '../../services/ServiceConfig';
import { PAGES, PROGRAM_TAB } from '../../common/constants';
import {
  createEmptySchoolFilters,
  DEFAULT_DATE_RANGE,
  DATE_RANGE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  filterConfigsForSchool,
  getSchoolListColumns,
  hasSchoolListFilters,
  mapSchoolListFilterOptions,
  parseSchoolListJsonParam,
  tabOptions,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';
import { useDebouncedValue, useSchoolListData } from './SchoolList.fetcher';
import { mapSchoolRowsToRenderRows } from './SchoolListRowRenderer';
import './SchoolList.css';
import DataTablePagination from '../components/DataTablePagination';
import DataTableBody from '../components/DataTableBody';
import { t } from 'i18next';
import SearchAndFilter from '../components/SearchAndFilter';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import FileUpload from '../components/FileUpload';
import SchoolListDateRangeDropdown from '../components/SchoolListDateRangeDropdown';
import SchoolListExportButton from '../components/SchoolListExportButton';
import { FileUploadOutlined, Add } from '@mui/icons-material';
import { BsFillBellFill } from 'react-icons/bs';
import { useLocation, useHistory } from 'react-router';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { useSchoolListExport } from './useSchoolListExport';

const SchoolList: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;

  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);

  const [selectedTab, setSelectedTab] = useState(() => {
    const v = qs.get('tab') || PROGRAM_TAB.ALL;
    return Object.values(PROGRAM_TAB).includes(v as PROGRAM_TAB)
      ? (v as PROGRAM_TAB)
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [filters, setFilters] = useState<Filters>(() =>
    parseSchoolListJsonParam(qs.get('filters'), createEmptySchoolFilters()),
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

  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const [showUploadPage, setShowUploadPage] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(() =>
    createEmptySchoolFilters(),
  );
  const [filterOptions, setFilterOptions] = useState<Filters>(() =>
    createEmptySchoolFilters(),
  );
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const pageSize = DEFAULT_PAGE_SIZE;
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [isActionsButtonCloseShine, setIsActionsButtonCloseShine] =
    useState(false);
  const actionsButtonCloseShineTimeoutRef = useRef<number | null>(null);
  const actionsButtonCloseShineRafRef = useRef<number | null>(null);
  const isFirstSearchRenderRef = useRef(true);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const isSearchPending = searchTerm !== debouncedSearchTerm;

  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType),
  );
  const isActionsMenuOpen = Boolean(actionsAnchorEl);
  const {
    schools,
    total,
    isLoading: isDataLoading,
  } = useSchoolListData({
    api,
    filters,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    searchTerm: debouncedSearchTerm,
    selectedDateRange,
  });
  const renderedSchools = useMemo(
    () => mapSchoolRowsToRenderRows(schools),
    [schools],
  );
  const isLoading = isFilterLoading || isDataLoading;
  const columns = useMemo(() => getSchoolListColumns(), []);
  const { isExporting, isExportDisabled, handleExportSchools } =
    useSchoolListExport({
      api,
      filters,
      selectedTab,
      orderBy,
      orderDir,
      searchTerm: debouncedSearchTerm,
      selectedDateRange,
      total,
      isLoading,
      isSearchPending,
    });

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const triggerActionsButtonCloseShine = useCallback(() => {
    setIsActionsButtonCloseShine(false);

    if (actionsButtonCloseShineRafRef.current !== null) {
      window.cancelAnimationFrame(actionsButtonCloseShineRafRef.current);
    }
    actionsButtonCloseShineRafRef.current = window.requestAnimationFrame(() => {
      setIsActionsButtonCloseShine(true);
    });

    if (actionsButtonCloseShineTimeoutRef.current !== null) {
      window.clearTimeout(actionsButtonCloseShineTimeoutRef.current);
    }
    actionsButtonCloseShineTimeoutRef.current = window.setTimeout(() => {
      setIsActionsButtonCloseShine(false);
      actionsButtonCloseShineTimeoutRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (actionsButtonCloseShineTimeoutRef.current !== null) {
        window.clearTimeout(actionsButtonCloseShineTimeoutRef.current);
      }
      if (actionsButtonCloseShineRafRef.current !== null) {
        window.cancelAnimationFrame(actionsButtonCloseShineRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set('tab', String(selectedTab));
    if (searchTerm) params.set('search', searchTerm);
    if (hasSchoolListFilters(filters)) {
      params.set('filters', JSON.stringify(filters));
    }
    if (selectedDateRange !== DEFAULT_DATE_RANGE)
      params.set('range', selectedDateRange);
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [selectedTab, searchTerm, filters, selectedDateRange, page, history]);

  useEffect(() => {
    if (isFirstSearchRenderRef.current) {
      isFirstSearchRenderRef.current = false;
      return;
    }
    if (page !== 1) setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions(mapSchoolListFilterOptions(data));
        }
      } catch (error) {
        logger.error('Failed to fetch filter options', error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchFilterOptions();
  }, [api]);

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

  const handleCloseUploadPage = useCallback((): void => {
    setShowUploadPage(false);
  }, []);

  const handleOpenActionsMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setActionsAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleCloseActionsMenu = useCallback(() => {
    setActionsAnchorEl(null);
    triggerActionsButtonCloseShine();
  }, [triggerActionsButtonCloseShine]);

  const handleSelectDateRange = useCallback((nextRange: DateRangeValue) => {
    setSelectedDateRange(nextRange);
    setPage(1);
  }, []);

  const handleOpenUploadPage = useCallback(() => {
    setShowUploadPage(true);
  }, []);

  const handleOpenAddSchoolPage = useCallback(() => {
    history.push({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
    });
  }, [history]);

  const handleOpenMigratePage = useCallback(() => {
    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`,
    );
  }, [history]);

  // Centralized action metadata keeps the menu rendering compact and predictable.
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

  const handleCancelFilters = useCallback(() => {
    const reset = createEmptySchoolFilters();
    setTempFilters(reset);
    setFilters(reset);
    setSelectedDateRange(DEFAULT_DATE_RANGE);
    setIsFilterOpen(false);
    setPage(1);
  }, []);

  const pageCount = useMemo(
    () => Math.ceil(total / pageSize),
    [pageSize, total],
  );

  if (showUploadPage) {
    return (
      <div>
        <div className="school-list-upload-text">{t('Upload File')}</div>
        <div>
          <FileUpload onCancleClick={handleCloseUploadPage} />
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
              <div className="school-list-date-range-control">
                <SchoolListDateRangeDropdown
                  value={selectedDateRange}
                  onChange={handleSelectDateRange}
                />
              </div>
              <div className="school-list-export-control">
                <SchoolListExportButton
                  disabled={isExportDisabled}
                  isExporting={isExporting}
                  onClick={handleExportSchools}
                />
              </div>
              <div className="school-list-actions-group">
                {!isExternalUser && (
                  <Button
                    variant="outlined"
                    id="school-list-actions-button"
                    className={`school-list-actions-button${
                      isActionsButtonCloseShine
                        ? ' school-list-actions-button-close-shine'
                        : ''
                    }`}
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
                  MenuListProps={{ disablePadding: true }}
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
              const empty = createEmptySchoolFilters();
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
            !isLoading && renderedSchools.length === 0
              ? 'school-list-no-schools'
              : ''
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

          {!isLoading && renderedSchools.length > 0 && (
            <DataTableBody
              columns={columns}
              rows={renderedSchools}
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

          {!isLoading && renderedSchools.length === 0 && t('No schools found.')}
        </div>

        {!isLoading && renderedSchools.length > 0 && (
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
