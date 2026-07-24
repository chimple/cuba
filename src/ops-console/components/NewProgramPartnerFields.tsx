import { Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { t } from 'i18next';
import { useNewProgramForm } from './useNewProgramForm';

type NewProgramForm = ReturnType<typeof useNewProgramForm>;

export default function NewProgramPartnerFields({ form }: { form: NewProgramForm }) {
  const {
    errors,
    handleBlur,
    handlePartnerChange,
    isEditingProgramName,
    partners,
    programName,
    programNameInputRef,
    setIsEditingProgramName,
    setProgramName,
    touchedFields,
  } = form;

  return (
    <>
      {[
        {
          title: 'Implementation Partner',
          placeholder: 'Enter Implementation Partner',
          key: 'implementation',
        },
        {
          title: 'Funding Partner',
          placeholder: 'Enter Funding Partner',
          key: 'funding',
        },
        {
          title: 'Institute Partner',
          placeholder: 'Enter Institute Partner',
          key: 'institute',
        },
      ].map(({ title, key }) => (
        <Grid size={{ xs: 12, sm: 4 }} key={key} mb={3}>
          <Typography
            fontWeight="bold"
            color="text.primary"
            mb={1}
            sx={{ textAlign: 'left' }}
          >
            {t(title).toString()}
            <span className="new-program-mandatory">*</span>
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={partners[key as keyof typeof partners]}
            onChange={(e) => handlePartnerChange(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            error={!!errors[key] && touchedFields[key]}
            helperText={touchedFields[key] ? errors[key] : ''}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />
        </Grid>
      ))}

      <Grid size={{ xs: 12, sm: 4 }} mb={3}>
        <Typography
          fontWeight="bold"
          color="text.primary"
          mb={1}
          sx={{ textAlign: 'left' }}
        >
          {t('Program Name')}
          <span className="new-program-mandatory">*</span>
        </Typography>
        <TextField
          inputRef={programNameInputRef}
          fullWidth
          variant="outlined"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          onBlur={() => handleBlur('programName')}
          disabled={!isEditingProgramName}
          error={!!errors['programName'] && touchedFields['programName']}
          helperText={touchedFields['programName'] ? errors['programName'] : ''}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  sx={{ mr: 0.5 }}
                  onClick={() => setIsEditingProgramName(true)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: '12px' },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              paddingRight: 0.5,
            },
          }}
        />
      </Grid>
    </>
  );
}
