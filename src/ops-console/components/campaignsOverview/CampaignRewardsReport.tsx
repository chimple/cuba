import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { t } from 'i18next';
import CampaignAssignmentsReport from './CampaignAssignmentsReport';
import CampaignRewardsSummaryCards from './CampaignRewardsSummaryCards';
import CampaignRewardsTable, {
  CampaignRewardsReportHeader,
} from './CampaignRewardsTable';
import {
  CAMPAIGN_REPORT_SUBTAB_KEYS,
  CAMPAIGN_REPORT_SUBTABS,
  useCampaignRewardsReportState,
} from './CampaignRewardsReport.helpers';
import type { CampaignRewardsPayload } from '../../../services/api/ServiceApi';

interface CampaignRewardsReportProps {
  campaignId?: string;
  rewards?: string | CampaignRewardsPayload | null;
  totalStudents?: number | null;
}

const CampaignRewardsReport: React.FC<CampaignRewardsReportProps> = ({
  campaignId,
  rewards,
  totalStudents,
}) => {
  const report = useCampaignRewardsReportState(campaignId, rewards);

  return (
    <Box>
      <Box
        display="flex"
        gap={3}
        borderBottom="1px solid #DDE1E6"
        mb={1.5}
        overflow="auto"
      >
        {CAMPAIGN_REPORT_SUBTABS.map((tab) => (
          <Button
            key={tab}
            onClick={() => report.setSelectedSubtab(tab)}
            sx={{
              borderRadius: 0,
              px: 0.5,
              py: 1.25,
              minWidth: 'auto',
              color: tab === report.selectedSubtab ? '#1A71F6' : '#667085',
              borderBottom:
                tab === report.selectedSubtab
                  ? '2px solid #1A71F6'
                  : '2px solid transparent',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'none',
            }}
          >
            {t(tab)}
          </Button>
        ))}
      </Box>

      {report.selectedSubtab === CAMPAIGN_REPORT_SUBTAB_KEYS.ASSIGNMENTS ? (
        <CampaignAssignmentsReport
          campaignId={campaignId}
          totalStudents={totalStudents}
        />
      ) : report.selectedSubtab !== CAMPAIGN_REPORT_SUBTAB_KEYS.REWARDS ? (
        <Box
          border="1px solid #DDE1E6"
          borderRadius="10px"
          p={3}
          bgcolor="#fff"
        >
          <Typography fontSize={16} fontWeight={700} color="#21272A" mb={1}>
            {t(report.selectedSubtab)}
          </Typography>
          <Typography color="#667085" fontSize={14}>
            {t(
              'UI placeholder for now. Rewards is the only report subtab implemented in this pass.',
            )}
          </Typography>
        </Box>
      ) : (
        <Box border="1px solid #DDE1E6" borderRadius="10px" bgcolor="#fff">
          <CampaignRewardsReportHeader
            classFilter={report.classFilter}
            classOptions={report.filterOptions.classes}
            isExporting={report.isExporting}
            lastUpdated={report.lastUpdated}
            schoolFilter={report.schoolFilter}
            schoolOptions={report.filterOptions.schools}
            onClassFilterChange={report.handleClassFilterChange}
            onExport={report.handleExport}
            onSchoolFilterChange={report.handleSchoolFilterChange}
          />

          <Box p={2.5}>
            <CampaignRewardsSummaryCards cards={report.summaryCards} />
            <Box mt={2.5}>
              <CampaignRewardsTable
                order={report.order}
                orderBy={report.orderBy}
                page={report.page}
                pageCount={report.pageCount}
                rewardTypeLabel={report.rewardTypeLabel}
                rows={report.paginatedRows}
                loading={report.loading}
                onPageChange={report.setPage}
                onSort={report.handleSort}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CampaignRewardsReport;
