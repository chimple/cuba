import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Link,
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
  ListItemText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import dayjs, { Dayjs } from "dayjs";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router-dom";
import {
  PAGES,
  PROGRAM_TAB,
  ProgramType,
  PROGRAM_TAB_LABELS,
} from "../../common/constants";
import { t } from "i18next";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Link as RouterLink } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import "./NewProgram.css";

const NewProgram: React.FC = () => {
  const [partners, setPartners] = useState({
    implementation: "",
    funding: "",
    institute: "",
  });
  const [programName, setProgramName] = useState("");
  const [locations, setLocations] = useState({
    Country: "",
    State: "",
    District: "",
    Block: "",
    Cluster: "",
  });
  const [programType, setProgramType] = useState<ProgramType | "">("");
  const [models, setModels] = useState<string[]>([]);
  const [programManagers, setProgramManagers] = useState<
    { name: string; id: string }[]
  >([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [geoData, setGeoData] = useState<{
    Country: string[];
    State: string[];
    District: string[];
    Block: string[];
    Cluster: string[];
  }>({ Country: [], State: [], District: [], Block: [], Cluster: [] });
  
  const [isCountriesLoading, setCountriesLoading] = useState(false);
  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);
  const [isClustersLoading, setClustersLoading] = useState(false);
  const [stats, setStats] = useState({
    schools: "",
    students: "",
    devices: "",
  });
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [isEditingProgramName, setIsEditingProgramName] = useState(false);
  const programNameInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Validate form for enabling/disabling Save button (without setting errors)
  const checkFormValidity = () => {
    const isImplementationValid = partners.implementation.trim() !== "";
    const isFundingValid = partners.funding.trim() !== "";
    const isInstituteValid = partners.institute.trim() !== "";
    const isProgramNameValid = programName.trim() !== "";
    const isModelsValid = models.length > 0;
    const isProgramTypeValid = programType.trim() !== "";
    const isSchoolsValid = stats.schools !== "";
    const isManagersValid = selectedManagers.length > 0;
    const isCountryValid = locations.Country !== "";
    const isStateValid = locations.State !== "";
    const isDistrictValid = locations.District !== "";
    const isDateValid = !startDate || !endDate || !startDate.isAfter(endDate);

    return (
      isImplementationValid &&
      isFundingValid &&
      isInstituteValid &&
      isProgramNameValid &&
      isModelsValid &&
      isProgramTypeValid &&
      isSchoolsValid &&
      isManagersValid &&
      isCountryValid &&
      isStateValid &&
      isDistrictValid &&
      isDateValid
    );
  };

  useEffect(() => {
    setIsFormValid(checkFormValidity());
  }, [
    partners,
    programName,
    programType,
    models,
    selectedManagers,
    stats,
    locations,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!isEditingProgramName) {
      const generated = [
        partners.implementation,
        partners.funding,
        partners.institute,
      ]
        .filter(Boolean)
        .join(" ");
      setProgramName(generated);
    }
  }, [partners, isEditingProgramName]);

  useEffect(() => {
    if (isEditingProgramName && programNameInputRef.current) {
      programNameInputRef.current.focus();
    }
  }, [isEditingProgramName]);

  useEffect(() => {
    // Validate dates when either date changes and both are set
    if (startDate && endDate && (touchedFields["startDate"] || touchedFields["endDate"])) {
      validateField("date");
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchProgramManagers = async () => {
      try {
        const data = await api.getProgramManagers();
        setProgramManagers(data);
      } catch (error) {
        console.error(error);
      }
    };

    const loadCountries = async () => {
      setCountriesLoading(true);
      const data = await api.getGeoData({});
      setGeoData((prev) => ({ ...prev, Country: data }));
      setCountriesLoading(false);
    };

    fetchProgramManagers();
    loadCountries();
  }, [api]);

  // Load states when country changes
  useEffect(() => {
    setLocations((prev) => ({
      ...prev,
      State: "",
      District: "",
      Block: "",
      Cluster: "",
    }));
    setGeoData((prev) => ({
      ...prev,
      State: [],
      District: [],
      Block: [],
      Cluster: [],
    }));
    
    if (locations.Country) {
      const loadStates = async () => {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: locations.Country });
        setGeoData((prev) => ({ ...prev, State: data }));
        setStatesLoading(false);
      };
      loadStates();
    }
  }, [locations.Country, api]);

  // Load districts when state changes
  useEffect(() => {
    setLocations((prev) => ({
      ...prev,
      District: "",
      Block: "",
      Cluster: "",
    }));
    setGeoData((prev) => ({
      ...prev,
      District: [],
      Block: [],
      Cluster: [],
    }));
    
    if (locations.Country && locations.State) {
      const loadDistricts = async () => {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: locations.Country,
          p_state: locations.State,
        });
        setGeoData((prev) => ({ ...prev, District: data }));
        setDistrictsLoading(false);
      };
      loadDistricts();
    }
  }, [locations.State, api]);

  // Load blocks when district changes
  useEffect(() => {
    setLocations((prev) => ({
      ...prev,
      Block: "",
      Cluster: "",
    }));
    setGeoData((prev) => ({
      ...prev,
      Block: [],
      Cluster: [],
    }));
    
    if (locations.Country && locations.State && locations.District) {
      const loadBlocks = async () => {
        setBlocksLoading(true);
        const data = await api.getGeoData({
          p_country: locations.Country,
          p_state: locations.State,
          p_district: locations.District,
        });
        setGeoData((prev) => ({ ...prev, Block: data }));
        setBlocksLoading(false);
      };
      loadBlocks();
    }
  }, [locations.District, api]);

  // Load clusters when block changes
  useEffect(() => {
    setLocations((prev) => ({
      ...prev,
      Cluster: "",
    }));
    setGeoData((prev) => ({
      ...prev,
      Cluster: [],
    }));
    
    if (locations.Country && locations.State && locations.District && locations.Block) {
      const loadClusters = async () => {
        setClustersLoading(true);
        const data = await api.getGeoData({
          p_country: locations.Country,
          p_state: locations.State,
          p_district: locations.District,
          p_block: locations.Block,
        });
        setGeoData((prev) => ({ ...prev, Cluster: data }));
        setClustersLoading(false);
      };
      loadClusters();
    }
  }, [locations.Block, api]);

  const handlePartnerChange = (field: string, value: string) => {
    setPartners((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  const getValidationErrors = (): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};

    // Validate partner fields
    if (!partners.implementation.trim())
      newErrors["implementation"] = t("Implementation Partner is required");
    if (!partners.funding.trim())
      newErrors["funding"] = t("Funding Partner is required");
    if (!partners.institute.trim())
      newErrors["institute"] = t("Institute Partner is required");
    
    // Validate program name
    if (!programName.trim())
      newErrors["programName"] = t("Program Name is required");
    
    // Validate models
    if (models.length === 0)
      newErrors["model"] = t("At least one model must be selected");
    
    // Validate program type
    if (!programType.trim())
      newErrors["programType"] = t("Program Type is required");
    
    // Validate schools
    if (!stats.schools) 
      newErrors["schools"] = t("No. of Schools is required");
    
    // Validate program managers
    if (selectedManagers.length === 0)
      newErrors["programManager"] = t("Program Manager is required");
    
    // Validate date
    if (startDate && endDate && startDate.isAfter(endDate))
      newErrors["date"] = t("Start date must be before End date");

    // Validate locations
    Object.entries(locations).forEach(([key, value]) => {
      if (["Country", "State", "District"].includes(key) && !value) {
        newErrors[`location-${key}`] = t("{{key}} is required", { key });
      }
    });

    return newErrors;
  };

  const validateField = (fieldName: string) => {
    const allErrors = getValidationErrors();
    const newErrors = { ...errors };

    // Map of field names to their error keys
    const fieldErrorKeys: { [key: string]: string } = {
      implementation: "implementation",
      funding: "funding",
      institute: "institute",
      programName: "programName",
      programType: "programType",
      schools: "schools",
      programManager: "programManager",
      Country: "location-Country",
      State: "location-State",
      District: "location-District",
      Block: "location-Block",
      Cluster: "location-Cluster",
      startDate: "date",
      endDate: "date",
      date: "date",
    };

    const errorKey = fieldErrorKeys[fieldName];
    if (errorKey) {
      if (allErrors[errorKey]) {
        newErrors[errorKey] = allErrors[errorKey];
      } else {
        delete newErrors[errorKey];
      }
    }

    setErrors(newErrors);
  };

  const handleLocationChange = (field: string, value: string | null) => {
    setLocations((prev) => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      validateField(field);
    }
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
    // Mark all fields as touched when validating on save
    const allFields = {
      implementation: true,
      funding: true,
      institute: true,
      programName: true,
      programType: true,
      model: true,
      programManager: true,
      Country: true,
      State: true,
      District: true,
      Block: true,
      Cluster: true,
      schools: true,
      students: true,
      devices: true,
      startDate: true,
      endDate: true,
      date: true,
    };
    
    setTouchedFields(allFields);

    // Get all validation errors and set them
    const newErrors = getValidationErrors();
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
      startDate: startDate?.format("YYYY-MM-DD"),
      endDate: endDate?.format("YYYY-MM-DD"),
    };
    try {
      const res = await api.insertProgram(dataToSave);
      if (res) {
        clearForm();
        history.replace(PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE);
      } else {
        console.error("Error in saving ops program");
      }
    } catch (error) {
      console.error("Error saving program:", error);
    }
  };

  const navigateToProgramPage = () => {
    clearForm();
    history.replace(PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE);
  };

  const clearForm = () => {
    setPartners({ implementation: "", funding: "", institute: "" });
    setProgramName("");
    setLocations({
      Country: "",
      State: "",
      District: "",
      Block: "",
      Cluster: "",
    });
    setProgramType(ProgramType.LearningCenter);
    setModels([]);
    setSelectedManagers([]);
    setStats({ schools: "", students: "", devices: "" });
    setStartDate(dayjs());
    setEndDate(dayjs());
    setErrors({});
    setTouchedFields({});
  };

  return (
    <Box sx={{ height: "100vh", overflowY: "auto", m: 0, p: 0 }}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <Box mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography color="text.primary" variant="h4" fontWeight="bold">
              {t("New Program")}
            </Typography>
            <NotificationsIcon
              sx={{ color: "text.secondary", cursor: "pointer" }}
            />
          </Box>

          <Box display="flex" alignItems="center" mt={1}>
            <Link
              component={RouterLink}
              to={PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE}
              variant="body2"
              color="primary"
              underline="none"
            >
              <Typography variant="body2" color="text.secondary">
                {t("Programs")}
              </Typography>
            </Link>
            <PlayArrowIcon
              fontSize="small"
              sx={{ mx: 0.5, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight="bold"
            >
              {t("New Program")}
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
          <Grid container spacing={3}>
            {[
              {
                title: "Implementation Partner",
                placeholder: "Enter Implementation Partner",
                key: "implementation",
              },
              {
                title: "Funding Partner",
                placeholder: "Enter Funding Partner",
                key: "funding",
              },
              {
                title: "Institute Partner",
                placeholder: "Enter Institute Partner",
                key: "institute",
              },
            ].map(({ title, placeholder, key }) => (
              <Grid size={{ xs: 12, sm: 4 }} key={key} mb={3}>
                <Typography
                  fontWeight="bold"
                  color="text.primary"
                  mb={1}
                  sx={{ textAlign: "left" }}
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
                  helperText={touchedFields[key] ? errors[key] : ""}
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                    },
                  }}
                />
              </Grid>
            ))}

            <Grid size={{ xs: 12, sm: 4 }} mb={3}>
              <Typography
                fontWeight="bold"
                color="text.primary"
                mb={1}
                sx={{ textAlign: "left" }}
              >
                {t("Program Name")}
                <span className="new-program-mandatory">*</span>
              </Typography>
              <TextField
                inputRef={programNameInputRef}
                fullWidth
                variant="outlined"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                onBlur={() => handleBlur("programName")}
                disabled={!isEditingProgramName}
                error={!!errors["programName"] && touchedFields["programName"]}
                helperText={touchedFields["programName"] ? errors["programName"] : ""}
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
                  sx: { borderRadius: "12px" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    paddingRight: 0.5,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }} mb={3}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                fontWeight="bold"
                mb={1}
              >
                {t("Location")}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <FormControl fullWidth error={!!errors[`location-Country`]}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mr: 0.5,
                          marginBottom: 1,
                        }}
                      >
                        Country
                      </Typography>
                      <span className="new-program-mandatory">*</span>
                    </Box>
                    <Autocomplete
                      options={geoData.Country}
                      value={locations.Country || ""}
                      loading={isCountriesLoading}
                      onChange={(_, newValue) => {
                        handleLocationChange("Country", newValue || "");
                      }}
                      onBlur={() => handleBlur("Country")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Country"
                          error={!!errors[`location-Country`] && touchedFields["Country"]}
                          helperText={touchedFields["Country"] ? errors[`location-Country`] : ""}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: "12px",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <FormControl fullWidth error={!!errors[`location-State`]}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mr: 0.5,
                          marginBottom: 1,
                        }}
                      >
                        State
                      </Typography>
                      <span className="new-program-mandatory">*</span>
                    </Box>
                    <Autocomplete
                      options={geoData.State}
                      value={locations.State || ""}
                      loading={isStatesLoading}
                      disabled={!locations.Country}
                      onChange={(_, newValue) => {
                        handleLocationChange("State", newValue || "");
                      }}
                      onBlur={() => handleBlur("State")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select State"
                          error={!!errors[`location-State`] && touchedFields["State"]}
                          helperText={touchedFields["State"] ? errors[`location-State`] : ""}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: "12px",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <FormControl fullWidth error={!!errors[`location-District`]}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mr: 0.5,
                          marginBottom: 1,
                        }}
                      >
                        District
                      </Typography>
                      <span className="new-program-mandatory">*</span>
                    </Box>
                    <Autocomplete
                      options={geoData.District}
                      value={locations.District || ""}
                      loading={isDistrictsLoading}
                      disabled={!locations.State}
                      onChange={(_, newValue) => {
                        handleLocationChange("District", newValue || "");
                      }}
                      onBlur={() => handleBlur("District")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select District"
                          error={!!errors[`location-District`] && touchedFields["District"]}
                          helperText={touchedFields["District"] ? errors[`location-District`] : ""}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: "12px",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <FormControl fullWidth error={!!errors[`location-Block`]}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mr: 0.5,
                          marginBottom: 1,
                        }}
                      >
                        Block
                      </Typography>
                    </Box>
                    <Autocomplete
                      options={geoData.Block}
                      value={locations.Block || ""}
                      loading={isBlocksLoading}
                      disabled={!locations.District}
                      onChange={(_, newValue) => {
                        handleLocationChange("Block", newValue || "");
                      }}
                      onBlur={() => handleBlur("Block")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Block"
                          error={!!errors[`location-Block`] && touchedFields["Block"]}
                          helperText={touchedFields["Block"] ? errors[`location-Block`] : ""}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: "12px",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <FormControl fullWidth error={!!errors[`location-Cluster`]}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mr: 0.5,
                          marginBottom: 1,
                        }}
                      >
                        Cluster
                      </Typography>
                    </Box>
                    <Autocomplete
                      options={geoData.Cluster}
                      value={locations.Cluster || ""}
                      loading={isClustersLoading}
                      disabled={!locations.Block}
                      onChange={(_, newValue) => {
                        handleLocationChange("Cluster", newValue || "");
                      }}
                      onBlur={() => handleBlur("Cluster")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Cluster"
                          error={!!errors[`location-Cluster`] && touchedFields["Cluster"]}
                          helperText={touchedFields["Cluster"] ? errors[`location-Cluster`] : ""}
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: "12px",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 4 }} mb={3}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                fontWeight="bold"
                mb={1}
              >
                {t("Program Type")}
                <span className="new-program-mandatory">*</span>
              </Typography>
              <FormControl fullWidth error={!!errors["programType"] && touchedFields["programType"]}>
                <InputLabel>{`Select ${t("Program Type")}`}</InputLabel>
                <Select
                  label={`Select ${t("Program Type")}`}
                  value={programType}
                  onChange={(e: any) => setProgramType(e.target.value)}
                  onBlur={() => handleBlur("programType")}
                  sx={{ borderRadius: "12px" }}
                >
                  {Object.entries(ProgramType).map(([label, value]) => (
                    <MenuItem key={value} value={value}>
                      {t(label.replace(/([A-Z])/g, " $1").trim())}
                    </MenuItem>
                  ))}
                </Select>
                {touchedFields["programType"] && errors["programType"] && (
                  <FormHelperText>{errors["programType"]}</FormHelperText>
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
                {t("Model")}
                <span className="new-program-mandatory">*</span>
              </Typography>
              <FormControl error={!!errors["model"]}>
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
                {errors["model"] && (
                  <FormHelperText>{errors["model"]}</FormHelperText>
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
                {t("Program Manager")}
                <span className="new-program-mandatory">*</span>
              </Typography>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={programManagers}
                getOptionLabel={(option) => option.name}
                value={programManagers.filter((pm) =>
                  selectedManagers.includes(pm.id)
                )}
                onChange={(_, newValue) => {
                  setSelectedManagers(newValue.map((pm) => pm.id));
                }}
                onBlur={() => handleBlur("programManager")}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox checked={selected} sx={{ mr: 1 }} />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${t("Program Managers")}`}
                    error={!!errors["programManager"] && touchedFields["programManager"]}
                    helperText={touchedFields["programManager"] ? errors["programManager"] : ""}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        borderRadius: "12px",
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {[
              {
                label: "Targeted No. of Schools",
                key: "schools",
                placeholder: "Enter No. of Schools",
              },
              {
                label: "Targeted No. of Students",
                key: "students",
                placeholder: "Enter No. of Students",
              },
              {
                label: "Targeted No. of Devices",
                key: "devices",
                placeholder: "Enter No. of Devices",
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
                  {key === "schools" && (
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
                  helperText={touchedFields[key] ? errors[key] : ""}
                  InputProps={{ sx: { borderRadius: "12px" } }}
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
                  {t("Program Date")}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DatePicker
                      label={t("Start Date")}
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
                          onBlur: () => handleBlur("startDate"),
                          error: !!errors["date"] && (touchedFields["startDate"] || touchedFields["endDate"]),
                          helperText: (touchedFields["startDate"] || touchedFields["endDate"]) ? errors["date"] : "",
                          variant: "outlined",
                          InputProps: {
                            sx: { borderRadius: "12px" },
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DatePicker
                      label={t("End Date")}
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
                          onBlur: () => handleBlur("endDate"),
                          error: !!errors["date"] && (touchedFields["startDate"] || touchedFields["endDate"]),
                          helperText: (touchedFields["startDate"] || touchedFields["endDate"]) ? errors["date"] : "",
                          variant: "outlined",
                          InputProps: {
                            sx: { borderRadius: "12px" }, // Styling preserved
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid size={{ xs: 12 }} textAlign="right">
              <Button
                sx={{ mr: 2 }}
                color="primary"
                onClick={navigateToProgramPage}
              >
                {t("Cancel")}
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ borderRadius: "8px" }}
                disabled={!isFormValid}
                onClick={handleSave}
              >
                {t("Save")}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
export default NewProgram;
