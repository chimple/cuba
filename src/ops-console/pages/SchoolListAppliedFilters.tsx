import React, { useMemo } from 'react';
import { t } from 'i18next';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import {
  createEmptySchoolFilters,
  filterConfigsForSchool,
  getSchoolPerformanceLabel,
  PERCENTAGE_FILTER_OPTIONS,
  type Filters,
  type PercentageFilterKey,
  type PercentageFilters,
  type SchoolFilterOptions,
  type SchoolPerformanceFilterValue,
} from './SchoolList.helpers';

type SchoolListAppliedFiltersProps = {
  columns: any[];
  filterOptions: SchoolFilterOptions;
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

  const getFilterLabel = useMemo(() => {
    return (key: string, value: string) => {
      if (key !== 'program') return value;
      const programOption = filterOptions.program.find((option) => {
        if (typeof option === 'string') return option === value;
        return option.id === value;
      });
      if (!programOption) return value;
      return typeof programOption === 'string'
        ? programOption
        : programOption.name;
    };
  }, [filterOptions.program]);

  return (
    <>
      <SelectedFilters
        filters={filters}
        getFilterLabel={getFilterLabel}
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
    </>
  );
}
