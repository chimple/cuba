import React, { useEffect, useMemo, useState } from 'react';
import { Chip } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { t } from 'i18next';
import {
  PERFORMANCE_UI,
  PerformanceLevel,
  SchoolVisitType,
  SchoolVisitTypeLabels,
} from '../../common/constants';
import { Column } from '../components/DataTableBody';
import { FcActivity } from '../../interface/modelInterfaces';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { OpsUtil } from '../OpsUtility/OpsUtil';

const DEFAULT_PAGE_SIZE = 20;
type VisitDetail = { type?: string | null };

export const useSchoolActivities = (activityData: any) => {
  const api = ServiceConfig.getI().apiHandler;
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>(
    {},
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [total, setTotal] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<FcActivity | null>(
    null,
  );

  const getSortField = (data: any) => {
    switch (orderBy) {
      case 'name':
        return data.user?.name ?? '';
      case 'contactType':
        return data.raw.contact_target ?? '';
      case 'performance':
        return PERFORMANCE_UI[data.raw.support_level as PerformanceLevel]?.label
          ? t(PERFORMANCE_UI[data.raw.support_level as PerformanceLevel].label)
          : '';
      case 'class':
        return data.classInfo?.name ?? '';
      case 'time':
        return data.raw.created_at ?? '';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchActivitiesWithMeta = async () => {
      setLoadingData(true);
      try {
        let data = await Promise.all(
          activityData.activities.map(async (act: any) => ({
            raw: act,
            user: await api.getUserByDocId(act.contact_user_id),
            classInfo: act.class_id
              ? await api.getClassById(act.class_id)
              : null,
          })),
        );
        if (searchTerm)
          data = data.filter((item) =>
            (item.user?.name ?? '')
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
          );
        Object.entries(filters).forEach(([key, values]) => {
          if (!values.length) return;
          data = data.filter((item) => {
            switch (key) {
              case 'contactType':
                return values
                  .map((value) => value.toLowerCase())
                  .includes(item.raw.contact_target.toLowerCase());
              case 'performance':
                return values.includes(
                  PERFORMANCE_UI[item.raw.support_level as PerformanceLevel]
                    ?.label,
                );
              case 'visitType': {
                const normalizedValues = values.map((value) =>
                  value.toLowerCase(),
                );
                const visitDetails = activityData.visitDetails ?? [];
                return Array.isArray(visitDetails)
                  ? visitDetails.some((visit: VisitDetail) => {
                      const visitType = String(visit?.type || '').toLowerCase();
                      const visitLabel =
                        SchoolVisitTypeLabels[
                          visitType as SchoolVisitType
                        ]?.toLowerCase() ?? '';
                      return (
                        normalizedValues.includes(visitType) ||
                        normalizedValues.includes(visitLabel)
                      );
                    })
                  : false;
              }
              default:
                return true;
            }
          });
        });
        if (orderBy) {
          data.sort((a, b) => {
            const left = getSortField(a);
            const right = getSortField(b);
            return orderDir === 'asc'
              ? left.localeCompare(right)
              : right.localeCompare(left);
          });
        }
        setTotal(data.length);
        const start = (page - 1) * DEFAULT_PAGE_SIZE;
        setActivities(
          data.slice(start, start + DEFAULT_PAGE_SIZE).map((item) => {
            const perf =
              PERFORMANCE_UI[item.raw.support_level as PerformanceLevel];
            return {
              raw: item.raw,
              user: item.user,
              classInfo: item.classInfo,
              visitDetails: activityData.visitDetails,
              name: item.user?.name ?? '--',
              contactType:
                item.raw.contact_target.charAt(0).toUpperCase() +
                item.raw.contact_target.slice(1),
              performance: (
                <Chip
                  label={perf?.label ? t(perf.label) : t('Not Downloaded')}
                  size="small"
                  sx={{
                    backgroundColor: perf?.bgColor,
                    color: perf?.textColor,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              ),
              class: item.classInfo?.name ?? '--',
              time: OpsUtil.formatTimeToIST(item.raw.created_at),
              techIssues: item.raw.tech_issues_reported ? (
                <Chip
                  label="Yes"
                  size="small"
                  icon={<img src="/assets/icons/Wrench.svg" />}
                  sx={{
                    backgroundColor: '#FFEDD4',
                    color: '#CA3500',
                    fontWeight: 500,
                    height: 24,
                  }}
                />
              ) : (
                '--'
              ),
              details: { render: <ChevronRightIcon /> },
            };
          }),
        );
      } catch (error) {
        logger.error(error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchActivitiesWithMeta();
  }, [filters, searchTerm, orderBy, orderDir, page, activityData.activities]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const res = await api.getActivitiesFilterOptions();
        const performanceValues = res?.performance ?? [];
        const contactTypeValues = res?.contactType ?? [];
        const visitTypeValues = res?.visitType ?? [];
        setFilterOptions({
          ...(res ?? {}),
          performance: performanceValues.map((value) =>
            PERFORMANCE_UI[(value ?? '') as PerformanceLevel]?.label
              ? t(PERFORMANCE_UI[(value ?? '') as PerformanceLevel].label)
              : (value ?? ''),
          ),
          contactType: contactTypeValues.map(
            (value) =>
              (value ?? '').charAt(0).toUpperCase() +
              (value ?? '').slice(1).toLowerCase(),
          ),
          visitType: visitTypeValues.map(
            (value) =>
              SchoolVisitTypeLabels[(value ?? '') as SchoolVisitType] ??
              value ??
              '',
          ),
        });
      } catch {
        setFilterOptions({});
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, [api]);

  const columns: Column<any>[] = [
    { key: 'name', label: t('Name'), sortable: true, onCellClick: true },
    { key: 'contactType', label: t('Contact Type'), sortable: true },
    { key: 'performance', label: t('Performance'), sortable: true },
    { key: 'class', label: t('Class'), sortable: true },
    { key: 'time', label: t('Time'), sortable: true },
    { key: 'techIssues', label: t('Tech Issues'), sortable: false },
    { key: 'details', label: t('Details'), sortable: false },
  ];
  const filterConfigs = useMemo(
    () =>
      [
        {
          key: 'performance',
          label: t('Performance'),
          placeholder: t('Performance'),
        },
        {
          key: 'contactType',
          label: t('Contact Type'),
          placeholder: t('Contact Type'),
        },
        {
          key: 'visitType',
          label: t('Type of Visit'),
          placeholder: t('Type of Visit'),
        },
      ].filter((filter) => (filterOptions[filter.key] || []).length > 1),
    [filterOptions],
  );
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const handleFilterChange = (key: string, value: string[]) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleDeleteFilter = (key: string, value: string) => {
    const updated = {
      ...filters,
      [key]: filters[key].filter((item) => item !== value),
    };
    setFilters(updated);
    setTempFilters(updated);
    setPage(1);
  };
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  };
  const handleCancelFilters = () => {
    const reset = { performance: [], contactType: [], visitType: [] };
    setFilters(reset);
    setTempFilters(reset);
    setIsFilterOpen(false);
    setPage(1);
  };
  const handleSort = (colKey: string) => {
    const sortable = ['name', 'contactType', 'performance', 'class', 'time'];
    if (!sortable.includes(colKey)) return;
    if (orderBy === colKey)
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setOrderBy(colKey);
      setOrderDir('asc');
    }
    setPage(1);
  };
  return {
    activities,
    columns,
    filterConfigs,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
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
    searchTerm,
    selectedActivity,
    setIsFilterOpen,
    setPage,
    setSelectedActivity,
    tempFilters,
  };
};
