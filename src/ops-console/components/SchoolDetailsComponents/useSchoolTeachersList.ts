import React, { useEffect, useMemo, useState } from 'react';
import { TeacherInfo } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import { filterBySearchAndFilters } from '../../OpsUtility/SearchFilterUtility';
import {
  getClassDisplayLabel,
  getExactClassName,
  isProgramGradeAllowed,
} from './ClassDetailsPageUtils';
import {
  getTeacherListCacheKey,
  ROWS_PER_PAGE,
  teacherListCache,
} from './SchoolTeachers.utils';
import type { SchoolTeachersProps } from './SchoolTeachers.types';

type UseSchoolTeachersListProps = {
  allowedGrades: Set<string> | null;
  data: SchoolTeachersProps['data'];
  programScopedClassIds: string[] | undefined;
  schoolId: string;
};

export const useSchoolTeachersList = ({
  allowedGrades,
  data,
  programScopedClassIds,
  schoolId,
}: UseSchoolTeachersListProps) => {
  const hasProgramClassScope = allowedGrades !== null;
  const initialTeacherCacheKey = getTeacherListCacheKey(
    schoolId,
    programScopedClassIds,
  );
  const cachedInitialTeachers = teacherListCache.get(initialTeacherCacheKey);
  const hasPrefetchedTeachers =
    Array.isArray(data.teachers) &&
    (data.teachers.length > 0 || data.totalTeacherCount === 0);
  const [teachers, setTeachers] = useState<TeacherInfo[]>(
    cachedInitialTeachers?.data ??
      (hasProgramClassScope ? [] : data.teachers || []),
  );
  const [totalCount, setTotalCount] = useState<number>(
    cachedInitialTeachers?.total ??
      (hasProgramClassScope ? 0 : data.totalTeacherCount || 0),
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    !cachedInitialTeachers && (hasProgramClassScope || !hasPrefetchedTeachers),
  );
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string[]>>({
    class: [],
  });
  const [orderBy, setOrderBy] = useState<string | null>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    class: [],
  });
  const [isFilterSliderOpen, setIsFilterSliderOpen] = useState(false);

  const fetchTeachers = useMemo(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    return (currentPage: number, search: string, silent = false) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!silent) {
          setIsLoading(true);
        }
        const api = ServiceConfig.getI().apiHandler;
        const cacheKey = getTeacherListCacheKey(
          schoolId,
          programScopedClassIds,
        );
        const shouldCache = currentPage === 1 && search.trim() === '';
        if (programScopedClassIds && programScopedClassIds.length === 0) {
          setTeachers([]);
          setTotalCount(0);
          if (shouldCache) {
            teacherListCache.set(cacheKey, { data: [], total: 0 });
          }
          setIsLoading(false);
          return;
        }
        try {
          if (search && search.trim() !== '') {
            const result = await api.searchTeachersInSchool(
              schoolId,
              search,
              currentPage,
              ROWS_PER_PAGE,
              programScopedClassIds,
            );
            setTeachers(result.data);
            setTotalCount(result.total);
            if (shouldCache) {
              teacherListCache.set(cacheKey, {
                data: result.data,
                total: result.total,
              });
            }
          } else {
            const response = await api.getTeacherInfoBySchoolId(
              schoolId,
              currentPage,
              ROWS_PER_PAGE,
              programScopedClassIds,
            );
            setTeachers(response.data);
            setTotalCount(response.total);
            if (shouldCache) {
              teacherListCache.set(cacheKey, {
                data: response.data,
                total: response.total,
              });
            }
          }
        } catch (error) {
          logger.error('Failed to fetch teachers:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    };
  }, [schoolId, programScopedClassIds]);

  useEffect(() => {
    const isInitial = page === 1 && !searchTerm && filters.class.length === 0;

    if (isInitial && !allowedGrades) {
      const cacheKey = getTeacherListCacheKey(schoolId, programScopedClassIds);
      const prefetchedTeachers = data.teachers || [];
      const prefetchedTotal =
        data.totalTeacherCount ?? prefetchedTeachers.length;

      setTeachers(prefetchedTeachers);
      setTotalCount(prefetchedTotal);
      teacherListCache.set(cacheKey, {
        data: prefetchedTeachers,
        total: prefetchedTotal,
      });

      if (prefetchedTeachers.length > 0 || data.totalTeacherCount === 0) {
        setIsLoading(false);
      } else {
        // The request is intentionally silent to avoid resetting the table,
        // but the initial empty state must remain hidden until it completes.
        setIsLoading(true);
        fetchTeachers(page, searchTerm, true);
      }
      return;
    }

    const cacheKey = getTeacherListCacheKey(schoolId, programScopedClassIds);
    fetchTeachers(
      page,
      searchTerm,
      (isInitial && teacherListCache.has(cacheKey)) ||
        (isInitial && !allowedGrades),
    );
  }, [
    page,
    fetchTeachers,
    data.teachers,
    data.totalTeacherCount,
    searchTerm,
    filters.class,
    allowedGrades,
    programScopedClassIds,
    schoolId,
  ]);

  const normalizedTeachers = useMemo(
    () =>
      teachers.map((teacher: any) => {
        const user = teacher.user ?? teacher;

        return {
          ...teacher,
          user: {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email ?? undefined,
            student_id: user.student_id ?? undefined,
            phone: user.phone ?? undefined,
            gender: user.gender ?? 'N/A',
            is_wa_contact: user.is_wa_contact ?? undefined,
          },
          grade: teacher.grade ?? teacher.grade ?? 0,
          classSection: teacher.classSection ?? 'N/A',
          parent: teacher.parent ?? {
            id: teacher.parent_id ?? undefined,
            name: teacher.parent_name ?? '',
            phone: teacher.phone ?? undefined,
          },
        };
      }),
    [teachers],
  );

  const filteredTeachers = useMemo(() => {
    const searchableTeachers = normalizedTeachers.map((teacher, index) => ({
      ...teacher,
      index,
      class: getClassDisplayLabel(
        teacher.grade,
        teacher.classSection,
        getExactClassName(teacher.classWithidname),
      ),
    }));

    const searchFiltered = filterBySearchAndFilters(
      searchableTeachers,
      { grade: [], section: [] },
      searchTerm,
      'teacher',
    );

    return searchFiltered
      .filter((teacher) => {
        const classFilters = filters.class ?? [];
        if (classFilters.length === 0) return true;
        return classFilters.includes(teacher.class);
      })
      .map((teacher) => normalizedTeachers[teacher.index]);
  }, [normalizedTeachers, filters, searchTerm]);

  const programFilteredTeachers = useMemo(() => {
    if (!allowedGrades) return filteredTeachers;
    return filteredTeachers.filter((teacher) => {
      return isProgramGradeAllowed(allowedGrades, {
        name: getExactClassName(teacher.classWithidname),
        grade: teacher.grade,
        section: teacher.classSection,
      });
    });
  }, [filteredTeachers, allowedGrades]);

  const classFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    programFilteredTeachers.forEach((teacher) => {
      const classLabel = getClassDisplayLabel(
        teacher.grade,
        teacher.classSection,
        getExactClassName(teacher.classWithidname),
      );
      if (String(classLabel).trim() !== '') labels.add(classLabel);
    });
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [programFilteredTeachers]);

  const sortedTeachers = useMemo(() => {
    return [...programFilteredTeachers].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case 'name':
          aValue = a.user.name || '';
          bValue = b.user.name || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'class': {
          const gradeCompare = (a.grade || 0) - (b.grade || 0);
          if (gradeCompare !== 0) {
            return order === 'asc' ? gradeCompare : -gradeCompare;
          }
          return order === 'asc'
            ? (a.classSection || '').localeCompare(b.classSection || '')
            : (b.classSection || '').localeCompare(a.classSection || '');
        }
        case 'classSection':
          aValue = a.classSection || '';
          bValue = b.classSection || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneNumber':
          aValue = a.user.phone || '';
          bValue = b.user.phone || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'emailDisplay':
          aValue = a.user.email || '';
          bValue = b.user.email || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneEmailDisplay': {
          const aPhone = (a.user.phone || '').trim();
          const bPhone = (b.user.phone || '').trim();
          const phoneCompare = aPhone.localeCompare(bPhone);
          if (phoneCompare !== 0) {
            return order === 'asc' ? phoneCompare : -phoneCompare;
          }

          const aEmail = (a.user.email || '').trim();
          const bEmail = (b.user.email || '').trim();
          return order === 'asc'
            ? aEmail.localeCompare(bEmail)
            : bEmail.localeCompare(aEmail);
        }
        default:
          return 0;
      }
    });
  }, [programFilteredTeachers, orderBy, order]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(key);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterSliderOpen(false);
    setPage(1);
  };
  const handleDeleteAppliedFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
    setPage(1);
  };
  const handleClearFilters = React.useCallback(() => {
    setFilters({ class: [] });
    setTempFilters({ class: [] });
    setPage(1);
  }, []);
  const handleFilterIconClick = React.useCallback(() => {
    setTempFilters(filters);
    setIsFilterSliderOpen(true);
  }, [filters]);
  const handleSliderFilterChange = React.useCallback(
    (name: string, value: any) => {
      setTempFilters((prev) => ({
        ...prev,
        [name]: Array.isArray(value) ? value : [value],
      }));
    },
    [],
  );
  const handleCancelFilters = React.useCallback(() => {
    setFilters({ class: [] });
    setTempFilters({ class: [] });
    setPage(1);
    setIsFilterSliderOpen(false);
  }, []);

  return {
    classFilterOptions,
    fetchTeachers,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleClearFilters,
    handleDeleteAppliedFilter,
    handleFilterIconClick,
    handlePageChange,
    handleSearchChange,
    handleSliderFilterChange,
    handleSort,
    isFilterSliderOpen,
    isLoading,
    order,
    orderBy,
    page,
    programFilteredTeachers,
    searchTerm,
    setPage,
    sortedTeachers,
    teachers,
    tempFilters,
    totalCount,
    setIsFilterSliderOpen,
  };
};
