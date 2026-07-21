import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { t } from 'i18next';
import CampaignsOverviewInfoTooltip from './CampaignsOverviewInfoTooltip';
import DataTableBody, { type Column } from '../DataTableBody';
import type { CampaignAssignmentsTableRow } from './CampaignAssignmentsReport.helpers';
import { useCampaignAssignmentsReportState } from './CampaignAssignmentsReport.helpers';

const cardStyles = {
  border: '1px solid #DDE1E6',
  borderRadius: '8px',
  background: '#F8FAFD',
  minHeight: 86,
  px: 1.5,
  py: 1.25,
} as const;

type CampaignAssignmentsReportProps = {
  campaignId?: string;
  totalStudents?: number | null;
};

const CampaignAssignmentsReport: React.FC<CampaignAssignmentsReportProps> = ({
  campaignId,
  totalStudents,
}) => {
  const isMobile = useMediaQuery('(max-width:600px)', {
    defaultMatches: false,
    noSsr: true,
  });
  const report = useCampaignAssignmentsReportState(campaignId, totalStudents);
  const columns = useMemo<Column<CampaignAssignmentsTableRow>[]>(
    () => [
      { key: 'subject', label: t('Subject'), sortable: false, width: '40%' },
      {
        key: 'lessonsAssigned',
        label: t('Lessons Assigned'),
        sortable: false,
        width: '30%',
      },
      {
        key: 'completionPercent',
        label: t('Completion %'),
        sortable: false,
        width: '30%',
      },
    ],
    [],
  );

  return (
    <Box border="1px solid #DDE1E6" borderRadius="10px" bgcolor="#fff">
      <Box px={{ xs: 1.5, sm: 2.5 }} py={2} borderBottom="1px solid #EAECEF">
        <Typography
          fontSize={16}
          fontWeight={700}
          color="#21272A"
          textAlign="left"
        >
          {t('Assignment Report')}
        </Typography>
      </Box>

      <Box p={{ xs: 1.25, sm: 2.5 }}>
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          }}
          gap={1.5}
        >
          {report.summaryCards.map((card) => (
            <Box key={card.key} sx={cardStyles}>
              <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                <Typography color="#667085" fontSize={11} lineHeight="16px">
                  {card.label}
                </Typography>
                <CampaignsOverviewInfoTooltip
                  alignment="left"
                  color="#1A71F6"
                  label={card.label}
                  message={card.info}
                />
              </Box>
              <Typography
                color="#1A71F6"
                fontSize={28}
                fontWeight={700}
                textAlign="left"
              >
                {card.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {isMobile ? (
          <Box mt={1.5} display="grid" gap={1}>
            {report.rows.map((row) => (
              <Box
                key={row.id}
                border="1px solid #DDE1E6"
                borderRadius="8px"
                px={1.5}
                py={1.25}
                display="grid"
                gridTemplateColumns="1.4fr 0.8fr 0.8fr"
                gap={1}
                alignItems="center"
              >
                <Typography fontSize={13} fontWeight={600} color="#21272A">
                  {row.subject}
                </Typography>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#21272A">
                    {row.lessonsAssigned}
                  </Typography>
                  <Typography fontSize={10} color="#667085">
                    {t('Lessons Assigned')}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#21272A">
                    {row.completionPercent}
                  </Typography>
                  <Typography fontSize={10} color="#667085">
                    {t('Completion %')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box mt={2.5}>
            <DataTableBody
              columns={columns}
              rows={report.rows}
              orderBy={null}
              order="asc"
              onSort={() => undefined}
              loading={report.loading}
              disableRowNavigation
              tableWidth="100%"
              headerNoEllipsis
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CampaignAssignmentsReport;
