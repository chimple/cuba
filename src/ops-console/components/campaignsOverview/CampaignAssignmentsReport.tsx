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
  minHeight: 72,
  position: 'relative',
  px: 1.5,
  py: 1.1,
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
      {
        key: 'subject',
        label: t('SUBJECTS'),
        sortable: false,
        width: '10%',
        align: 'left',
        headerAlign: 'left',
      },
      {
        key: 'lessonsAssigned',
        label: t('LESSONS ASSIGNED'),
        sortable: false,
        width: '10%',
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'completionPercent',
        label: t('COMPLETION %'),
        sortable: false,
        width: '24%',
        align: 'center',
        headerAlign: 'center',
      },
    ],
    [],
  );

  return (
    <Box
      component="article"
      border="1px solid #DDE1E6"
      borderRadius="10px"
      bgcolor="#fff"
    >
      {!isMobile ? (
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
      ) : null}

      <Box p={{ xs: 1.25, sm: 2.5 }}>
        <Typography
          component="div"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          {(isMobile
            ? [
                report.summaryCards[0],
                report.summaryCards[3],
                report.summaryCards[1],
                report.summaryCards[2],
              ].filter(Boolean)
            : report.summaryCards
          ).map((card) => (
            <Box key={card.key} sx={cardStyles}>
              <Box position="absolute" top={10} right={10}>
                <CampaignsOverviewInfoTooltip
                  alignment="right"
                  color="#1A71F6"
                  label={card.label}
                  message={card.info}
                />
              </Box>

              {!isMobile ? (
                <Typography
                  color="#667085"
                  fontSize={11}
                  fontWeight={500}
                  lineHeight="16px"
                  mb={0.75}
                  textAlign="left"
                >
                  {card.label}
                </Typography>
              ) : null}

              <Typography
                color="#1A71F6"
                fontSize={{ xs: 24, sm: 28 }}
                fontWeight={700}
                textAlign="left"
                mt={isMobile ? 0.25 : 0}
              >
                {card.value}
              </Typography>

              {isMobile ? (
                <Typography
                  color="#667085"
                  fontSize={10}
                  fontWeight={700}
                  lineHeight="16px"
                  mt={0.75}
                  textAlign="left"
                >
                  {card.label}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Typography>

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
                <Typography
                  fontSize={13}
                  fontWeight={700}
                  color="#21272A"
                  textAlign="left"
                >
                  {row.subject}
                </Typography>
                <Box>
                  <Typography
                    fontSize={13}
                    fontWeight={700}
                    color="#21272A"
                    textAlign="left"
                  >
                    {row.lessonsAssigned}
                  </Typography>
                  <Typography
                    fontSize={10}
                    fontWeight={700}
                    color="#667085"
                    textAlign="left"
                  >
                    {t('Lessons')}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    fontSize={13}
                    fontWeight={700}
                    color="#21272A"
                    textAlign="left"
                  >
                    {row.completionPercent}
                  </Typography>
                  <Typography
                    fontSize={10}
                    fontWeight={700}
                    color="#667085"
                    textAlign="left"
                  >
                    {t('Completion')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            mt={2.5}
            sx={{
              '.data-tablebody-container': {
                overscrollBehavior: 'auto',
              },
              '.data-tablebody-column-subject#data-tablebody-content-cell': {
                textAlign: 'left',
              },
              '.data-tablebody-column-lessonsAssigned#data-tablebody-content-cell, .data-tablebody-column-completionPercent#data-tablebody-content-cell':
                {
                  textAlign: 'center',
                },
              '.data-tablebody-column-subject .MuiTableSortLabel-root': {
                justifyContent: 'flex-start',
              },
              '.data-tablebody-column-lessonsAssigned .MuiTableSortLabel-root, .data-tablebody-column-completionPercent .MuiTableSortLabel-root':
                {
                  justifyContent: 'center',
                },
              '.data-tablebody-column-subject .data-tablebody-head-button': {
                justifyContent: 'flex-start',
              },
              '.data-tablebody-column-lessonsAssigned .data-tablebody-head-button, .data-tablebody-column-completionPercent .data-tablebody-head-button':
                {
                  justifyContent: 'center',
                },
              '.data-tablebody-column-subject .data-tablebody-head-label': {
                textAlign: 'left',
              },
              '.data-tablebody-column-lessonsAssigned .data-tablebody-head-label, .data-tablebody-column-completionPercent .data-tablebody-head-label':
                {
                  textAlign: 'center',
                },
            }}
          >
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
