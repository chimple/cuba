import React, { useState, useEffect } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { PAGES, DEFAULT_PAGE_SIZE, REQUEST_TABS, RequestTypes, TableTypes } from "../../common/constants";
import { useTranslation } from "react-i18next";
import { Typography, Divider, Paper, Button, TextField, Select, MenuItem, FormControl, Grid, CircularProgress, Autocomplete } from "@mui/material";
import "./OpsFlaggedRequestDetails.css";
import { ServiceConfig } from "../../services/ServiceConfig";

const OpsFlaggedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  const [requestDetails, setRequestDetails] = useState<TableTypes<"ops_requests"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable field states
  const [selectedRequestType, setSelectedRequestType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [schoolInputValue, setSchoolInputValue] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Dropdown options states
  const [requestTypeOptions, setRequestTypeOptions] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [schoolOptions, setSchoolOptions] = useState<Array<{ id: string; name: string; udise?: string }>>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isFetchingSchool, setIsFetchingSchool] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialUdiseSet, setInitialUdiseSet] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
    fetchDropdownOptions();
  }, [id]);

  // Debounce UDISE input and fetch school details
  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    if (!initialUdiseSet) {
      setInitialUdiseSet(true);
      return;
    }

    const handler = setTimeout(() => {
      if (selectedSchoolUdise && selectedSchoolUdise.length >= 3) {
        fetchSchoolByUdise(selectedSchoolUdise);
      } else if (!selectedSchoolUdise || selectedSchoolUdise.length === 0) {
        setSelectedSchoolId("");
        setSelectedSchoolName("");
        setSchoolInputValue("");
        setSelectedDistrict("");
        setSelectedState("");
        setSelectedCountry("");
        setClassOptions([]);
        setSelectedClassId("");
        setSelectedClass("");
      }
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedSchoolUdise, isInitialLoad]);

  useEffect(() => {
    if (selectedRequestType === RequestTypes.PRINCIPAL) {
      setSelectedClassId("");
      setSelectedClass("");
    }
  }, [selectedRequestType]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = location.state as { request?: any } | undefined;
      if (state?.request && state.request.request_id === id) {
        const req = state.request;
        setRequestDetails(req);
        initializeFormFields(req);
      } else {
        const flaggedRequests = await api.getOpsRequests("flagged", 1, DEFAULT_PAGE_SIZE);
        const req = flaggedRequests?.find((r) => r.request_id === id);
        if (req) {
          setRequestDetails(req);
          initializeFormFields(req);
        } else {
          setError(t("Request not found"));
        }
      }
    } catch (e) {
      console.error("Error fetching flagged request:", e);
      setError(t("Failed to load request details. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFormFields = (req: any) => {
    setSelectedRequestType(req.request_type || "");
    setSelectedSchoolId(req.school_id || "");
    setSelectedSchoolUdise(req.school?.udise || "");
    setSelectedSchoolName(req.school?.name || "");
    setSchoolInputValue(req.school?.name || "");
    setSelectedDistrict(req.school?.group2 || "");
    setSelectedState(req.school?.group1 || "");
    setSelectedCountry(req.school?.country || "");
    
    const initialClassId = req.class_id || "";
    setSelectedClassId(initialClassId);
    
    if (req.school_id) {
      fetchClasses(req.school_id, initialClassId);
    }
  };

  const fetchDropdownOptions = async () => {
    setIsLoadingDropdowns(true);
    try {
      const types = Object.values(RequestTypes).filter(
        type => type === RequestTypes.TEACHER || type === RequestTypes.PRINCIPAL
      );
      setRequestTypeOptions(types);
    } catch (e) {
      console.error("Error fetching dropdown options:", e);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const fetchClasses = async (schoolId: string, preserveClassId?: string) => {
    try {
      const classes = await api.getClassesBySchoolId(schoolId);
      const mappedClasses = classes.map((c) => ({ id: c.id, name: c.name }));
      setClassOptions(mappedClasses);
      
      if (preserveClassId && preserveClassId.trim() !== "") {
        const selectedClassItem = mappedClasses.find((c) => c.id === preserveClassId);
        
        if (selectedClassItem) {
          setSelectedClassId(preserveClassId);
          setSelectedClass(selectedClassItem.name);
        }
      }
    } catch (e) {
      console.error("Error fetching classes:", e);
    }
  };

  const handleSchoolSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSchoolOptions([]);
      return;
    }

    if (isInitialLoad) {
      return;
    }
    
    try {
      const result = await api.searchSchools({
        p_search_text: searchTerm,
        p_page_limit: 20,
        p_page_offset: 0,
      });
      setSchoolOptions(
        result.schools.map((s) => ({
          id: s.id,
          name: s.name,
          udise: s.udise || undefined,
        }))
      );
    } catch (e) {
      console.error("Error searching schools:", e);
    }
  };

  const handleSchoolSelect = (school: { id: string; name: string; udise?: string } | null) => {
    if (school) {
      setIsInitialLoad(false);
      setSelectedSchoolId(school.id);
      setSelectedSchoolName(school.name);
      setSchoolInputValue(school.name);
      setSelectedSchoolUdise(school.udise || "");
      setSelectedClassId("");
      setSelectedClass("");
      fetchClasses(school.id);
      fetchFullSchoolDetails(school.id);
    } else {
      setSelectedSchoolId("");
      setSelectedSchoolName("");
      setSchoolInputValue("");
      setClassOptions([]);
      setSelectedClassId("");
      setSelectedClass("");
    }
  };

  const fetchSchoolByUdise = async (udiseCode: string) => {
    setIsFetchingSchool(true);
    try {
      const validation = await api.validateSchoolUdiseCode(udiseCode);
      
      if (validation.status === "success") {
        const result = await api.searchSchools({
          p_search_text: udiseCode,
          p_page_limit: 1,
          p_page_offset: 0,
        });

        if (result.schools.length > 0) {
          const school = result.schools[0];
          setSelectedSchoolId(school.id);
          setSelectedSchoolName(school.name);
          setSchoolInputValue(school.name);
          setSelectedDistrict(school.group2 || "");
          setSelectedState(school.group1 || "");
          setSelectedCountry(school.country || "");
          setSelectedClassId("");
          setSelectedClass("");
          fetchClasses(school.id);
          setValidationErrors({ ...validationErrors, udise: "" });
        } else {
          setValidationErrors({ ...validationErrors, udise: t("School not found for this UDISE code") });
        }
      } else {
        setValidationErrors({ ...validationErrors, udise: t("Invalid UDISE code") });
      }
    } catch (e) {
      console.error("Error fetching school by UDISE:", e);
      setValidationErrors({ ...validationErrors, udise: t("Failed to fetch school details") });
    } finally {
      setIsFetchingSchool(false);
    }
  };

  const fetchFullSchoolDetails = async (schoolId: string) => {
    try {
      const school = await api.getSchoolById(schoolId);
      if (school) {
        setSelectedDistrict(school.group2 || "");
        setSelectedState(school.group1 || "");
        setSelectedCountry(school.country || "India");
      }
    } catch (e) {
      console.error("Error fetching full school details:", e);
    }
  };

  const validateFields = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!selectedRequestType) {
      errors.requestType = t("Request Type is required");
    }
    if (selectedRequestType === RequestTypes.TEACHER) {
      if (selectedSchoolId && classOptions.length > 0 && !selectedClassId) {
        errors.class = t("Class is required");
      }
    }
    if (!selectedSchoolUdise) {
      errors.udise = t("UDISE Code is required");
    }
    if (!selectedSchoolName) {
      errors.schoolName = t("School Name is required");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApprove = async () => {
    if (!validateFields()) {
      return;
    }

    setIsApproving(true);
    try {
      const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!currentUser) {
        setError(t("User not authenticated"));
        return;
      }

      if (!requestDetails?.id) {
        setError(t("Request ID not found"));
        return;
      }

      const role = selectedRequestType as any;
      const requestedByUser = (requestDetails as any)?.requestedBy;
      
      if (!requestedByUser || !requestedByUser.id) {
        setError(t("User information not found. Cannot approve request."));
        return;
      }
      
      if (selectedSchoolId) {
        if (role === RequestTypes.PRINCIPAL) {
          await api.addUserToSchool(selectedSchoolId, requestedByUser, role);
        } else if (role === RequestTypes.TEACHER && selectedClassId) {
          await api.addTeacherToClass(selectedSchoolId, selectedClassId, requestedByUser);
        }
      }

      await api.approveOpsRequest(
        requestDetails.id,
        currentUser.id,
        role,
        selectedSchoolId,
        selectedClassId || undefined
      );

      history.push({
        pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
        search: `?tab=${REQUEST_TABS.APPROVED}`,
      });
    } catch (e) {
      console.error("Error approving request:", e);
      setError(t("Failed to approve request. Please try again."));
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancel = () => {
    history.push({
      pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
      search: `?tab=${REQUEST_TABS.FLAGGED}`,
    });
  };

  const formatDT = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : t("-");

  if (isLoading)
    return (
      <div className="ops-flagged-request-details-centered">
        <CircularProgress />
        <Typography>{t("Loading request details...")}</Typography>
      </div>
    );
  
  if (error)
    return (
      <div className="ops-flagged-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t("Go Back")}</Button>
      </div>
    );
  
  if (!requestDetails) return null;

  const requestedBy = (requestDetails as any).requestedBy || {};
  const flaggedBy = (requestDetails as any).respondedBy || {};

  return (
    <div className="ops-flagged-request-details-layout">
      <Typography
        variant="h4"
        className="ops-flagged-request-details-page-title"
      >
        {t("Request ID - {{id}}", { id })}
      </Typography>
      <div className="ops-flagged-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="ops-flagged-request-details-link"
        >
          {t("Requests")}
        </span>
        <span> &gt; </span>
        <span
          onClick={() =>
            history.push({
              pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
              search: `?tab=${REQUEST_TABS.FLAGGED}`,
            })
          }
          className="ops-flagged-request-details-link"
        >
          {t("Flagged")}
        </span>
        <span> &gt; </span>
        <span className="ops-flagged-request-details-active">
          {t("Request ID - {{id}}", { id })}
        </span>
      </div>
      <Grid container spacing={3} className="ops-flagged-request-details-main-content-row" alignItems="flex-start">
        {/* LEFT: Request From & Request Details */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper className="ops-flagged-request-details-card">
            <Typography variant="h6" className="ops-flagged-request-details-card-title">
              {t("Request From")}
            </Typography>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Name")}</div>
              <div>{requestedBy.name || t("-")}</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Phone Number")}</div>
              <div>{requestedBy.phone || t("-")}</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Email ID")}</div>
              <div>{requestedBy.email || t("-")}</div>
            </div>
            <Divider className="ops-flagged-request-details-divider" />
            <Typography variant="h6" className="ops-flagged-request-details-card-title">
              {t("Request Details")}
            </Typography>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Request Type")}</div>
              <FormControl className="ops-flagged-request-details-dropdown" error={!!validationErrors.requestType}>
                <Select
                  value={selectedRequestType}
                  onChange={(e) => {
                    setSelectedRequestType(e.target.value);
                    setValidationErrors({ ...validationErrors, requestType: "" });
                  }}
                  displayEmpty
                  disabled={isLoadingDropdowns}
                >
                  <MenuItem value="" disabled>
                    {t("Select Request Type")}
                  </MenuItem>
                  {requestTypeOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.requestType && (
                  <Typography variant="caption" color="error">{validationErrors.requestType}</Typography>
                )}
              </FormControl>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Select Class")}</div>
              <FormControl className="ops-flagged-request-details-dropdown" error={!!validationErrors.class}>
                <Select
                  value={selectedClassId || ""}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const selectedClassItem = classOptions.find((c) => c.id === e.target.value);
                    setSelectedClass(selectedClassItem?.name || "");
                    setValidationErrors({ ...validationErrors, class: "" });
                  }}
                  displayEmpty
                  disabled={selectedRequestType === RequestTypes.PRINCIPAL || !selectedSchoolId || classOptions.length === 0}
                >
                  <MenuItem value="" disabled>
                    {classOptions.length === 0 && selectedSchoolId
                      ? t("No classes available for this school")
                      : t("Select Class")}
                  </MenuItem>
                  {classOptions.map((opt) => {
                    return (
                      <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                    );
                  })}
                </Select>
                {validationErrors.class && (
                  <Typography variant="caption" color="error">{validationErrors.class}</Typography>
                )}
                {selectedSchoolId && classOptions.length === 0 && !validationErrors.class && (
                  <Typography variant="caption" color="textSecondary">
                    {t("This school has no class sections configured")}
                  </Typography>
                )}
              </FormControl>
            </div>
          </Paper>
          <Paper className="ops-flagged-request-details-flagged-card ops-flagged-request-details-card">
            <Typography variant="h6" className="ops-flagged-request-details-card-title">
              {t("Flagged Details")}
            </Typography>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Flagged By")}</div>
              <div>{flaggedBy.name || t("-")}</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Phone Number")}</div>
              <div>{flaggedBy.phone || t("-")}</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Flagged On")}</div>
              <div>{formatDT(requestDetails.updated_at)}</div>
            </div>
          </Paper>
        </Grid>
        {/* RIGHT: School Details & Actions */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper className="ops-flagged-request-details-card">
            <Typography variant="h6" className="ops-flagged-request-details-card-title">
              {t("School Details")}
            </Typography>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("School ID (UDISE)")}</div>
              <TextField
                value={selectedSchoolUdise}
                onChange={(e) => {
                  setIsInitialLoad(false);
                  setInitialUdiseSet(true);
                  setSelectedSchoolUdise(e.target.value);
                  setValidationErrors({ ...validationErrors, udise: "" });
                }}
                variant="outlined"
                size="small"
                className="ops-flagged-request-details-textfield"
                placeholder={t("Enter UDISE") || ""}
                error={!!validationErrors.udise}
                helperText={validationErrors.udise || (isFetchingSchool ? t("Fetching school details...") : "")}
                disabled={isFetchingSchool}
              />
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("School Name")}</div>
              <Autocomplete
                freeSolo
                onChange={(_, newValue) => {
                  if (isInitialLoad) {
                    return;
                  }
                  if (typeof newValue === 'object' && newValue !== null) {
                    handleSchoolSelect(newValue);
                  } else if (typeof newValue === 'string') {
                    setSelectedSchoolName(newValue);
                    setSelectedSchoolId('');
                    setClassOptions([]);
                    setSelectedClassId('');
                    setSelectedClass('');
                  } else {
                    handleSchoolSelect(null);
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (isInitialLoad && reason === "reset") {
                    return;
                  }
                  setSchoolInputValue(newInputValue);
                  if (reason === "clear" || (reason === "input" && newInputValue === "")) {
                    handleSchoolSelect(null);
                  } else if (reason === "input" && newInputValue.length >= 3) {
                    handleSchoolSearch(newInputValue);
                  }
                }}
                inputValue={schoolInputValue}
                options={schoolOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder={t("Search School") || ""}
                    error={!!validationErrors.schoolName}
                    helperText={validationErrors.schoolName}
                  />
                )}
                className="ops-flagged-request-details-dropdown"
                clearOnEscape
              />
            </div>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-flex-row">
              <div className="ops-flagged-request-details-field-column">
                <div className="ops-flagged-request-details-label">{t("District")}</div>
                <div className="ops-flagged-request-details-value">{selectedDistrict || "-"}</div>
              </div>
              <div className="ops-flagged-request-details-field-column">
                <div className="ops-flagged-request-details-label">{t("State")}</div>
                <div className="ops-flagged-request-details-value">{selectedState || "-"}</div>
              </div>
            </div>
            <div className="ops-flagged-request-details-field-column">
              <div className="ops-flagged-request-details-label">{t("Country")}</div>
              <div className="ops-flagged-request-details-value">{selectedCountry || "-"}</div>
            </div>
          </Paper>
          <div className="ops-flagged-request-details-action-row">
            <Button 
              variant="outlined" 
              color="error" 
              className="ops-flagged-request-details-cancel-btn" 
              onClick={handleCancel}
              disabled={isApproving}
            >
              {t("Cancel")}
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              className="ops-flagged-request-details-approve-btn" 
              onClick={handleApprove}
              disabled={isApproving || isLoading}
            >
              {isApproving ? t("Approving...") : t("Approve")}
            </Button>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default OpsFlaggedRequestDetails;
