import React, { useEffect, useState } from 'react';
import { Box, Grid, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel, Container, Paper, InputAdornment, IconButton, Button, FormHelperText, ListItemText, } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';
import { ServiceConfig } from '../../services/ServiceConfig';
import { useHistory } from 'react-router-dom';
import { PAGES, ProgramType } from '../../common/constants';
import { t } from 'i18next';

const NewProgram: React.FC = () => {
  const [partners, setPartners] = useState({ implementation: '', funding: '', institute: '', });
  const [programName, setProgramName] = useState('');
  const [locations, setLocations] = useState({ Country: '', State: '', District: '', Block: '', Cluster: '', });
  const [programType, setProgramType] = useState<ProgramType | ''>('');
  const [models, setModels] = useState<string[]>([]);
  const [programManagers, setProgramManagers] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [geoData, setGeoData] = useState<{ Country: string[]; State: string[]; District: string[]; Block: string[]; Cluster: string[]; }>({ Country: [], State: [], District: [], Block: [], Cluster: [], });
  const [stats, setStats] = useState({ institutes: '', students: '', devices: '', });
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    const fetchProgramManagers = async () => {
      try {
        const data = await api.getProgramManagers();
        setProgramManagers(data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchGeoData = async () => {
      try {
        const data = await api.getUniqueGeoData();
        const uniqueGeoData = {
          Country: [...new Set(data.Country.filter(Boolean))],
          State: [...new Set(data.State.filter(Boolean))],
          Block: [...new Set(data.Block.filter(Boolean))],
          Cluster: [...new Set(data.Cluster.filter(Boolean))],
          District: [...new Set(data.District.filter(Boolean))],
        };
        setGeoData(uniqueGeoData);
      } catch (error) {
        console.error('Error fetching geo data:', error);
      }
    };
    fetchGeoData();
    fetchProgramManagers();
  }, []);

  const handlePartnerChange = (field: string, value: string) => {
    setPartners((prev) => ({ ...prev, [field]: value }));
  };
  const handleLocationChange = (field: string, value: string) => {
    setLocations((prev) => ({ ...prev, [field]: value }));
  };
  const handleModelToggle = (model: string) => {
    setModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };
  const handleStatsChange = (field: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setStats((prev) => ({ ...prev, [field]: value }));
    }
  };
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!partners.implementation.trim())
      newErrors['implementation'] = t('Implementation Partner is required');
    if (!partners.funding.trim())
      newErrors['funding'] = t('Funding Partner is required');
    if (!partners.institute.trim())
      newErrors['institute'] = t('Institute Partner is required');
    if (!programName.trim())
      newErrors['programName'] = t('Program Name is required');
    if (models.length === 0)
      newErrors['model'] = t('At least one model must be selected');
    if (!programType.trim())
      newErrors['programType'] = t('Program Type is required');
    if (!stats.institutes)
      newErrors['institutes'] = t('No of Institutes is required');
    if (!stats.students)
      newErrors['students'] = t('No of Students is required');
    if (!stats.devices)
      newErrors['devices'] = t('No of Devices is required');
    if (!startDate)
      newErrors['startDate'] = t('Start date is required');
    if (!endDate)
      newErrors['endDate'] = t('End date is required');
    if (startDate && endDate && startDate.isAfter(endDate))
      newErrors['date'] = t('Start date must be before End date');

    Object.entries(locations).forEach(([key, value]) => {
      if (!value)
        newErrors[`location-${key}`] = t('{{key}} is required', { key });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const dataToSave = {
      partners,
      programName,
      locations,
      programType,
      models,
      selectedManagers,
      stats,
      startDate: startDate?.format('YYYY-MM-DD'),
      endDate: endDate?.format('YYYY-MM-DD'),
    };
    try {
      const res = await api.insertProgram(dataToSave);
      if(res) {
          clearForm();
          history.replace(PAGES.PROGRAM_PAGE);
      } else {
         console.error('Error in saving ops program');
      }
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const clearForm = () => {
    setPartners({ implementation: '', funding: '', institute: '' });
    setProgramName('');
    setLocations({ Country: '', State: '', District: '', Block: '', Cluster: '' });
    setProgramType('');
    setModels([]);
    setSelectedManagers([]);
    setStats({ institutes: '', students: '', devices: '' });
    setStartDate(dayjs());
    setEndDate(dayjs());
    setErrors({});
  };

  return (
    <Box sx={{ height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
           {t('New Program')}
          </Typography>
          <Box display="flex" alignItems="center" mb={3}>
            <Typography variant="body2" color="text.secondary">
              {t('Programs')}   
            </Typography>
            <ChevronRightIcon
              fontSize="small"
              sx={{ mx: 0.5, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {t('New Program')}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[ { label: 'Enter Implementation Partner', key: 'implementation' }, { label: 'Enter Funding Partner', key: 'funding' }, { label: 'Enter Institute Partner', key: 'institute' }, ].map(({ label, key }, index) => (
              <Grid item xs={12} sm={4} key={key}>
                <TextField
                  label={t(`${label}`)}
                  fullWidth
                  variant="outlined"
                  value={partners[key as keyof typeof partners]}
                  onChange={(e) => handlePartnerChange(key, e.target.value)}
                  error={!!errors[key]}
                  helperText={errors[key]}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={4} md={4}>
              <TextField
                label={t("Program Name")}
                fullWidth
                variant="outlined"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                error={!!errors['programName']}
                helperText={errors['programName']}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" sx={{ mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '12px',
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    paddingRight: 0.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                {t('Location')}
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(geoData).map((label) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={label}>
                    <FormControl
                      fullWidth
                      error={!!errors[`location-${label}`]}
                    >
                      <InputLabel>{`Select ${label}`}</InputLabel>
                      <Select
                        label={`Select ${label}`}
                        value={locations[label as keyof typeof locations]}
                        onChange={(e) =>
                          handleLocationChange(label, e.target.value)
                        }
                        sx={{ borderRadius: '12px' }}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {geoData[label as keyof typeof geoData].map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors[`location-${label}`] && (
                        <FormHelperText>{errors[`location-${label}`]}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                    {t('Program Type')}
                </Typography>
                <FormControl fullWidth error={!!errors['programType']}>
                    <Select
                    value={programType}
                    onChange={(e:any) => setProgramType(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                    >
                    <MenuItem value="" disabled>{t('Select')}</MenuItem>
                    {Object.values(ProgramType).map((type) => (
                        <MenuItem key={type} value={type}>
                        {t(`${type}`)}
                        </MenuItem>
                    ))}
                    </Select>
                    {errors['programType'] && (
                    <FormHelperText>{errors['programType']}</FormHelperText>
                    )}
                </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                {t('Model')}
              </Typography>
              <FormControl error={!!errors['model']}>
                <Box display="flex" flexDirection="row" gap={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={models.includes('At School')}
                        onChange={() => handleModelToggle('At School')}
                      />
                    }
                    label={t("At School")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={models.includes('At Home')}
                        onChange={() => handleModelToggle('At Home')}
                      />
                    }
                    label={t("At Home")}
                  />
                  {errors['model'] && (
                    <FormHelperText>{errors['model']}</FormHelperText>
                  )}
                </Box>
              </FormControl>
            </Grid>

            <Grid container sx={{ marginLeft: '24px', marginTop: '10px' }}>
              <Grid item xs={12} sm={4} md={4}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                  {t('Program Manager')}
                </Typography>
                <FormControl fullWidth error={!!errors['programManager']} >
                  <Select
                    multiple
                    value={selectedManagers}
                    onChange={(e) => setSelectedManagers(e.target.value as string[])}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="" disabled>{t('Select')}</MenuItem>
                    {programManagers.map((name, idx) => (
                      <MenuItem key={idx} value={name}>
                        <Checkbox checked={selectedManagers.includes(name)} />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                  {errors['programManager'] && (
                    <FormHelperText>{errors['programManager']}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {[
              { label: 'No of Institutes', key: 'institutes', placeholder: 'Enter No of Institutes' },
              { label: 'No of Students', key: 'students', placeholder: 'Enter No of Students' },
              { label: 'No of Devices', key: 'devices', placeholder: 'Enter No of Devices' },
            ].map(({ label, key, placeholder }) => (
              <Grid item xs={12} sm={4} key={key}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                    {t(`${label}`)}
                </Typography>
                <TextField
                  placeholder={placeholder}
                  fullWidth
                  variant="outlined"
                  value={stats[key as keyof typeof stats]}
                  onChange={(e) => handleStatsChange(key, e.target.value)}
                  error={!!errors[key]}
                  helperText={errors[key]}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                    {t('Program Date')}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        label={t('Start date')}
                        type="date"
                        value={startDate ? startDate.format('YYYY-MM-DD') : ''}
                        onChange={(e:any) => setStartDate(e.target.value ? dayjs(e.target.value) : null)}
                        fullWidth
                        variant="outlined"
                        error={!!errors['startDate'] || !!errors['date']}
                        helperText={errors['startDate'] || errors['date']}
                        InputLabelProps={{
                        shrink: true,
                        }}
                        InputProps={{
                        sx: { borderRadius: '12px' },
                        }}
                    />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        label={t('End date')}
                        type="date"
                        value={endDate ? endDate.format('YYYY-MM-DD') : ''}
                        onChange={(e:any) => setEndDate(e.target.value ? dayjs(e.target.value) : null)}
                        fullWidth
                        variant="outlined"
                        error={!!errors['endDate'] || !!errors['date']}
                        helperText={errors['endDate'] || errors['date']}
                        InputLabelProps={{
                        shrink: true,
                        }}
                        InputProps={{
                        sx: { borderRadius: '12px' },
                        }}
                    />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12} textAlign="right">
              <Button sx={{ mr: 2 }} color="primary" onClick={clearForm}>
                {t('Cancel')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ borderRadius: '8px' }}
                onClick={handleSave}>
                {t('Save')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
export default NewProgram;