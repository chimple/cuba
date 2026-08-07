import { useCallback, useEffect, useState } from 'react';
import { SchoolVisitType, SchoolVisitTypeLabels } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { OpsUtil } from '../OpsUtility/OpsUtil';

const DEFAULT_PAGE_SIZE = 20;

export type ActivityFilters = {
  techIssues: string[];
  visitType: string[];
};

const createEmptyActivityFilters = (): ActivityFilters => ({
  techIssues: [],
  visitType: [],
});

export const useActivitiesPageData = (school: any) => {
  const api = ServiceConfig.getI().apiHandler;
  const [loadingData, setLoadingData] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState<ActivityFilters>(() =>
    createEmptyActivityFilters(),
  );
  const [tempFilters, setTempFilters] = useState<ActivityFilters>(() =>
    createEmptyActivityFilters(),
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({
    techIssues: ['Yes', 'No'],
    visitType: [],
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [orderBy, setOrderBy] = useState('date');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchActivities = async () => {
      if (!school?.id) {
        setAllActivities([]);
        setActivities([]);
        setTotal(0);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        const activities = await api.getActivitiesBySchoolId(school.id);
        const grouped: Record<string, any> = {};

        for (const item of activities) {
          const date = OpsUtil.formatDateToDDMMMyyyy(item.created_at);
          if (!grouped[date]) {
            grouped[date] = {
              date,
              rawDate: item.created_at,
              visitType: '--',
              distance: '--',
              f2f: 0,
              calls: 0,
              issues: 0,
              checkIn: '--',
              checkOut: '--',
              activitiesList: [],
              visitDetails: null,
              visitId: null,
            };
          }
          grouped[date].activitiesList.push(item);
          if (item.contact_method === 'call') grouped[date].calls += 1;
          else if (item.contact_method === 'in_person') grouped[date].f2f += 1;
          if (item.tech_issues_reported) grouped[date].issues += 1;
        }

        const visitTypeOptions = new Set<string>();

        for (const key in grouped) {
          const visitIds = new Set(
            grouped[key].activitiesList
              .map((act: any) => act.visit_id)
              .filter((id: any) => id !== null),
          );
          logger.info('Unique visit IDs for date', key, ':', visitIds);
          const visitDetailsList = await api.getSchoolVisitById(
            Array.from(visitIds) as string[],
          );
          const visitTypeSet = new Set<string>();
          let minDistance: number = Infinity;

          for (const visit of visitDetailsList) {
            if (visit?.type) visitTypeSet.add(visit.type);
            const distance = Number(visit?.distance_from_school);
            if (!isNaN(distance)) minDistance = Math.min(minDistance, distance);
          }

          grouped[key].checkIn = visitDetailsList[0]?.check_in_at
            ? OpsUtil.formatTimeToIST(visitDetailsList[0].check_in_at)
            : '--';
          let checkOutValue: string | null = null;
          for (let i = visitDetailsList.length - 1; i >= 0; i--) {
            const checkOutAt = visitDetailsList[i]?.check_out_at;
            if (checkOutAt) {
              checkOutValue = OpsUtil.formatTimeToIST(checkOutAt);
              break;
            }
          }
          grouped[key].checkOut = checkOutValue ?? '--';
          grouped[key].visitType =
            visitTypeSet.size > 0
              ? Array.from(visitTypeSet)
                  .map(
                    (type) =>
                      SchoolVisitTypeLabels[type as SchoolVisitType] ?? type,
                  )
                  .join(', ')
              : '--';
          if (grouped[key].visitType !== '--') {
            grouped[key].visitType
              .split(',')
              .map((value: string) => value.trim())
              .filter(Boolean)
              .forEach((value: string) => visitTypeOptions.add(value));
          }
          grouped[key].distance =
            minDistance !== Infinity
              ? `${Number((minDistance / 1000).toFixed(2))} km`
              : '--';
        }

        const finalData = Object.values(grouped);
        setAllActivities(finalData);
        setTotal(finalData.length);
        setFilterOptions({
          techIssues: ['Yes', 'No'],
          visitType: Array.from(visitTypeOptions).sort((a, b) =>
            a.localeCompare(b),
          ),
        });
      } catch (error) {
        logger.error('Error loading activities:', error);
        setAllActivities([]);
        setActivities([]);
        setTotal(0);
      } finally {
        setLoadingData(false);
      }
    };

    fetchActivities();
  }, [api, school]);

  useEffect(() => {
    const filtered = allActivities.filter((row) => {
      if (filters.visitType.length > 0) {
        const rowVisitTypes =
          row.visitType === '--'
            ? []
            : String(row.visitType)
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean);
        if (
          !rowVisitTypes.some((visitType: string) =>
            filters.visitType.includes(visitType),
          )
        ) {
          return false;
        }
      }

      if (filters.techIssues.length > 0) {
        const rowIssueValue = Number(row.issues) > 0 ? 'Yes' : 'No';
        if (!filters.techIssues.includes(rowIssueValue)) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const valA = new Date(a.rawDate).getTime();
      const valB = new Date(b.rawDate).getTime();
      return orderDir === 'asc' ? valA - valB : valB - valA;
    });
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    setActivities(sorted.slice(start, start + DEFAULT_PAGE_SIZE));
    setTotal(filtered.length);
  }, [allActivities, filters, orderDir, page]);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleOpenFilters = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterOpen(false);
    setTempFilters(filters);
  }, [filters]);

  const handleFilterChange = useCallback(
    (key: keyof ActivityFilters, value: string[]) => {
      setTempFilters((prev) => ({ ...prev, [key]: value }) as ActivityFilters);
    },
    [],
  );

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    setPage(1);
  }, [tempFilters]);

  const handleCancelFilters = useCallback(() => {
    const reset = createEmptyActivityFilters();
    setFilters(reset);
    setTempFilters(reset);
    setIsFilterOpen(false);
    setPage(1);
  }, []);

  const handleDeleteFilter = useCallback(
    (key: keyof ActivityFilters, value: string) => {
      setFilters((prev) => {
        const updated: ActivityFilters = {
          ...prev,
          [key]: prev[key].filter((item) => item !== value),
        } as ActivityFilters;
        setTempFilters(updated);
        return updated;
      });
      setPage(1);
    },
    [],
  );

  const handleSort = (colKey: string) => {
    if (colKey !== 'date') return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colKey);
      setOrderDir('asc');
    }
    setPage(1);
  };

  return {
    activities,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleDeleteFilter,
    handleFilterChange,
    handleCloseFilters,
    handleOpenFilters,
    handleSort,
    isFilterOpen,
    loadingData,
    orderBy,
    orderDir,
    page,
    pageCount: Math.ceil(total / DEFAULT_PAGE_SIZE),
    setPage,
    tempFilters,
  };
};
