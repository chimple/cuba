import { useEffect, useState } from 'react';
import logger from '../../../utility/logger';
import type { ClassMetricsForClassListingRow } from '../../../services/api/ServiceApi';
import type { DateRangeValue } from '../../pages/SchoolList.helpers';
import type { ClassRow } from './SchoolClass.types';

type UseSchoolClassMetricsParams = {
  api: any;
  schoolId: string;
  selectedDateRange: DateRangeValue;
  safeClasses: ClassRow[];
  shouldShowClassCode: boolean;
  isExternalUser: boolean;
  onGenerateCode?: (classId: string) => void;
};

export function useSchoolClassMetrics({
  api,
  schoolId,
  selectedDateRange,
  safeClasses,
  shouldShowClassCode,
  isExternalUser,
  onGenerateCode,
}: UseSchoolClassMetricsParams) {
  const [classMetrics, setClassMetrics] = useState<
    Record<string, ClassMetricsForClassListingRow>
  >({});
  const [classMetricsLoading, setClassMetricsLoading] = useState(false);
  const [hasLoadedClassMetrics, setHasLoadedClassMetrics] = useState(false);
  const [codes, setCodes] = useState<Record<string, string | null>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setHasLoadedClassMetrics(false);
      setClassMetricsLoading(true);
      try {
        const metricRows = await api.getClassMetricsForClassListing({
          schoolId,
          date_range: selectedDateRange,
        });
        if (cancelled) return;

        const nextMetrics: Record<string, ClassMetricsForClassListingRow> = {};
        const nextCodes: Record<string, string | null> = {};
        for (const row of metricRows ?? []) {
          if (!row?.class_id) continue;
          nextMetrics[row.class_id] = row;
          if (row.class_code !== null && row.class_code !== undefined) {
            nextCodes[row.class_id] = String(row.class_code);
          }
        }
        setClassMetrics(nextMetrics);
        if (Object.keys(nextCodes).length > 0) {
          setCodes((prev) => ({ ...nextCodes, ...prev }));
        }
      } catch (error) {
        logger.error('Failed to fetch class listing metrics:', error);
        if (!cancelled) setClassMetrics({});
      } finally {
        if (!cancelled) {
          setClassMetricsLoading(false);
          setHasLoadedClassMetrics(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, schoolId, selectedDateRange]);

  useEffect(() => {
    if (!shouldShowClassCode) {
      setCodes({});
      return;
    }
    if (!hasLoadedClassMetrics) return;

    let cancelled = false;
    (async () => {
      const seeded: Record<string, string | null> = {};
      for (const c of safeClasses) {
        const v = c.code == null ? null : String(c.code);
        const metricCode = classMetrics[c.id]?.class_code;
        if (v) {
          seeded[c.id] = v;
        } else if (metricCode !== null && metricCode !== undefined) {
          seeded[c.id] = String(metricCode);
        }
      }
      const missingIds = safeClasses
        .map((c) => c.id)
        .filter((id) => !(id in seeded));
      if (missingIds.length === 0) {
        if (!cancelled)
          setCodes((prev) => ({
            ...missingIds.reduce(
              (m, id) => ({ ...m, [id]: prev[id] ?? null }),
              {},
            ),
            ...seeded,
            ...prev,
          }));
        return;
      }
      try {
        const lookups = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const val = await api.getClassCodeById(id);
              return [id, val == null ? null : String(val)] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        if (!cancelled) {
          const fetched: Record<string, string | null> = {};
          for (const [id, code] of lookups) fetched[id] = code;
          setCodes((prev) => ({ ...fetched, ...seeded, ...prev }));
        }
      } catch {
        if (!cancelled) setCodes((prev) => ({ ...seeded, ...prev }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    api,
    classMetrics,
    hasLoadedClassMetrics,
    safeClasses,
    shouldShowClassCode,
  ]);

  const handleGenerateCode = async (classId: string) => {
    try {
      if (isExternalUser) return;
      onGenerateCode?.(classId);
      setLoadingIds((s) => ({ ...s, [classId]: true }));
      const newCode = await api.createClassCode(classId);
      setCodes((prev) => ({ ...prev, [classId]: String(newCode) }));
    } catch (err) {
      logger.error('Failed to create class code:', err);
    } finally {
      setLoadingIds((s) => ({ ...s, [classId]: false }));
    }
  };

  return {
    classMetrics,
    classMetricsLoading,
    codes,
    loadingIds,
    handleGenerateCode,
  };
}
