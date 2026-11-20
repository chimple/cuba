import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { t } from 'i18next';
import type { TableTypes } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import InfoCard from '../InfoCard';
import CoordinatorContact from '../ContactCard';
import EditSchoolFieldCoordinatorsDialog from './EditSchoolFieldCoordinatorsDialog';

export default function SchoolFieldCoordinatorsCard({
  schoolId,
  programId,
  canEdit,
}: {
  schoolId?: string;
  programId?: string | null;
  canEdit: boolean;
}) {
  const api = ServiceConfig.getI().apiHandler;
  const [users, setUsers] = useState<TableTypes<'user'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  useEffect(() => {
    setOpen(false);
  }, [schoolId]);
  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    setLoading(true);
    setError(false);
    setUsers([]);
    const load = async () => {
      try {
        const assigned = await api.getSchoolFieldCoordinators(schoolId);
        if (active) setUsers(assigned);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [api, schoolId, refreshCount]);
  if (!schoolId) return null;
  return (
    <>
      <InfoCard
        id="school-field-coordinators-card"
        className="school-field-coordinators-card"
        title={t('Field Coordinators')}
        showEditIcon={canEdit && !loading && !error}
        onEditClick={() => setOpen(true)}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : error ? (
          <Alert severity="error">
            {t('Unable to load Field Coordinators')}
          </Alert>
        ) : users.length ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {users.map((user) => (
              <CoordinatorContact
                key={user.id}
                name={user.name || user.email || user.phone || user.id}
                role={t('Field Coordinator')}
                phone={user.phone || user.email || ''}
              />
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            {t('No Field Coordinators assigned')}
          </Typography>
        )}
      </InfoCard>
      {canEdit && (
        <EditSchoolFieldCoordinatorsDialog
          key={schoolId}
          open={open}
          schoolId={schoolId}
          programId={programId}
          onClose={() => setOpen(false)}
          onSaved={() => setRefreshCount((count) => count + 1)}
        />
      )}
    </>
  );
}
