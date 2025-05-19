import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Button,
  FormHelperText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { ServiceConfig } from '../../services/ServiceConfig';



// geoData will change later, added now for test
const geoData = {
  Country: ['Country 1', 'Country 2'],
  State: ['State A', 'State B'],
  Block: ['Block X', 'Block Y'],
  Cluster: ['Cluster Alpha', 'Cluster Beta'],
  Village: ['Village One', 'Village Two'],
};

const NewProgram: React.FC = () => {
  // Partners
  const [partners, setPartners] = useState({
    implementation: '',
    funding: '',
    institute: '',
  });

  // Program Name
  const [programName, setProgramName] = useState('');

  // Location dropdown selections
  const [locations, setLocations] = useState({
    Country: '',
    State: '',
    Block: '',
    Cluster: '',
    Village: '',
  });

  // Program Type
  const [programType, setProgramType] = useState('Learning Centers');

  // Model checkboxes (multi-select)
  const [models, setModels] = useState<string[]>([]);

  // Program Manager checkboxes (multi-select)
  const programManagers = ['Naveen', 'Sakshi', 'Kritika'];
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  // Stats fields
  const [stats, setStats] = useState({
    institutes: '',
    students: '',
    devices: '',
  });

  // Dates
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Validation error states
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  // Handle partner change
  const handlePartnerChange = (field: string, value: string) => {
    setPartners((prev) => ({ ...prev, [field]: value }));
  };

  // Handle location change
  const handleLocationChange = (field: string, value: string) => {
    setLocations((prev) => ({ ...prev, [field]: value }));
  };

  // Handle model checkbox toggle
  const handleModelToggle = (model: string) => {
    setModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Handle program manager toggle
  const handleManagerToggle = (manager: string) => {
    setSelectedManagers((prev) =>
      prev.includes(manager)
        ? prev.filter((m) => m !== manager)
        : [...prev, manager]
    );
  };

  // Handle stats change
  const handleStatsChange = (field: string, value: string) => {
    // Allow only numeric input
    if (/^\d*$/.test(value)) {
      setStats((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Validation function
  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Partners required
    if (!partners.implementation.trim())
      newErrors['implementation'] = 'Implementation Partner is required';
    if (!partners.funding.trim())
      newErrors['funding'] = 'Funding Partner is required';
    if (!partners.institute.trim())
      newErrors['institute'] = 'Institute Partner is required';

    // Program name required
    if (!programName.trim()) newErrors['programName'] = 'Program Name is required';

    // Locations required
    Object.entries(locations).forEach(([key, value]) => {
      if (!value) newErrors[`location-${key}`] = `${key} is required`;
    });

    // Program Type required
    if (!programType) newErrors['programType'] = 'Program Type is required';

    // Model required (at least one)
    if (models.length === 0) newErrors['model'] = 'At least one model must be selected';

    // Program Manager required (at least one)
    if (selectedManagers.length === 0)
      newErrors['programManager'] = 'At least one Program Manager must be selected';

    // Stats required and numeric and > 0
    if (!stats.institutes) newErrors['institutes'] = 'No of Institutes is required';
    if (!stats.students) newErrors['students'] = 'No of Students is required';
    if (!stats.devices) newErrors['devices'] = 'No of Devices is required';

    // Dates required and startDate < endDate
    if (!startDate) newErrors['startDate'] = 'Start date is required';
    if (!endDate) newErrors['endDate'] = 'End date is required';
    if (startDate && endDate && startDate.isAfter(endDate))
      newErrors['date'] = 'Start date must be before End date';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle save click
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
      const api = ServiceConfig.getI().apiHandler;
      const res = await api.insertProgram(dataToSave);
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleCancel = () => {
    setPartners({ implementation: '', funding: '', institute: '' });
    setProgramName('XYZ');
    setLocations({ Country: '', State: '', Block: '', Cluster: '', Village: '' });
    setProgramType('Learning Centers');
    setModels([]);
    setSelectedManagers([]);
    setStats({ institutes: '', students: '', devices: '' });
    setStartDate(dayjs());
    setEndDate(dayjs());
    setErrors({});
  };

  return (
    <Box sx={{ height: '100vh', overflowY: 'auto' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
          {/* Page Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            New Program
          </Typography>

          {/* Breadcrumb */}
          <Box display="flex" alignItems="center" mb={3}>
            <Typography variant="body2" color="text.secondary">
              Programs
            </Typography>
            <ChevronRightIcon
              fontSize="small"
              sx={{ mx: 0.5, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              New Program
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Partners */}
            {[
              { label: 'Enter Implementation Partner', key: 'implementation' },
              { label: 'Enter Funding Partner', key: 'funding' },
              { label: 'Enter Institute Partner', key: 'institute' },
            ].map(({ label, key }, index) => (
              <Grid item xs={12} sm={4} key={key}>
                <TextField
                  label={label}
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

            {/* Program Name */}
            <Grid item xs={12} sm={4} md={4}>
              <TextField
                label="Program Name"
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

            {/* Location Dropdowns */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Location
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

            {/* Program Type */}
            <Grid item xs={12} sm={4} md={3}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Program Type
              </Typography>
              <FormControl fullWidth error={!!errors['programType']}>
                <Select
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="Learning Centers">Learning Centers</MenuItem>
                </Select>
                {errors['programType'] && (
                  <FormHelperText>{errors['programType']}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Model Checkboxes */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Model
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
                    label="At School"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={models.includes('At Home')}
                        onChange={() => handleModelToggle('At Home')}
                      />
                    }
                    label="At Home"
                  />
                  {errors['model'] && (
                    <FormHelperText>{errors['model']}</FormHelperText>
                  )}
                </Box>
              </FormControl>
            </Grid>

            {/* Program Manager Checkboxes */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Program Manager
              </Typography>
              <FormControl error={!!errors['programManager']}>
                <Box display="flex" flexDirection="row" gap={3}>
                  {programManagers.map((name, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={
                        <Checkbox
                          checked={selectedManagers.includes(name)}
                          onChange={() => handleManagerToggle(name)}
                        />
                      }
                      label={name}
                      sx={{ mr: 3 }}
                    />
                  ))}
                  {errors['programManager'] && (
                    <FormHelperText>{errors['programManager']}</FormHelperText>
                  )}
                </Box>
              </FormControl>
            </Grid>

            {/* Stats Fields */}
            {[
              { label: 'No of Institutes', key: 'institutes', placeholder: 'Enter No of Institutes' },
              { label: 'No of Students', key: 'students', placeholder: 'Enter No of Students' },
              { label: 'No of Devices', key: 'devices', placeholder: 'Enter No of Devices' },
            ].map(({ label, key, placeholder }) => (
              <Grid item xs={12} sm={4} key={key}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                  {label}
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

            {/* Program Dates */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Program Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Start date"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          variant="outlined"
                          error={!!errors['startDate'] || !!errors['date']}
                          helperText={errors['startDate'] || errors['date']}
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: '12px' },
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="End date"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          variant="outlined"
                          error={!!errors['endDate'] || !!errors['date']}
                          helperText={errors['endDate'] || errors['date']}
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: '12px' },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>

            {/* Footer Buttons */}
            <Grid item xs={12} textAlign="right">
              <Button sx={{ mr: 2 }} color="primary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ borderRadius: '8px' }}
                onClick={handleSave}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default NewProgram;