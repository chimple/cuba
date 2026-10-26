import { useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import { ServiceConfig } from '../../../services/ServiceConfig';
import type { CampaignAssignmentsReportResponse } from '../../../services/api/ServiceApi';
import logger from '../../../utility/logger';

export type CampaignAssignmentsSummaryCard = {
  key: string;
  label: string;
  value: string;
  info: string;
};

export type CampaignAssignmentsTableRow = {
  id: string;
  subject: string;
  lessonsAssigned: number;
  completionPercent: string;
};

export const CAMPAIGN_ASSIGNMENTS_REPORT_SUBTAB = 'Assignments';

export const buildCampaignAssignmentsSummaryCards = ({
  activeStudents,
  assignedStudents,
  averageAssignmentsCompletion,
  totalAssignments,
}: {
  activeStudents: number;
  assignedStudents: number;
  averageAssignmentsCompletion: number;
  totalAssignments: number;
}): CampaignAssignmentsSummaryCard[] => [
  {
    key: 'totalAssignments',
    label: t('Total Assignments'),
    value: String(totalAssignments ?? 0),
    info: t(
      'Total number of assignments assigned through the campaign while creating the campaign.',
    ),
  },
  {
    key: 'assignedStudents',
    label: t('Assigned Students'),
    value: (assignedStudents ?? 0).toLocaleString('en-IN'),
    info: t(
      'Total number of students who received at least one assignment through the campaign.',
    ),
  },
  {
    key: 'activeStudents',
    label: t('Active Students'),
    value: (activeStudents ?? 0).toLocaleString('en-IN'),
    info: t(
      'Total number of students who completed at least one assignment during the campaign period.',
    ),
  },
  {
    key: 'averageAssignmentsCompletion',
    label: t('Average Assignments Completion'),
    value: `${(averageAssignmentsCompletion ?? 0).toLocaleString('en-IN', {
      maximumFractionDigits: 1,
    })}%`,
    info: t(
      'Average number of assignments completed per active student during the selected period.',
    ),
  },
];

export const mapAssignmentReportRows = (
  rows: Array<{
    subjectId: string;
    subjectName: string;
    lessonsAssigned: number;
    completionPercent: number;
  }>,
): CampaignAssignmentsTableRow[] =>
  rows.map((row) => ({
    id: row.subjectId,
    subject: row.subjectName,
    lessonsAssigned: row.lessonsAssigned ?? 0,
    completionPercent: `${Math.round(row.completionPercent ?? 0)}%`,
  }));

export const useCampaignAssignmentsReportState = (
  campaignId?: string,
  totalStudents?: number | null,
) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] =
    useState<CampaignAssignmentsReportResponse | null>(null);

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      if (!campaignId) {
        setReportData(null);
        return;
      }

      setLoading(true);
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getCampaignAssignmentsReport(
            campaignId,
            { totalStudents: totalStudents ?? 0 },
          );
        if (!active) return;
        setReportData(response);
      } catch (error) {
        if (!active) return;
        logger.error('Error loading campaign assignments report:', error);
        setReportData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReport();
    return () => {
      active = false;
    };
  }, [campaignId, totalStudents]);

  const summaryCards = useMemo(() => {
    if (!reportData) {
      return buildCampaignAssignmentsSummaryCards({
        totalAssignments: 0,
        assignedStudents: totalStudents ?? 0,
        activeStudents: 0,
        averageAssignmentsCompletion: 0,
      });
    }

    return buildCampaignAssignmentsSummaryCards({
      totalAssignments: reportData.summary.totalAssignments,
      assignedStudents: reportData.summary.assignedStudents,
      activeStudents: reportData.summary.activeStudents,
      averageAssignmentsCompletion:
        reportData.summary.averageAssignmentsCompletion,
    });
  }, [reportData, totalStudents]);

  const rows = useMemo(() => {
    if (!reportData) {
      return [];
    }

    return mapAssignmentReportRows(reportData.rows);
  }, [reportData]);

  return {
    loading,
    rows,
    summaryCards,
  };
};
