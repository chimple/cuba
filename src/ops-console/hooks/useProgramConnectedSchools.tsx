import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import { Column } from '../components/DataTableBody';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

const DEFAULT_PAGE_SIZE = 20;

const resetFilters = {
  state: [],
  district: [],
  block: [],
  cluster: [],
  village: [],
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  model: [],
};

export const useProgramConnectedSchools = (id: string) => {
  const api = ServiceConfig.getI().apiHandler;
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>(
    {},
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [programName, setProgramName] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [total, setTotal] = useState(0);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const handleFilterChange = (name: string, value: string[]) => {
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleDeleteFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const updatedFilters = {
        ...prev,
        [key]: prev[key].filter((item) => item !== value),
      };
      setTempFilters(updatedFilters);
      return updatedFilters;
    });
    setPage(1);
  };
  const handleClose = () => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  };
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  };
  const handleCancelFilters = () => {
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setIsFilterOpen(false);
    setPage(1);
  };

  const fetchSchools = async () => {
    setLoadingData(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => Array.isArray(value) && value.length > 0,
        ),
      );
      const programData = await api.getProgramData(id);
      const name =
        programData?.programDetails?.find(
          (item) => item.label === 'Program Name',
        )?.value ?? '';
      setProgramName(name);

      let backendOrderBy = orderBy;
      if (backendOrderBy === 'name') backendOrderBy = 'school_name';
      if (backendOrderBy === 'students') backendOrderBy = 'num_students';
      if (backendOrderBy === 'teachers') backendOrderBy = 'num_teachers';

      const response = await api.getFilteredSchoolsForSchoolListing({
        programId: id,
        filters: cleanedFilters,
        page,
        page_size: DEFAULT_PAGE_SIZE,
        order_by: backendOrderBy,
        order_dir: orderDir,
        search: searchTerm,
      });
      setTotal(response?.total || 0);
      setSchools(
        (response?.data || []).map((school: any) => ({
          ...school,
          id: school.sch_id,
          students: school.num_students || 0,
          teachers: school.num_teachers || 0,
          programManagers:
            school.program_managers?.join(', ') || t('not assigned yet'),
          fieldCoordinators:
            school.field_coordinators?.join(', ') || t('not assigned yet'),
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
                  {school.district || ''}
                </Typography>
              </Box>
            ),
          },
        })),
      );
    } catch (error) {
      logger.error('Error loading schools:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const response = await api.getSchoolFilterOptionsForProgram(id);
        setFilterOptions(response || {});
      } catch (error) {
        logger.error('Error loading filter options:', error);
        setFilterOptions({});
      } finally {
        setLoadingFilters(false);
      }
    };
    if (id) fetchFilterOptions();
  }, [api, id]);

  useEffect(() => {
    fetchSchools();
  }, [id, filters, searchTerm, orderBy, orderDir, page]);

  const columns: Column<Record<string, any>>[] = [
    { key: 'name', label: t('Schools'), sortable: true, orderBy: 'name' },
    {
      key: 'students',
      label: t('No. of Students'),
      sortable: true,
      orderBy: 'students',
    },
    {
      key: 'teachers',
      label: t('No. of Teachers'),
      sortable: true,
      orderBy: 'teachers',
    },
    { key: 'programManagers', label: t('Program Manager'), sortable: false },
    {
      key: 'fieldCoordinators',
      label: t('Field Coordinator'),
      sortable: false,
    },
  ];

  const handleSort = (colKey: string) => {
    const sortableKeys = ['name', 'students', 'teachers'];
    if (!sortableKeys.includes(colKey)) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colKey);
      setOrderDir('asc');
    }
    setPage(1);
  };

  const filterConfigsForSchools = useMemo(() => {
    const filterConfigurations = [
      ['programManager', t('Select Program Manager'), t('Program Manager'), 1],
      [
        'fieldCoordinator',
        t('Select Field Coordinator'),
        t('Field Coordinator'),
        1,
      ],
      ['model', t('School Model'), t('School Model'), 1],
      ['state', t('Select State'), t('State'), 0],
      ['district', t('Select District'), t('District'), 0],
      ['block', t('Select Block'), t('Block'), 0],
      ['village', t('Select Village'), t('Village'), 0],
      ['cluster', t('Select Cluster'), t('Cluster'), 0],
    ] as const;

    return filterConfigurations
      .filter(
        ([key, , , minCount]) => (filterOptions[key] || []).length > minCount,
      )
      .map(([key, label, placeholder]) => ({ key, label, placeholder }));
  }, [filterOptions]);

  return {
    columns,
    filterConfigsForSchools,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleClose,
    handleDeleteFilter,
    handleFilterChange,
    handleSearchChange,
    handleSort,
    isFilterOpen,
    loadingData,
    loadingFilters,
    orderBy,
    orderDir,
    page,
    pageCount: Math.ceil(total / DEFAULT_PAGE_SIZE),
    programName,
    schools,
    searchTerm,
    setIsFilterOpen,
    setPage,
    tempFilters,
  };
};
