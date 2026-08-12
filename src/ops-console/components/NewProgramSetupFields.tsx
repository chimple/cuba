import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import {
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  ProgramType,
} from '../../common/constants';
import { useNewProgramForm } from './useNewProgramForm';

type NewProgramForm = ReturnType<typeof useNewProgramForm>;

export default function NewProgramSetupFields({ form }: { form: NewProgramForm }) {
  const {
    errors,
    handleBlur,
    handleModelToggle,
    models,
    programManagers,
    programType,
    selectedManagers,
    setProgramType,
    setSelectedManagers,
    touchedFields,
  } = form;

  return (
    <>
      <Grid size={{ xs: 12, sm: 4, md: 4 }} mb={3}>
        <Typography
          variant="subtitle1"
          color="text.primary"
          fontWeight="bold"
          mb={1}
        >
          {t('Program Type')}
          <span className="new-program-mandatory">*</span>
        </Typography>
        <FormControl
          fullWidth
          error={!!errors['programType'] && touchedFields['programType']}
        >
          <InputLabel>{`Select ${t('Program Type')}`}</InputLabel>
          <Select
            label={`Select ${t('Program Type')}`}
            value={programType}
            onChange={(e: any) => setProgramType(e.target.value)}
            onBlur={() => handleBlur('programType')}
            sx={{ borderRadius: '12px' }}
          >
            {Object.entries(ProgramType).map(([label, value]) => (
              <MenuItem key={value} value={value}>
                {t(label.replace(/([A-Z])/g, ' $1').trim())}
              </MenuItem>
            ))}
          </Select>
          {touchedFields['programType'] && errors['programType'] && (
            <FormHelperText>{errors['programType']}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12 }} mb={3}>
        <Typography
          variant="subtitle1"
          color="text.primary"
          fontWeight="bold"
          mb={1}
        >
          {t('Model')}
          <span className="new-program-mandatory">*</span>
        </Typography>
        <FormControl error={!!errors['model']}>
          <Box display="flex" flexDirection="row" gap={3}>
            {Object.entries(PROGRAM_TAB)
              .slice(1)
              .map(([labelKey, value]) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={models.includes(value)}
                      onChange={() => handleModelToggle(value)}
                    />
                  }
                  label={PROGRAM_TAB_LABELS[value as PROGRAM_TAB]}
                />
              ))}
          </Box>
          {errors['model'] && (
            <FormHelperText>{errors['model']}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 4 }} mb={3}>
        <Typography
          variant="subtitle1"
          color="text.primary"
          fontWeight="bold"
          mb={1}
        >
          {t('Program Manager')}
          <span className="new-program-mandatory">*</span>
        </Typography>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={programManagers}
          getOptionLabel={(option) => option.name}
          value={programManagers.filter((pm) =>
            selectedManagers.includes(pm.id),
          )}
          onChange={(_, newValue) => {
            setSelectedManagers(newValue.map((pm) => pm.id));
          }}
          onBlur={() => handleBlur('programManager')}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Select ${t('Program Managers')}`}
              error={
                !!errors['programManager'] && touchedFields['programManager']
              }
              helperText={
                touchedFields['programManager']
                  ? errors['programManager']
                  : ''
              }
              InputProps={{
                ...params.InputProps,
                sx: { borderRadius: '12px' },
              }}
            />
          )}
        />
      </Grid>
    </>
  );
}
