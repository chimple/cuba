import { useEffect, useState } from 'react';
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
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

import {
  FieldCoordinatorOption,
  useFieldCoordinatorOptions,
} from './useFieldCoordinatorOptions';
type EditProgramFieldCoordinatorsDialogProps = {
  open: boolean;
  programId: string;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
};

const EditProgramFieldCoordinatorsDialog = ({
  open,
  programId,
  onClose,
  onSaved,
}: EditProgramFieldCoordinatorsDialogProps) => {
  const api = ServiceConfig.getI().apiHandler;
  const [assignedOptions, setAssignedOptions] = useState<
    FieldCoordinatorOption[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedAssignments, setHasLoadedAssignments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const picker = useFieldCoordinatorOptions(
    selectedIds,
    assignedOptions,
    open,
    programId,
  );

  useEffect(() => {
    if (!open) return;

    let active = true;
    const loadFieldCoordinators = async () => {
      setIsLoading(true);
      setHasLoadedAssignments(false);
      setSelectedIds([]);
      setAssignedOptions([]);
      setError('');
      setIsDropdownOpen(false);
      try {
        const assignedResponse =
          await api.getFieldCoordinatorsByProgram(programId);
        if (!active) return;

        const optionById = new Map<string, FieldCoordinatorOption>();
        assignedResponse.data.forEach((user) => {
          optionById.set(user.id, {
            id: user.id,
            name: user.name || user.email || user.phone || user.id,
          });
        });

        setAssignedOptions(Array.from(optionById.values()));
        setSelectedIds(Array.from(optionById.keys()));
        setHasLoadedAssignments(true);
      } catch (loadError) {
        logger.error('Error loading Program Field Coordinators:', loadError);
        if (active) {
          setError(
            t('Unable to load Field Coordinators') ??
              'Unable to load Field Coordinators',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadFieldCoordinators();
    return () => {
      active = false;
    };
  }, [api, open, programId]);
  const handleDialogClose = () => {
    if (isSaving) return;
    setIsDropdownOpen(false);
  };
  const selectedOptions = picker.options.filter((option) =>
    selectedIds.includes(option.id),
  );
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const saved = await api.updateProgramFieldCoordinators(
        programId,
        selectedIds,
      );
      if (!saved) {
        setError(
          t('Unable to update Field Coordinators') ??
            'Unable to update Field Coordinators',
        );
        return;
      }
      await onSaved?.();
      onClose();
    } catch (saveError) {
      logger.error('Error updating Program Field Coordinators:', saveError);
      setError(
        t('Unable to update Field Coordinators') ??
          'Unable to update Field Coordinators',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { overflow: 'visible', maxWidth: 720 },
      }}
    >
      <DialogTitle>{t('Edit Field Coordinators')}</DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, minHeight: 336, overflow: 'visible' }}>
        {(error || picker.error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || t('Unable to load Field Coordinators')}
          </Alert>
        )}
        {isLoading ? (
          <CircularProgress size={28} />
        ) : (
          <>
            <Autocomplete
              multiple
              disableCloseOnSelect
              disableClearable
              disablePortal
              open={isDropdownOpen}
              openOnFocus
              onOpen={() => setIsDropdownOpen(true)}
              onClose={() => setIsDropdownOpen(false)}
              clearOnBlur={false}
              blurOnSelect={false}
              options={picker.options}
              loading={picker.loading}
              inputValue={picker.search}
              onInputChange={(_, value, reason) => {
                if (reason === 'input' || reason === 'clear')
                  picker.setSearch(value);
              }}
              filterOptions={(options) => options}
              getOptionKey={(option) => option.id}
              slotProps={{
                popper: {
                  placement: 'bottom-start',
                  modifiers: [
                    {
                      name: 'flip',
                      enabled: false,
                    },
                    {
                      name: 'preventOverflow',
                      options: {
                        altAxis: true,
                        padding: 8,
                        tether: true,
                      },
                    },
                  ],
                },
                paper: {
                  sx: {
                    mt: 0.5,
                    maxHeight: 264,
                    overflow: 'hidden',
                  },
                },
              }}
              ListboxProps={{
                onScroll: picker.onScroll,
                sx: {
                  maxHeight: 256,
                  overflowY: 'auto',
                  py: 0.5,
                },
              }}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedOptions}
              onChange={(_, values) =>
                setSelectedIds(values.map((option) => option.id))
              }
              renderTags={() => null}
              renderOption={({ key, ...props }, option, { selected }) => (
                <li key={key} {...props}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('Field Coordinators')}
                  placeholder={
                    t('Select Field Coordinators') ??
                    'Select Field Coordinators'
                  }
                  InputLabelProps={{
                    ...params.InputLabelProps,
                    shrink: true,
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {picker.loading && <CircularProgress size={18} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    mt: 0.5,
                    '& .MuiInputLabel-root': {
                      bgcolor: 'background.paper',
                      px: 0.5,
                    },
                  }}
                />
              )}
            />
            {selectedOptions.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {selectedOptions.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    onDelete={() =>
                      setSelectedIds(
                        selectedIds.filter((id) => id !== option.id),
                      )
                    }
                    size="small"
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2,
        }}
      >
        <Button onClick={onClose} disabled={isSaving}>
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasLoadedAssignments || isLoading || isSaving}
        >
          {isSaving ? t('Saving...') : t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProgramFieldCoordinatorsDialog;
