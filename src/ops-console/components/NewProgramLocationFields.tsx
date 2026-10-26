import { Autocomplete, Box, FormControl, Grid, TextField, Typography } from '@mui/material';
import { useNewProgramForm } from './useNewProgramForm';

type NewProgramForm = ReturnType<typeof useNewProgramForm>;

const locationFields = [
  { key: 'Country', loadingKey: 'isCountriesLoading' },
  { key: 'State', loadingKey: 'isStatesLoading' },
  { key: 'District', loadingKey: 'isDistrictsLoading' },
] as const;

export default function NewProgramLocationFields({ form }: { form: NewProgramForm }) {
  const {
    errors,
    geoData,
    handleBlur,
    handleLocationChange,
    isCountriesLoading,
    isDistrictsLoading,
    isStatesLoading,
    locations,
    touchedFields,
  } = form;
  const loadingByKey = {
    isCountriesLoading,
    isStatesLoading,
    isDistrictsLoading,
  };

  return (
    <Grid size={{ xs: 12 }} mb={3}>
      <Typography
        variant="subtitle1"
        color="text.primary"
        fontWeight="bold"
        mb={1}
      >
        Location
      </Typography>
      <Grid container spacing={2}>
        {locationFields.map(({ key, loadingKey }) => (
          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 4 }} key={key}>
            <FormControl fullWidth error={!!errors[`location-${key}`]}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mr: 0.5,
                    marginBottom: 1,
                  }}
                >
                  {key}
                </Typography>
                <span className="new-program-mandatory">*</span>
              </Box>
              <Autocomplete
                options={geoData[key]}
                value={locations[key] || ''}
                loading={loadingByKey[loadingKey]}
                disabled={
                  (key === 'State' && !locations.Country) ||
                  (key === 'District' && !locations.State)
                }
                onChange={(_, newValue) => {
                  handleLocationChange(key, newValue || '');
                }}
                onBlur={() => handleBlur(key)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${key}`}
                    error={
                      !!errors[`location-${key}`] && touchedFields[key]
                    }
                    helperText={
                      touchedFields[key] ? errors[`location-${key}`] : ''
                    }
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: '12px' },
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
