import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';
import ContactCard from '../components/ContactCard';
import InfoCard from '../components/InfoCard';

type ProgramStats = {
  total_students: number;
  total_teachers: number;
  total_schools: number;
  active_student_percentage: number;
  active_teacher_percentage: number;
  avg_weekly_time_minutes: number;
};

type ProgramData = {
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: {
    name: string;
    role: string;
    phone: string;
    email: string;
  }[];
};

export const ProgramInfoColumn = ({ data }: { data: ProgramData }) => (
  <Grid size={{ xs: 12, md: 4 }} order={{ xs: 2, md: 1 }}>
    <Box className="program-detail-page-column-container">
      <InfoCard title={t('Program Details')} items={data.programDetails} />
      <InfoCard title={t('Partner Details')} items={data.partnerDetails} />
    </Box>
  </Grid>
);

export const ProgramContactsColumn = ({ data }: { data: ProgramData }) => (
  <Grid size={{ xs: 12, md: 4 }} order={{ xs: 3, md: 2 }}>
    <Box className="program-detail-page-column-container">
      <InfoCard
        title={t('Location Details')}
        children={
          <Box className="program-detail-page-location-details-grid">
            {data.locationDetails.map((item, idx) => (
              <Box
                key={idx}
                className="program-detail-page-location-details-item"
              >
                <Typography className="program-detail-page-location-details-label">
                  {item.label}
                </Typography>
                <Typography className="program-detail-page-location-details-value">
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        }
      />
      <InfoCard
        title={t('Program Managers')}
        children={
          <Box className="program-detail-page-managers-list">
            {data.programManagers.map((manager, idx) => (
              <ContactCard
                key={idx}
                name={manager.name}
                role={manager.role}
                phone={manager.phone || manager.email || ''}
              />
            ))}
          </Box>
        }
      />
    </Box>
  </Grid>
);

export const ProgramPerformanceColumn = ({
  history,
  id,
  stats,
}: {
  history: { push: (path: string) => void };
  id: string;
  stats: ProgramStats;
}) => (
  <Grid size={{ xs: 12, md: 4 }} order={{ xs: 1, md: 3 }}>
    <Box className="program-detail-page-column-container">
      <InfoCard title={t('Program Performance')} items={[]}>
        <Box className="program-performance-card" sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('Active Students')}</Typography>
            <Typography fontWeight="bold">
              {`${stats.active_student_percentage.toFixed(2)}%`}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('Avg week time in mins')}</Typography>
            <Typography fontWeight="bold">
              {`${stats.avg_weekly_time_minutes.toFixed(2)}`}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography>{t('Active Teachers')}</Typography>
            <Typography fontWeight="bold">
              {`${stats.active_teacher_percentage.toFixed(2)}%`}
            </Typography>
          </Box>
          <Button variant="contained" fullWidth>
            {t('View Detailed Analytics')}
          </Button>
        </Box>
      </InfoCard>
      <InfoCard title={t('Program Statistics')} items={[]}>
        <Box className="program-detail-page-stats" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('No. of Schools')}</Typography>
            <Typography fontWeight="bold">{stats.total_schools}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('No. of Students')}</Typography>
            <Typography fontWeight="bold">{stats.total_students}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography>{t('No. of Teachers')}</Typography>
            <Typography fontWeight="bold">{stats.total_teachers}</Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            onClick={() =>
              history.push(
                `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}${PAGES.PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS}/${id}`,
              )
            }
          >
            {t('View Details')}
          </Button>
        </Box>
      </InfoCard>
    </Box>
  </Grid>
);

export type { ProgramData, ProgramStats };
