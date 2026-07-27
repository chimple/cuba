import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  OPS_PERFORMANCE_BANDS,
  PerformanceLevel,
} from '../../../common/constants';
import {
  getClassDisplayLabel,
  getExactClassName,
} from './ClassDetailsPageUtils';
import type {
  ApiStudentData,
  DisplayStudent,
  WhatsappGroupStatusKey,
} from './SchoolStudents.types';
import {
  mapOpsLabelToPerformanceLevel,
  ROWS_PER_PAGE,
} from './SchoolStudents.utils';

type UseSchoolStudentsRowsParams = {
  classDataRefId?: string;
  filters: Record<string, string[]>;
  getWhatsappGroupStatus: (student: ApiStudentData) => WhatsappGroupStatusKey;
  isLoading: boolean;
  issTotal: boolean;
  page: number;
  performanceFilter: PerformanceLevel;
  searchTerm: string;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setIsFilterSliderOpen: (open: boolean) => void;
  setPage: (page: number) => void;
  setPerformanceFilter: (value: PerformanceLevel) => void;
  setTempFilters: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  sortedStudents: ApiStudentData[];
  studentPerformanceMap: Map<string, string>;
  tempFilters: Record<string, string[]>;
  totalCount: number;
};

export const useSchoolStudentsRows = ({
  classDataRefId,
  filters,
  getWhatsappGroupStatus,
  isLoading,
  issTotal,
  page,
  performanceFilter,
  searchTerm,
  setFilters,
  setIsFilterSliderOpen,
  setPage,
  setPerformanceFilter,
  setTempFilters,
  sortedStudents,
  studentPerformanceMap,
  tempFilters,
  totalCount,
}: UseSchoolStudentsRowsParams) => {
  const processedStudents = useMemo((): DisplayStudent[] => {
    let filtered = sortedStudents.map((sApi): DisplayStudent => {
      const classNameFromStudent = getExactClassName(sApi.classWithidname);
      const rowClassId = String(
        issTotal
          ? (sApi.classWithidname?.id ?? '')
          : (classDataRefId ?? sApi.classWithidname?.id ?? ''),
      ).trim();
      return {
        id: sApi.user.id,
        original: sApi,
        studentIdDisplay: sApi.user.student_id ?? 'N/A',
        name: sApi.user.name ?? 'N/A',
        gender: sApi.user.gender ?? 'N/A',
        grade: sApi.grade ?? 0,
        classSection: sApi.classSection ?? 'N/A',
        phoneNumber: sApi.parent?.phone || sApi.parent?.email || 'N/A',
        class: getClassDisplayLabel(
          sApi.grade,
          sApi.classSection,
          classNameFromStudent,
        ),
        schstudents_performance:
          studentPerformanceMap.get(`${rowClassId}:${sApi.user.id}`) ??
          OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
        whatsappGroupStatus: getWhatsappGroupStatus(sApi),
      };
    });
    if (performanceFilter !== PerformanceLevel.ALL) {
      filtered = filtered.filter((student) => {
        const perf = mapOpsLabelToPerformanceLevel(
          student.schstudents_performance,
        );
        return perf === performanceFilter;
      });
    }
    return filtered;
  }, [
    classDataRefId,
    getWhatsappGroupStatus,
    issTotal,
    performanceFilter,
    sortedStudents,
    studentPerformanceMap,
  ]);

  const studentsForCurrentPage = useMemo((): DisplayStudent[] => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return processedStudents.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [page, processedStudents]);

  const pageCount = useMemo(
    () => Math.ceil(processedStudents.length / ROWS_PER_PAGE),
    [processedStudents.length],
  );

  useEffect(() => {
    if (pageCount === 0 && page !== 1) {
      setPage(1);
      return;
    }
    if (page > pageCount && pageCount > 0) {
      setPage(pageCount);
    }
  }, [page, pageCount, setPage]);

  const isDataPresent = studentsForCurrentPage.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== '' ||
    Object.values(filters).some((f) => f.length > 0) ||
    performanceFilter !== PerformanceLevel.ALL;

  const handleFilterIconClick = useCallback(() => {
    setTempFilters(filters);
    setIsFilterSliderOpen(true);
  }, [filters, setIsFilterSliderOpen, setTempFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({ class: [] });
    setTempFilters({ class: [] });
    setPage(1);
  }, [setFilters, setPage, setTempFilters]);

  const handleSliderFilterChange = useCallback(
    (name: string, value: any) => {
      setTempFilters((prev) => ({
        ...prev,
        [name]: Array.isArray(value) ? value : [value],
      }));
    },
    [setTempFilters],
  );

  const handleCancelFilters = useCallback(() => {
    setFilters({ class: [] });
    setTempFilters({ class: [] });
    setPage(1);
    setIsFilterSliderOpen(false);
  }, [setFilters, setIsFilterSliderOpen, setPage, setTempFilters]);

  const handlePerformanceFilterChange = useCallback(
    (value: PerformanceLevel) => {
      setPerformanceFilter(value);
      setPage(1);
    },
    [setPage, setPerformanceFilter],
  );

  const hasAnyStudents = (totalCount ?? 0) > 0;
  const isNoStudentsState = !isLoading && !hasAnyStudents;

  return {
    handleCancelFilters,
    handleClearFilters,
    handleFilterIconClick,
    handlePerformanceFilterChange,
    handleSliderFilterChange,
    hideFilterUI: isNoStudentsState,
    isDataPresent,
    isFilteringOrSearching,
    studentsForCurrentPage,
    pageCount,
  };
};
