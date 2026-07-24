import { useEffect, useState } from 'react';
import { SchoolVisitType, SchoolVisitTypeLabels } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { OpsUtil } from '../OpsUtility/OpsUtil';

const DEFAULT_PAGE_SIZE = 20;

export const useActivitiesPageData = (school: any) => {
  const api = ServiceConfig.getI().apiHandler;
  const [loadingData, setLoadingData] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [orderBy, setOrderBy] = useState('date');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchActivities = async () => {
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
          grouped[key].distance =
            minDistance !== Infinity
              ? `${Number((minDistance / 1000).toFixed(2))} km`
              : '--';
        }

        const finalData = Object.values(grouped);
        setAllActivities(finalData);
        setTotal(finalData.length);
      } catch (error) {
        logger.error('Error loading activities:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchActivities();
  }, [api, school, page]);

  useEffect(() => {
    if (!orderBy) return;
    const sorted = [...allActivities].sort((a, b) => {
      const valA = new Date(a.rawDate).getTime();
      const valB = new Date(b.rawDate).getTime();
      return orderDir === 'asc' ? valA - valB : valB - valA;
    });
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    setActivities(sorted.slice(start, start + DEFAULT_PAGE_SIZE));
  }, [orderBy, orderDir, page, allActivities]);

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
    handleSort,
    loadingData,
    orderBy,
    orderDir,
    page,
    pageCount: Math.ceil(total / DEFAULT_PAGE_SIZE),
    setPage,
  };
};
