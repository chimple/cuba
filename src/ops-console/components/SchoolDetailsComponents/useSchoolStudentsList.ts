import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PerformanceLevel } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import { filterBySearchAndFilters } from '../../OpsUtility/SearchFilterUtility';
import {
  getClassDisplayLabel,
  getExactClassName,
  isProgramGradeAllowed,
  ProgramGradeScopeData,
} from './ClassDetailsPageUtils';
import type { ClassRow, SchoolData } from './SchoolClass';
import type { ApiStudentData } from './SchoolStudents.types';
import {
  getStudentListCacheKey,
  ROWS_PER_PAGE,
  sameSection,
  STUDENT_FETCH_BATCH_SIZE,
  studentListCache,
} from './SchoolStudents.utils';

type UseSchoolStudentsListParams = {
  allowedGrades: ReturnType<
    typeof import('./ClassDetailsPageUtils').getProgramAllowedGrades
  >;
  data: {
    schoolData?: SchoolData;
    programData?: ProgramGradeScopeData;
    students?: ApiStudentData[];
    totalStudentCount?: number;
    classData?: ClassRow[];
    totalCount?: number;
  };
  hasCompletePrefetchedStudents: boolean;
  optionalClassId?: string;
  optionalGrade?: number | string;
  optionalSection?: string;
  programScopedClassIds: string[] | undefined;
  schoolId: string;
};

export const useSchoolStudentsList = ({
  allowedGrades,
  data,
  hasCompletePrefetchedStudents,
  optionalClassId,
  optionalGrade,
  optionalSection,
  programScopedClassIds,
  schoolId,
}: UseSchoolStudentsListParams) => {
  const initialStudentCacheKey = getStudentListCacheKey(
    schoolId,
    optionalClassId,
    programScopedClassIds,
  );
  const cachedInitialStudents = studentListCache.get(initialStudentCacheKey);
  const [students, setStudents] = useState<ApiStudentData[]>(
    cachedInitialStudents?.data ?? data.students ?? [],
  );
  const [totalCount, setTotalCount] = useState<number>(
    cachedInitialStudents?.total ??
      data.totalStudentCount ??
      data.totalCount ??
      0,
  );
  const hasInitialStudents =
    (cachedInitialStudents?.data?.length ?? data.students?.length ?? 0) > 0;
  const fetchIdRef = React.useRef(0);
  const [isLoading, setIsLoading] = useState<boolean>(!hasInitialStudents);
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchStudents = useCallback(
    async (search: string, silent = false) => {
      const currentFetchId = ++fetchIdRef.current;
      if (!silent) setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      const scopedClassId = String(optionalClassId ?? '').trim() || undefined;
      const scopedClassIds = scopedClassId ? undefined : programScopedClassIds;
      const cacheKey = getStudentListCacheKey(
        schoolId,
        scopedClassId,
        scopedClassIds,
      );
      const shouldCache = search.trim() === '';
      if (scopedClassIds && scopedClassIds.length === 0) {
        if (currentFetchId !== fetchIdRef.current) return;
        setStudents([]);
        setTotalCount(0);
        if (shouldCache) studentListCache.set(cacheKey, { data: [], total: 0 });
        if (currentFetchId === fetchIdRef.current) setIsLoading(false);
        return;
      }
      try {
        const fetchStudentPage = async (pageNumber: number) => {
          if (search && search.trim() !== '') {
            return api.searchStudentsInSchool(
              schoolId,
              search,
              pageNumber,
              STUDENT_FETCH_BATCH_SIZE,
              scopedClassId,
              scopedClassIds,
            );
          }
          return api.getStudentInfoBySchoolId(
            schoolId,
            pageNumber,
            STUDENT_FETCH_BATCH_SIZE,
            scopedClassId,
            scopedClassIds,
          );
        };
        const firstPage = await fetchStudentPage(1);
        if (currentFetchId !== fetchIdRef.current) return;
        const allStudents = [...(firstPage.data ?? [])];
        const totalStudents = Math.max(
          typeof firstPage.total === 'number' ? firstPage.total : 0,
          allStudents.length,
        );
        const totalPages = Math.max(
          1,
          Math.ceil(totalStudents / STUDENT_FETCH_BATCH_SIZE),
        );
        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              fetchStudentPage(index + 2),
            ),
          );
          if (currentFetchId !== fetchIdRef.current) return;
          remainingPages.forEach((pageResponse) => {
            allStudents.push(...(pageResponse.data ?? []));
          });
        }
        if (currentFetchId !== fetchIdRef.current) return;
        setStudents(allStudents);
        setTotalCount(totalStudents);
        if (shouldCache) {
          studentListCache.set(cacheKey, {
            data: allStudents,
            total: totalStudents,
          });
        }
      } catch (error) {
        if (currentFetchId === fetchIdRef.current) {
          logger.error('Failed to fetch students:', error);
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) setIsLoading(false);
      }
    },
    [schoolId, optionalClassId, programScopedClassIds],
  );

  const invalidateStudentListCache = useCallback(() => {
    const schoolCachePrefix = `${schoolId}|`;
    Array.from(studentListCache.keys()).forEach((cacheKey) => {
      if (cacheKey.startsWith(schoolCachePrefix)) {
        studentListCache.delete(cacheKey);
      }
    });
  }, [schoolId]);

  useEffect(() => {
    const cacheKey = getStudentListCacheKey(
      schoolId,
      optionalClassId,
      programScopedClassIds,
    );
    if (!debouncedSearchTerm) {
      const cachedStudents = studentListCache.get(cacheKey);
      if (cachedStudents) {
        setStudents(cachedStudents.data);
        setTotalCount(cachedStudents.total);
        setIsLoading(false);
        fetchStudents('', true);
        return;
      }
      if (!allowedGrades && !optionalClassId && hasCompletePrefetchedStudents) {
        const prefetchedStudents = data.students || [];
        const prefetchedTotal =
          data.totalStudentCount ?? prefetchedStudents.length;
        setStudents(prefetchedStudents);
        setTotalCount(prefetchedTotal);
        studentListCache.set(cacheKey, {
          data: prefetchedStudents,
          total: prefetchedTotal,
        });
        setIsLoading(false);
        fetchStudents('', true);
        return;
      }
    }
    fetchStudents(debouncedSearchTerm);
  }, [
    debouncedSearchTerm,
    fetchStudents,
    data.students,
    data.totalStudentCount,
    allowedGrades,
    optionalClassId,
    programScopedClassIds,
    schoolId,
    hasCompletePrefetchedStudents,
  ]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(key);
    setPage(1);
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

  const baseStudents = useMemo(() => {
    const gradeOn =
      optionalGrade !== undefined &&
      optionalGrade !== null &&
      String(optionalGrade).trim() !== '';
    const sectionOn =
      optionalSection !== undefined && String(optionalSection).trim() !== '';
    const classOn =
      optionalClassId !== undefined &&
      optionalClassId !== null &&
      String(optionalClassId).trim() !== '';
    if (classOn) {
      const targetClassId = String(optionalClassId).trim();
      const matchedByClassId = students.filter((row: ApiStudentData) => {
        const rowClassId = String(row.classWithidname?.id ?? '').trim();
        return rowClassId !== '' && rowClassId === targetClassId;
      });
      if (matchedByClassId.length > 0 || students.length === 0) {
        return matchedByClassId;
      }
      if (gradeOn || sectionOn) {
        return students.filter((row: ApiStudentData) => {
          const gradeOk =
            !gradeOn || String(row.grade) === String(optionalGrade);
          const sectionOk =
            !sectionOn || sameSection(row.classSection, optionalSection);
          return gradeOk && sectionOk;
        });
      }
      return [];
    }
    if (!gradeOn && !sectionOn) return students;
    return students.filter((row: any) => {
      const gradeOk = !gradeOn || String(row.grade) === String(optionalGrade);
      const sectionOk =
        !sectionOn || sameSection(row.classSection, optionalSection);
      return gradeOk && sectionOk;
    });
  }, [students, optionalClassId, optionalGrade, optionalSection]);

  const programFilteredStudents = useMemo(() => {
    if (!allowedGrades) return baseStudents;
    return baseStudents.filter((student) =>
      isProgramGradeAllowed(allowedGrades, {
        name: getExactClassName(student.classWithidname),
        grade: student.grade,
        section: student.classSection,
      }),
    );
  }, [baseStudents, allowedGrades]);

  const normalizedStudents = useMemo<ApiStudentData[]>(
    () => programFilteredStudents,
    [programFilteredStudents],
  );

  const filteredStudents = useMemo(() => {
    const searchableStudents = normalizedStudents.map((student, index) => ({
      index,
      user: {
        name: student.user.name ?? undefined,
        email: student.user.email ?? undefined,
        student_id: student.user.student_id ?? undefined,
      },
      grade: student.grade,
      classSection: student.classSection,
      class: getClassDisplayLabel(
        student.grade,
        student.classSection,
        getExactClassName(student.classWithidname),
      ),
    }));
    const searchFiltered = filterBySearchAndFilters(
      searchableStudents,
      { grade: [], section: [] },
      searchTerm,
      'student',
    );
    return searchFiltered
      .filter((student) => {
        const classFilters = filters.class ?? [];
        if (classFilters.length === 0) return true;
        return classFilters.includes(student.class);
      })
      .map((student) => normalizedStudents[student.index]);
  }, [normalizedStudents, filters, searchTerm]);

  const classFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    programFilteredStudents.forEach((student) => {
      const classLabel = getClassDisplayLabel(
        student.grade,
        student.classSection,
        getExactClassName(student.classWithidname),
      );
      if (String(classLabel).trim() !== '') labels.add(classLabel);
    });
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [programFilteredStudents]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case 'studentIdDisplay':
          aValue = a.user.student_id || '';
          bValue = b.user.student_id || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'name':
          aValue = a.user.name || '';
          bValue = b.user.name || '';
          if (order === 'asc') {
            if (aValue > bValue) return 1;
            if (aValue < bValue) return -1;
            return 0;
          }
          if (aValue < bValue) return 1;
          if (aValue > bValue) return -1;
          return 0;
        case 'gender':
          aValue = a.user.gender || '';
          bValue = b.user.gender || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'grade':
          aValue = a.grade || 0;
          bValue = b.grade || 0;
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        case 'classSection':
          aValue = a.classSection || '';
          bValue = b.classSection || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneNumber':
          aValue = a.parent?.phone || '';
          bValue = b.parent?.phone || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }
    });
  }, [filteredStudents, orderBy, order]);

  return {
    baseStudents,
    classFilterOptions,
    debouncedSearchTerm,
    fetchStudents,
    filters,
    handleApplyFilters,
    handleDeleteAppliedFilter,
    handlePageChange,
    handleSearchChange,
    handleSort,
    invalidateStudentListCache,
    isFilterSliderOpen,
    isLoading,
    normalizedStudents,
    order,
    orderBy,
    page,
    searchTerm,
    setFilters,
    setIsFilterSliderOpen,
    setPage,
    setTempFilters,
    students,
    sortedStudents,
    tempFilters,
    totalCount,
  };
};
