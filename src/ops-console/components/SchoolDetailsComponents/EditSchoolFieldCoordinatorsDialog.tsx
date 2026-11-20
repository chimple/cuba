import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { t } from 'i18next';
import type { TableTypes } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';

type User = TableTypes<'user'>;
const userLabel = (user: User) =>
  user.name || user.email || user.phone || user.id;

type Props = {
  open: boolean;
  schoolId: string;
  programId?: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export default function EditSchoolFieldCoordinatorsDialog({
  open,
  schoolId,
  programId,
  onClose,
  onSaved,
}: Props) {
  const api = ServiceConfig.getI().apiHandler;
  const [options, setOptions] = useState<User[]>([]);
  const [assigned, setAssigned] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setLoaded(false);
    setError('');
    setSelectedIds([]);
    setOptions([]);
    setAssigned([]);
    setDropdownOpen(false);
    const load = async () => {
      try {
        if (!programId) throw new Error('School has no program');
        const [current, eligible] = await Promise.all([
          api.getSchoolFieldCoordinators(schoolId),
          api.getFieldCoordinatorsByProgram(programId),
        ]);
        if (!active) return;
        setOptions([
          ...new Map(eligible.data.map((user) => [user.id, user])).values(),
        ]);
        setAssigned(current);
        setSelectedIds(current.map((user) => user.id));
        setLoaded(true);
      } catch (err) {
        logger.error('Unable to load school Field Coordinators', err);
        if (active)
          setError(
            t(
              'Unable to load Field Coordinators. Close and reopen to retry.',
            ) ?? '',
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [api, open, schoolId, programId]);

  const eligibleIds = new Set(options.map((user) => user.id));
  const invalidIds = selectedIds.filter((id) => !eligibleIds.has(id));
  const usersById = new Map(
    [...assigned, ...options].map((user) => [user.id, user]),
  );
  const close = () => {
    if (!savingRef.current) onClose();
  };
  const save = async () => {
    if (!loaded || loading || savingRef.current || invalidIds.length) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.updateSchoolFieldCoordinators(schoolId, selectedIds);
      await onSaved();
      onClose();
    } catch (err) {
      logger.error('Unable to save school Field Coordinators', err);
      // Direct requests can partially succeed. Require a fresh read before retrying.
      setLoaded(false);
      setError(
        t(
          'Unable to complete the update. Some changes may have been saved. Close and reopen to reload assignments.',
        ) ?? '',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      fullWidth
      aria-labelledby="school-fc-dialog-title"
      PaperProps={{ sx: { overflow: 'visible', maxWidth: 720 } }}
    >
      <DialogTitle id="school-fc-dialog-title">
        {t('Edit Field Coordinators')}
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, minHeight: 336, overflow: 'visible' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <CircularProgress size={28} />
        ) : (
          <>
            {invalidIds.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t(
                  'Remove selected coordinators who no longer belong to this program before saving.',
                )}
              </Alert>
            )}
            <Autocomplete
              multiple
              disableCloseOnSelect
              disableClearable
              disablePortal
              disabled={!loaded || saving}
              options={options}
              open={dropdownOpen}
              onOpen={() => setDropdownOpen(true)}
              onClose={() => setDropdownOpen(false)}
              getOptionKey={(user) => user.id}
              getOptionLabel={userLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={options.filter((user) => selectedIds.includes(user.id))}
              onChange={(_, users) =>
                setSelectedIds([...invalidIds, ...users.map((user) => user.id)])
              }
              renderTags={() => null}
              noOptionsText={t(
                'No Field Coordinators available for this program',
              )}
              slotProps={{
                popper: {
                  placement: 'bottom-start',
                  modifiers: [{ name: 'flip', enabled: false }],
                },
              }}
              ListboxProps={{ sx: { maxHeight: 256 } }}
              renderOption={({ key, ...props }, user, { selected }) => (
                <li key={key} {...props}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  {userLabel(user)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('Field Coordinators')}
                  placeholder={t('Select Field Coordinators') ?? ''}
                  InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                  sx={{ mt: 0.5 }}
                />
              )}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {selectedIds.map((id) => {
                const user = usersById.get(id);
                return (
                  <Chip
                    key={id}
                    size="small"
                    label={user ? userLabel(user) : id}
                    disabled={!loaded || saving}
                    onDelete={() =>
                      setSelectedIds((ids) =>
                        ids.filter((value) => value !== id),
                      )
                    }
                  />
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}
      >
        <Button
          id="school-fc-cancel"
          className="school-fc-cancel"
          onClick={close}
          disabled={saving}
        >
          {t('Cancel')}
        </Button>
        <Button
          id="school-fc-save"
          className="school-fc-save"
          variant="contained"
          onClick={save}
          disabled={!loaded || loading || saving || invalidIds.length > 0}
        >
          {saving ? t('Saving...') : t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
