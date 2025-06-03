import React, { useEffect, useState } from 'react';
import DataTableBody, { Column } from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import { useDataTableLogic } from '../OpsUtility/useDataTableLogic';
import { Box, Chip, Typography, Button, Skeleton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import './ProgramPage.css';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import SearchAndFilter from '../components/SearchAndFilter';
import HeaderTab from '../components/HeaderTab';
import { Add } from '@mui/icons-material';
import { ServiceConfig } from '../../services/ServiceConfig';
import { t } from 'i18next';
import { useHistory } from "react-router";
import { PAGES } from '../../common/constants';

type ProgramRow = {
  programName: any;
  institutes: any;
  students: any;
  devices: any;
  manager: any;
};

const columns: Column<ProgramRow>[] = [
  { key: 'programName', label: 'Program Name', align: 'left' },
  { key: 'institutes', label: 'No of Institutes', align: 'left' },
  { key: 'students', label: 'No of Students', align: 'left' },
  { key: 'devices', label: 'No of Devices', align: 'left' },
  { key: 'manager', label: 'Program Manager' },
];

const tabOptions = [
  { label: 'All Programs' },
  { label: 'At School' },
  { label: 'At Home' },
  { label: 'Hybrid' },
];

const ProgramsPage: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [filters, setFilters] = useState<Record<string, string[]>>({
    partner: [],
    program_type: [],
    model: [],
    state: [],
    district: [],
    block: [],
    village: [],
    cluster: [],
  });

  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    partner: [],
    program_type: [],
    model: [],
    state: [],
    district: [],
    block: [],
    village: [],
    cluster: [],
  });
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  type TabType = 'ALL' | 'at_school' | 'at_home' | 'hybrid';

  const tabMap: Record<string, TabType> = {
    'All Programs': 'ALL',
    'At School': 'at_school',
    'At Home': 'at_home',
    'Hybrid': 'hybrid',
  };

  const tab: TabType | undefined = tabMap[tabOptions[activeTab].label];

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        //  const response = await SupabaseApi.i.getProgramFilterOptions();
        const response = await api.getProgramFilterOptions();
        setFilterOptions(response);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      const user = await auth.getCurrentUser();
      const currentUserId = user?.id;
      setLoadingPrograms(true);
      try {
        const currentUserId = user?.id;
        if (!currentUserId) {
          setPrograms([]);
          return;
        }
        // const { data } = await SupabaseApi.i.getPrograms({ currentUserId, filters, searchTerm, tab });
        const { data } = await api.getPrograms({ currentUserId, filters, searchTerm, tab });
        console.log('Fetched programs:', data);
        setPrograms(data);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setPage(1);
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [filters, searchTerm, tab]);

  const transformedRows = programs.map((row) => ({
    id: row.id,
    programName: {
      value: row.name,
      render: (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="start"
          alignItems="left"
        >
          <Typography variant="subtitle2">{row.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {row.state}
          </Typography>
        </Box>
      ),
    },
    institutes: row.institutes_count ?? 0,
    students: row.students_count ?? 0,
    devices: {
      value: row.devices_count ?? 0,
      render: <Chip label={row.devices_count ?? 0} size="small" />,
    },
    manager: row.manager_names,
  }));

  const {
    orderBy,
    order,
    page,
    setPage,
    handleSort,
    paginatedRows,
  } = useDataTableLogic(transformedRows);

  const handleFilterChange = (name: string, value: any) => {
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeleteFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const updatedFilters = {
        ...prev,
        [key]: prev[key].filter((v) => v !== value),
      };
      setTempFilters(updatedFilters); // Update tempFilters to reflect the change in the dropdown
      return updatedFilters;
    });
  };

  const onFilterClick = () => {
    setIsFilterOpen(true);
  };

  const autocompleteStyles = {
    "& .MuiOutlinedInput-root": { padding: "6px!important" },
    "& .MuiAutocomplete-paper": { boxShadow: "none", border: "none" },
    "& .MuiAutocomplete-listbox": { padding: 0 },
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handelClose = () => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleCancelFilters = () => {
    setTempFilters({
      partner: [],
      program_type: [],
      model: [],
      state: [],
      district: [],
      block: [],
      village: [],
      cluster: [],
    });
    setFilters({
      partner: [],
      program_type: [],
      model: [],
      state: [],
      district: [],
      block: [],
      village: [],
      cluster: [],
    });
    setIsFilterOpen(false);
  };

  return (
    <div className="program-page">
      <div className="program-page-header">{t("Programs")}</div>

      <div className="program-header-and-search-filter">
        <div className="program-search-filter">
          <HeaderTab activeTab={activeTab} handleTabChange={handleTabChange} tabs={tabOptions} />
          <div className="program-button-and-search-filter">
            <Button
              variant="outlined"
              onClick={() => history.replace(PAGES.NEW_PROGRAM)}
              sx={{
                borderColor: "transparent",
                borderRadius: 20,
                boxShadow: 3,
                height: "48px",
                minWidth: isSmallScreen ? "48px" : "auto",
                padding: isSmallScreen ? 0 : "6px 16px",
              }}
            >
              <Add />
              {!isSmallScreen && t("New Program")}
            </Button>
            {loadingFilters ? (<CircularProgress />
            ) : (<SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              filters={filters}
              onFilterClick={onFilterClick}
            />)
            }
          </div>
        </div>

        <SelectedFilters filters={filters} onDeleteFilter={handleDeleteFilter} />

        <FilterSlider
          isOpen={isFilterOpen}
          onClose={handelClose}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          autocompleteStyles={autocompleteStyles}
        />
      </div>

      <div className="program-table">
        {loadingPrograms ? (
          <Box padding={2}>
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : programs.length === 0 ? (
          <Box padding={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {t("No programs found")}
            </Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={paginatedRows}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
            detailPageRouteBase="programs"
          />
        )}
      </div>

      <div className="program-page-pagination">
        <DataTablePagination page={page} pageCount={Math.ceil(programs.length / 10)} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default ProgramsPage;
