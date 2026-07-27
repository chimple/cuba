import React, { useCallback, useMemo } from 'react';
import { t } from 'i18next';
import type { Column } from '../components/DataTableBody';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import type { SchoolListRow } from './SchoolList.fetcher';
import {
  createEmptySchoolFilters,
  filterConfigsForSchool,
  getSchoolPerformanceLabel,
  PERCENTAGE_FILTER_OPTIONS,
  type Filters,
  type PercentageFilterKey,
  type PercentageFilters,
  type SchoolPerformanceFilterValue,
} from './SchoolList.helpers';

type SchoolListAppliedFiltersProps = {
  columns: Column<SchoolListRow>[];
  filterOptions: Filters;
  filters: Filters;
  isFilterOpen: boolean;
  percentageFilters: PercentageFilters;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPercentageFilters: React.Dispatch<React.SetStateAction<PercentageFilters>>;
  setSchoolPerformanceFilter: React.Dispatch<
    React.SetStateAction<SchoolPerformanceFilterValue | null>
  >;
  setTempFilters: React.Dispatch<React.SetStateAction<Filters>>;
  tempFilters: Filters;
};

export default function SchoolListAppliedFilters({
  columns,
  filterOptions,
  filters,
  isFilterOpen,
  percentageFilters,
  schoolPerformanceFilter,
  setFilters,
  setIsFilterOpen,
  setPage,
  setPercentageFilters,
  setSchoolPerformanceFilter,
  setTempFilters,
  tempFilters,
}: SchoolListAppliedFiltersProps) {
  const gradeOptions = useMemo(
    () => filterOptions.grade ?? [],
    [filterOptions],
  );

  // Show all grades selected in the drawer while keeping filters.grade empty.
  const displayedTempFilters = useMemo(() => {
    if (gradeOptions.length === 0 || (tempFilters.grade?.length ?? 0) > 0) {
      return tempFilters;
    }

    return {
      ...tempFilters,
      grade: gradeOptions,
    };
  }, [gradeOptions, tempFilters]);

  // Selecting every grade is the same as the default fast all-grades state.
  const normalizeAppliedFilters = useCallback(
    (nextFilters: Filters) => {
      const selectedGrades = nextFilters.grade ?? [];
      const isAllGradesSelected =
        gradeOptions.length > 0 &&
        selectedGrades.length === gradeOptions.length &&
        gradeOptions.every((grade) => selectedGrades.includes(grade));

      return isAllGradesSelected ? { ...nextFilters, grade: [] } : nextFilters;
    },
    [gradeOptions],
  );

  const selectedHeaderFilters = useMemo(() => {
    const items: Array<{ key: string; value: string; label: string }> = [];
    if (schoolPerformanceFilter) {
      items.push({
        key: 'schoolPerformanceFilter',
        value: schoolPerformanceFilter,
        label: `${t('School Performance')} : ${getSchoolPerformanceLabel(
          schoolPerformanceFilter,
        )}`,
      });
    }
    columns.forEach((column) => {
      const percentageFilterKey = column.percentageFilterKey as
        | PercentageFilterKey
        | undefined;
      if (!percentageFilterKey) return;
      const selectedBand = percentageFilters[percentageFilterKey];
      if (!selectedBand) return;
      const option = PERCENTAGE_FILTER_OPTIONS.find(
        (item) => item.value === selectedBand,
      );
      if (!option) return;
      items.push({
        key: percentageFilterKey,
        value: selectedBand,
        label: `${column.label} : ${option.description}`,
      });
    });
    return items;
  }, [columns, percentageFilters, schoolPerformanceFilter]);

  return (
    <>
      <SelectedFilters
        filters={filters}
        onDeleteFilter={(key, value) => {
          if (key === 'schoolPerformanceFilter') {
            setSchoolPerformanceFilter(null);
            setPage(1);
            return;
          }
          if (
            key === 'activatedStudents' ||
            key === 'activeStudents' ||
            key === 'activeTeachers'
          ) {
            setPercentageFilters((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
            setPage(1);
            return;
          }
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
        extraFilters={selectedHeaderFilters}
      />

      <FilterSlider
        isOpen={isFilterOpen}
        onClose={() => {
          setIsFilterOpen(false);
          setTempFilters(filters);
        }}
        filters={displayedTempFilters}
        filterOptions={filterOptions}
        onFilterChange={(name, value) =>
          setTempFilters((prev) => ({ ...prev, [name]: value }))
        }
        onApply={() => {
          const appliedFilters = normalizeAppliedFilters(tempFilters);
          setFilters(appliedFilters);
          setTempFilters(appliedFilters);
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
    </>
  );
}
