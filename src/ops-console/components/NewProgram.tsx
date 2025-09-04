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
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [isEditingProgramName, setIsEditingProgramName] = useState(false);
  const programNameInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  useEffect(() => {
    const isValid = validate();
    setIsFormValid(isValid);
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
    const fetchProgramManagers = async () => {
      try {
        const data = await api.getProgramManagers();
        setProgramManagers(data);
      } catch (error) {
        console.error(error);
      }
    };

    const handlePartnerChange = (field: string, value: string) => {
      setPartners((prev) => ({ ...prev, [field]: value }));
      setIsEditingProgramName(false);
    };

    const fetchGeoData = async () => {
      try {
        const data = await api.getUniqueGeoData();
        const uniqueGeoData = {
          Country: [...new Set(data.Country.filter(Boolean))],
          State: [...new Set(data.State.filter(Boolean))],
          District: [...new Set(data.District.filter(Boolean))],
          Block: [...new Set(data.Block.filter(Boolean))],
          Cluster: [...new Set(data.Cluster.filter(Boolean))],
        };
        setGeoData(uniqueGeoData);
      } catch (error) {
        console.error("Error fetching geo data:", error);
      }
    };
    fetchGeoData();
    fetchProgramManagers();
  }, []);

  const handlePartnerChange = (field: string, value: string) => {
    setPartners((prev) => ({ ...prev, [field]: value }));
  };
  const handleLocationChange = (field: string, value: string | null) => {
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
      newErrors["implementation"] = t("Implementation Partner is required");
    if (!partners.funding.trim())
      newErrors["funding"] = t("Funding Partner is required");
    if (!partners.institute.trim())
      newErrors["institute"] = t("Institute Partner is required");
    if (!programName.trim())
      newErrors["programName"] = t("Program Name is required");
    if (models.length === 0)
      newErrors["model"] = t("At least one model must be selected");
    if (!programType.trim())
      newErrors["programType"] = t("Program Type is required");
    if (!stats.schools) newErrors["schools"] = t("No. of Schools is required");
    if (selectedManagers.length === 0)
      newErrors["programManager"] = t("Program Manager is required");
    // The following fields are optional, so they are commented out
    // if (!stats.students)
    //   newErrors["students"] = t("No. of Students is required");
    // if (!stats.devices) newErrors["devices"] = t("No. of Devices is required");
    // if (!startDate) newErrors["startDate"] = t("Start date is required");
    // if (!endDate) newErrors["endDate"] = t("End date is required");
    if (startDate && endDate && startDate.isAfter(endDate))
      newErrors["date"] = t("Start date must be before End date");

    Object.entries(locations).forEach(([key, value]) => {
      if (["Country", "State", "District"].includes(key) && !value) {
        newErrors[`location-${key}`] = t("{{key}} is required", { key });
      }
    });

    if (!errors) setErrors(newErrors);
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
              <Grid item xs={12} sm={4} key={key} mb={3}>
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
                  inputRef={programNameInputRef}
                  fullWidth
                  variant="outlined"
                  value={partners[key as keyof typeof partners]}
                  onChange={(e) => handlePartnerChange(key, e.target.value)}
                  error={!!errors[key]}
                  helperText={errors[key]}
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                    },
                  }}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={4} md={4} mb={3}>
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
                disabled={!isEditingProgramName}
                error={!!errors["programName"]}
                helperText={errors["programName"]}
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

            <Grid item xs={12} mb={3}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                fontWeight="bold"
                mb={1}
              >
                {t("Location")}
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(geoData).map((label) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={label}>
                    <FormControl
                      fullWidth
                      error={!!errors[`location-${label}`]}
                    >
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
                          {label}
                        </Typography>

                        {label !== "Block" && label !== "Cluster" && (
                          <span className="new-program-mandatory">*</span>
                        )}
                      </Box>

                      <Autocomplete
                        options={geoData[label as keyof typeof geoData]}
                        value={locations[label as keyof typeof locations] || ""}
                        onChange={(_, newValue) => {
                          handleLocationChange(label, newValue || "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select ${label}`}
                            error={!!errors[`location-${label}`]}
                            helperText={errors[`location-${label}`] || ""}
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
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} sm={4} md={4} mb={3}>
              <Typography
                variant="subtitle1"
                color="text.primary"
                fontWeight="bold"
                mb={1}
              >
                {t("Program Type")}
                <span className="new-program-mandatory">*</span>
              </Typography>
              <FormControl fullWidth error={!!errors["programType"]}>
                <InputLabel>{`Select ${t("Program Type")}`}</InputLabel>
                <Select
                  label={`Select ${t("Program Type")}`}
                  value={programType}
                  onChange={(e: any) => setProgramType(e.target.value)}
                  sx={{ borderRadius: "12px" }}
                >
                  {Object.entries(ProgramType).map(([label, value]) => (
                    <MenuItem key={value} value={value}>
                      {t(label.replace(/([A-Z])/g, " $1").trim())}
                    </MenuItem>
                  ))}
                </Select>
                {errors["programType"] && (
                  <FormHelperText>{errors["programType"]}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} mb={3}>
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

            <Grid container ml={3} mb={3}>
              <Grid item xs={12} sm={4} md={4}>
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
                      error={!!errors["programManager"]}
                      helperText={errors["programManager"] || ""}
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
              <Grid item xs={12} sm={4} key={key} mb={3}>
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
                  error={!!errors[key]}
                  helperText={errors[key]}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>
            ))}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid item xs={12} mb={3}>
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  fontWeight="bold"
                  mb={1}
                >
                  {t("Program Date")}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label={t("Start Date")}
                      value={startDate}
                      onChange={(date: Dayjs | null) => setStartDate(date)}
                      inputFormat="DD/MM/YYYY"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors["startDate"] || !!errors["date"]}
                          helperText={errors["startDate"] || errors["date"]}
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: "12px" },
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label={t("End Date")}
                      value={endDate}
                      onChange={(date: Dayjs | null) => setEndDate(date)}
                      inputFormat="DD/MM/YYYY"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors["endDate"] || !!errors["date"]}
                          helperText={errors["endDate"] || errors["date"]}
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: "12px" },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid item xs={12} textAlign="right">
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
