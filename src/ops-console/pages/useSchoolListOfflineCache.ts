import { Toast } from '@capacitor/toast';
import { t } from 'i18next';
import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ServiceApi } from '../../services/api/ServiceApi';
import {
  cacheFcSchoolForOffline,
  cleanupExpiredFcSchoolOfflineCaches,
  readAllFcSchoolOfflineCaches,
  removeFcSchoolOfflineCache,
  type FcSchoolOfflineCacheEntry,
} from '../../services/offline/fcSchoolOfflineCache';
import logger from '../../utility/logger';
import type { SchoolListSourceRow } from './SchoolList.fetcher';
import type { DateRangeValue } from './SchoolList.helpers';

export type OfflineCacheSelectionAction = 'save' | 'clear';

const MAX_OFFLINE_CACHE_SCHOOL_SELECTION = 10;

const getRecordValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

const getStringValue = (
  record: Record<string, unknown>,
  keys: string[],
  fallback = '',
) => {
  const value = getRecordValue(record, keys);
  return value === undefined ? fallback : String(value);
};

const getNumberValue = (
  record: Record<string, unknown>,
  keys: string[],
  fallback: number | null = null,
) => {
  const value = getRecordValue(record, keys);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapOfflineCacheToSchoolListRow = (
  cache: FcSchoolOfflineCacheEntry,
): SchoolListSourceRow => {
  const schoolData = (cache.overview?.schoolData ?? {}) as Record<
    string,
    unknown
  >;
  const totalStudents = Object.values(cache.studentsByClassId ?? {}).reduce(
    (sum, students) => sum + students.length,
    0,
  );
  const totalTeachers = cache.teachers?.length ?? 0;

  return {
    ...(schoolData as unknown as SchoolListSourceRow),
    id: cache.schoolId,
    sch_id: cache.schoolId,
    school_id: cache.schoolId,
    school_name: getStringValue(
      schoolData,
      ['school_name', 'name'],
      cache.overview?.schoolData ? String(t('Cached school')) : cache.schoolId,
    ),
    udise: getStringValue(schoolData, ['udise', 'udise_code']),
    block: getStringValue(schoolData, ['block']),
    cluster: getStringValue(schoolData, ['cluster']),
    district: getStringValue(schoolData, ['district']),
    state: getStringValue(schoolData, ['state']),
    total_students: getNumberValue(
      schoolData,
      ['total_students', 'onboarded_students'],
      totalStudents,
    ),
    onboarded_students: getNumberValue(
      schoolData,
      ['onboarded_students', 'total_students'],
      totalStudents,
    ),
    active_students: getNumberValue(schoolData, ['active_students'], null),
    active_teachers: getNumberValue(
      schoolData,
      ['active_teachers'],
      totalTeachers,
    ),
    activated_teachers: getNumberValue(
      schoolData,
      ['activated_teachers', 'total_teachers'],
      totalTeachers,
    ),
  } as SchoolListSourceRow;
};

type UseSchoolListOfflineCacheOptions = {
  api: ServiceApi;
  cacheOfflineEnabled: boolean;
  isExternalUser: boolean;
  schools: SchoolListSourceRow[];
  selectedDateRange: DateRangeValue;
  setPage: Dispatch<SetStateAction<number>>;
};

export function useSchoolListOfflineCache({
  api,
  cacheOfflineEnabled,
  isExternalUser,
  schools,
  selectedDateRange,
  setPage,
}: UseSchoolListOfflineCacheOptions) {
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [isOfflineCacheSelectionMode, setIsOfflineCacheSelectionMode] =
    useState(false);
  const [offlineCacheSelectionAction, setOfflineCacheSelectionAction] =
    useState<OfflineCacheSelectionAction | null>(null);
  const [isCachingSchools, setIsCachingSchools] = useState(false);
  const [isClearingSchoolCaches, setIsClearingSchoolCaches] = useState(false);
  const [offlineCachedSchools, setOfflineCachedSchools] = useState<
    SchoolListSourceRow[]
  >([]);
  const [isBrowserOffline, setIsBrowserOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  const showCachedSchoolsOnly =
    cacheOfflineEnabled &&
    (isBrowserOffline ||
      (isOfflineCacheSelectionMode && offlineCacheSelectionAction === 'clear'));

  const refreshOfflineCachedSchools = useCallback(async () => {
    if (!showCachedSchoolsOnly) {
      setOfflineCachedSchools([]);
      return;
    }
    const cachedSchools = await readAllFcSchoolOfflineCaches();
    setOfflineCachedSchools(cachedSchools.map(mapOfflineCacheToSchoolListRow));
  }, [showCachedSchoolsOnly]);

  useEffect(() => {
    void cleanupExpiredFcSchoolOfflineCaches();
  }, []);

  useEffect(() => {
    const handleOnlineStateChange = () =>
      setIsBrowserOffline(navigator.onLine === false);

    window.addEventListener('online', handleOnlineStateChange);
    window.addEventListener('offline', handleOnlineStateChange);
    return () => {
      window.removeEventListener('online', handleOnlineStateChange);
      window.removeEventListener('offline', handleOnlineStateChange);
    };
  }, []);

  useEffect(() => {
    void refreshOfflineCachedSchools();
  }, [refreshOfflineCachedSchools]);

  const handleStartOfflineCacheSelection = useCallback(
    (action: OfflineCacheSelectionAction) => {
      if (!cacheOfflineEnabled) return;
      setIsOfflineCacheSelectionMode(true);
      setOfflineCacheSelectionAction(action);
      setSelectedSchoolIds([]);
      setPage(1);
    },
    [cacheOfflineEnabled, setPage],
  );

  const handleCancelOfflineCacheSelection = useCallback(() => {
    if (isCachingSchools || isClearingSchoolCaches) return;
    setIsOfflineCacheSelectionMode(false);
    setOfflineCacheSelectionAction(null);
    setSelectedSchoolIds([]);
  }, [isCachingSchools, isClearingSchoolCaches]);

  const handleToggleSchoolSelection = useCallback((id: string | number) => {
    const schoolId = String(id);
    if (!schoolId) return;

    setSelectedSchoolIds((prev) => {
      if (prev.includes(schoolId)) {
        return prev.filter((currentId) => currentId !== schoolId);
      }
      return prev.length >= MAX_OFFLINE_CACHE_SCHOOL_SELECTION
        ? prev
        : [...prev, schoolId];
    });
  }, []);

  const handleCacheSelectedSchools = useCallback(async () => {
    if (!cacheOfflineEnabled) return;

    if (selectedSchoolIds.length === 0) {
      await Toast.show({
        text: t('Select schools to cache.'),
        duration: 'short',
      });
      return;
    }
    if (selectedSchoolIds.length > MAX_OFFLINE_CACHE_SCHOOL_SELECTION) {
      await Toast.show({
        text: t('You can select up to 10 schools.'),
        duration: 'short',
      });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await Toast.show({
        text: t('Connect to the internet to cache schools.'),
        duration: 'long',
      });
      return;
    }

    setIsCachingSchools(true);
    try {
      await cleanupExpiredFcSchoolOfflineCaches();
      await Promise.all(
        selectedSchoolIds.map((schoolId) =>
          cacheFcSchoolForOffline({
            api,
            schoolId,
            isExternalUser,
            dateRange: selectedDateRange,
            schoolSummary: schools.find(
              (school) =>
                String(school.sch_id ?? school.school_id ?? school.id ?? '') ===
                schoolId,
            ),
          }),
        ),
      );
      await Toast.show({ text: t('Selected schools cached for offline use') });
      await refreshOfflineCachedSchools();
      setSelectedSchoolIds([]);
      setIsOfflineCacheSelectionMode(false);
      setOfflineCacheSelectionAction(null);
    } catch (error) {
      logger.error('Failed to cache selected schools for offline use', error);
      await Toast.show({
        text: t('Failed to cache selected schools. Please try again.'),
        duration: 'long',
      });
    } finally {
      setIsCachingSchools(false);
    }
  }, [
    api,
    cacheOfflineEnabled,
    isExternalUser,
    refreshOfflineCachedSchools,
    selectedDateRange,
    selectedSchoolIds,
    schools,
  ]);

  const handleClearSelectedSchoolCaches = useCallback(async () => {
    if (!cacheOfflineEnabled) return;

    if (selectedSchoolIds.length === 0) {
      await Toast.show({
        text: t('Select schools to clear cache.'),
        duration: 'short',
      });
      return;
    }

    setIsClearingSchoolCaches(true);
    try {
      await Promise.all(
        selectedSchoolIds.map((schoolId) =>
          removeFcSchoolOfflineCache(schoolId),
        ),
      );
      await Toast.show({ text: t('Selected school cache removed') });
      await refreshOfflineCachedSchools();
      setSelectedSchoolIds([]);
      setIsOfflineCacheSelectionMode(false);
      setOfflineCacheSelectionAction(null);
    } catch (error) {
      logger.error('Failed to clear selected school cache', error);
      await Toast.show({
        text: t('Failed to clear selected school cache. Please try again.'),
        duration: 'long',
      });
    } finally {
      setIsClearingSchoolCaches(false);
    }
  }, [cacheOfflineEnabled, refreshOfflineCachedSchools, selectedSchoolIds]);

  return {
    clearOfflineCacheLabel: isClearingSchoolCaches
      ? t('Clearing cache...')
      : t('Clear Cache'),
    handleCacheSelectedSchools,
    handleCancelOfflineCacheSelection,
    handleClearSelectedSchoolCaches,
    handleStartOfflineCacheSelection,
    handleToggleSchoolSelection,
    isCachingSchools,
    isClearingSchoolCaches,
    isOfflineCacheSelectionMode,
    offlineCachedSchools,
    offlineCacheSelectionAction,
    refreshOfflineCachedSchools,
    saveOfflineCacheLabel: isCachingSchools
      ? t('Saving offline data...')
      : t('Save Cache'),
    selectedSchoolIds,
    showCachedSchoolsOnly,
  };
}
