import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import './ProgramDetailsPage.css';
import Breadcrumb from '../components/Breadcrumb';
import { ServiceConfig } from '../../services/ServiceConfig';
import { t } from 'i18next';
import { PROGRAM_TAB_LABELS } from '../../common/constants';
import { BsFillBellFill } from 'react-icons/bs';
import ProgramConnectedSchoolPage from './ProgramConnectedSchoolPageOps';
import {
  ProgramContactsColumn,
  ProgramData,
  ProgramInfoColumn,
  ProgramStatisticsColumn,
  ProgramStats,
} from './ProgramDetailsSections';

interface ProgramDetailComponentProps {
  id: string;
}

const formatProgramModel = (value: string) => {
  try {
    return JSON.parse(value)
      .map(
        (k: string) => PROGRAM_TAB_LABELS[k as keyof typeof PROGRAM_TAB_LABELS],
      )
      .filter(Boolean)
      .join(', ');
  } catch {
    return '';
  }
};

const formatProgramDate = (value: string) => {
  const [start, end] = value.split(/\s+/);
  if (!start || !end) return value;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const ProgramDetailsPage: React.FC<ProgramDetailComponentProps> = ({ id }) => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProgramStats>({
    total_students: 0,
    total_teachers: 0,
    total_schools: 0,
    active_student_percentage: 0,
    active_teacher_percentage: 0,
    avg_weekly_time_minutes: 0,
  });
  const [renderDetails, setRenderDetails] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(id);
      if (!programData) {
        setLoading(false);
        return;
      }
      const result = await api.program_activity_stats(id);
      const countStats = Array.isArray(result) ? result[0] : result;

      setStats({
        total_students: countStats.total_students ?? 0,
        total_teachers: countStats.total_teachers ?? 0,
        total_schools: countStats.total_schools ?? 0,
        active_student_percentage: countStats.active_student_percentage ?? 0,
        active_teacher_percentage: countStats.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: countStats.avg_weekly_time_minutes ?? 0,
      });

      const updatedProgramDetails = programData.programDetails.map((item) => {
        if (item.id === 'program_model')
          return { ...item, value: formatProgramModel(item.value) };
        if (item.id === 'program_date')
          return { ...item, value: formatProgramDate(item.value) };
        return item;
      });
      setData({ ...programData, programDetails: updatedProgramDetails });
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (renderDetails) {
    return <ProgramConnectedSchoolPage id={id} />;
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box className="program-detail-page-error-container">
        <Typography variant="h6">Failed to load program data.</Typography>
      </Box>
    );
  }

  return (
    <div className="program-detail-page">
      <div className="program-detail-page-header">
        <div className="program-detail-page-header-title">
          {data.programDetails.find((d) => d.label === 'Program Name')?.value}
        </div>
        <IconButton
          className="program-detail-page-header-icon"
          sx={{ color: 'black' }}
        >
          <BsFillBellFill />
        </IconButton>
      </div>

      <Box className="program-detail-page-Breadcrumb-padding">
        <Breadcrumb
          crumbs={[
            { label: t('Programs'), onClick: () => history.goBack() },
            {
              label:
                data?.programDetails.find((d) => d.label === 'Program Name')
                  ?.value ?? '',
            },
          ]}
        />

        <Grid container spacing={2}>
          <ProgramInfoColumn data={data} />
          <ProgramContactsColumn data={data} />
          <ProgramStatisticsColumn history={history} id={id} stats={stats} />
        </Grid>
      </Box>
    </div>
  );
};

export default ProgramDetailsPage;
