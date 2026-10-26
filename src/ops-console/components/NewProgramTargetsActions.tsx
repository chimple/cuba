import { Button, Grid, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { t } from 'i18next';
import { useNewProgramForm } from './useNewProgramForm';

type NewProgramForm = ReturnType<typeof useNewProgramForm>;

export default function NewProgramTargetsActions({
  form,
}: {
  form: NewProgramForm;
}) {
  const {
    endDate,
    errors,
    handleBlur,
    handleSave,
    handleStatsChange,
    isFormValid,
    navigateToProgramPage,
    setEndDate,
    setStartDate,
    setTouchedFields,
    startDate,
    stats,
    touchedFields,
  } = form;

  return (
    <>
      {[
        {
          label: 'Targeted No. of Schools',
          key: 'schools',
          placeholder: 'Enter No. of Schools',
        },
        {
          label: 'Targeted No. of Students',
          key: 'students',
          placeholder: 'Enter No. of Students',
        },
        {
          label: 'Targeted No. of Devices',
          key: 'devices',
          placeholder: 'Enter No. of Devices',
        },
      ].map(({ label, key, placeholder }) => (
        <Grid size={{ xs: 12, sm: 4 }} key={key} mb={3}>
          <Typography
            variant="subtitle1"
            color="text.primary"
            fontWeight="bold"
            mb={1}
          >
            {t(`${label}`)}
            {key === 'schools' && (
              <span className="new-program-mandatory">*</span>
            )}
          </Typography>
          <TextField
            placeholder={placeholder}
            fullWidth
            variant="outlined"
            value={stats[key as keyof typeof stats]}
            onChange={(e) => handleStatsChange(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            error={!!errors[key] && touchedFields[key]}
            helperText={touchedFields[key] ? errors[key] : ''}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />
        </Grid>
      ))}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid size={{ xs: 12 }} mb={3}>
          <Typography
            variant="subtitle1"
            color="text.primary"
            fontWeight="bold"
            mb={1}
          >
            {t('Program Date')}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label={t('Start Date')}
                value={startDate}
                onChange={(date: Dayjs | null) => {
                  setStartDate(date);
                  setTouchedFields((prev) => ({ ...prev, startDate: true }));
                }}
                format="DD/MM/YYYY"
                enableAccessibleFieldDOMStructure={false}
                slots={{ textField: TextField }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    onBlur: () => handleBlur('startDate'),
                    error:
                      !!errors['date'] &&
                      (touchedFields['startDate'] || touchedFields['endDate']),
                    helperText:
                      touchedFields['startDate'] || touchedFields['endDate']
                        ? errors['date']
                        : '',
                    variant: 'outlined',
                    InputProps: { sx: { borderRadius: '12px' } },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label={t('End Date')}
                value={endDate}
                onChange={(date: Dayjs | null) => {
                  setEndDate(date);
                  setTouchedFields((prev) => ({ ...prev, endDate: true }));
                }}
                format="DD/MM/YYYY"
                enableAccessibleFieldDOMStructure={false}
                slots={{ textField: TextField }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    onBlur: () => handleBlur('endDate'),
                    error:
                      !!errors['date'] &&
                      (touchedFields['startDate'] || touchedFields['endDate']),
                    helperText:
                      touchedFields['startDate'] || touchedFields['endDate']
                        ? errors['date']
                        : '',
                    variant: 'outlined',
                    InputProps: { sx: { borderRadius: '12px' } },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </LocalizationProvider>

      <Grid size={{ xs: 12 }} textAlign="right">
        <Button sx={{ mr: 2 }} color="primary" onClick={navigateToProgramPage}>
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: '8px' }}
          disabled={!isFormValid}
          onClick={handleSave}
        >
          {t('Save')}
        </Button>
      </Grid>
    </>
  );
}
