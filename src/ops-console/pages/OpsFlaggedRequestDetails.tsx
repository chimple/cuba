import React, { useState, useEffect } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { PAGES, DEFAULT_PAGE_SIZE, REQUEST_TABS, RequestTypes, TableTypes } from "../../common/constants";
import { useTranslation } from "react-i18next";
import { Typography, Divider, Paper, Button, TextField, Select, MenuItem, FormControl, Grid, CircularProgress, Autocomplete } from "@mui/material";
import "./OpsFlaggedRequestDetails.css";
import { ServiceConfig } from "../../services/ServiceConfig";

type RequestDetails = {
  id?: string;
  school?: {
    id?: string;
    name?: string;
    udise?: string;
    country?: string;
    group1?: string;
    group3?: string;
  };
  respondedBy?: { name?: string; phone?: string };
  requestedBy?: { name?: string; phone?: string; email?: string };
  request_id?: string;
  request_type?: string;
  class_id?: string;
  school_id?: string;
  created_at?: string;
  updated_at?: string;
};

const OpsFlaggedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  // Request data state
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable field states
  const [selectedRequestType, setSelectedRequestType] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Dropdown options states
  const [requestTypeOptions, setRequestTypeOptions] = useState<string[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [sectionOptions, setSectionOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [schoolOptions, setSchoolOptions] = useState<Array<{ id: string; name: string; udise?: string }>>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isFetchingSchool, setIsFetchingSchool] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
    fetchDropdownOptions();
  }, [id]);

  // Debounce UDISE input and fetch school details
  useEffect(() => {
    const handler = setTimeout(() => {
      if (selectedSchoolUdise && selectedSchoolUdise.length >= 3) {
        fetchSchoolByUdise(selectedSchoolUdise);
      }
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedSchoolUdise]);

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
    setSelectedDistrict(req.school?.group3 || "");
    setSelectedState(req.school?.group1 || "");
    setSelectedCountry(req.school?.country || "");
    setSelectedSectionId(req.class_id || "");
  };

  const fetchDropdownOptions = async () => {
    setIsLoadingDropdowns(true);
    try {
      const types = Object.values(RequestTypes);
      setRequestTypeOptions(types);

      const grades = await api.getAllGrades();
      setGradeOptions(grades.map((g) => ({ id: g.id, name: g.name })));
    } catch (e) {
      console.error("Error fetching dropdown options:", e);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const fetchSections = async (schoolId: string) => {
    try {
      const classes = await api.getClassesBySchoolId(schoolId);
      setSectionOptions(classes.map((c) => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.error("Error fetching sections:", e);
    }
  };

  const handleSchoolSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSchoolOptions([]);
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
      setSelectedSchoolId(school.id);
      setSelectedSchoolName(school.name);
      setSelectedSchoolUdise(school.udise || "");
      fetchSections(school.id);
      fetchFullSchoolDetails(school.id);
    } else {
      setSelectedSchoolId("");
      setSelectedSchoolName("");
      setSectionOptions([]);
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
          setSelectedDistrict(school.group3 || "");
          setSelectedState(school.group1 || "");
          setSelectedCountry(school.country || "");
          fetchSections(school.id);
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
        setSelectedDistrict(school.group3 || "");
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
    if (!selectedGradeId) {
      errors.grade = t("Grade is required");
    }
    // Only require section if school has sections available
    if (selectedSchoolId && sectionOptions.length > 0 && !selectedSectionId) {
      errors.section = t("Class Section is required");
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

      await api.approveOpsRequest(
        requestDetails.id,
        currentUser.id,
        role,
        selectedSchoolId,
        selectedSectionId || undefined
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
      ? new Date(d).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
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

  const requestedBy = requestDetails.requestedBy || {};
  const flaggedBy = requestDetails.respondedBy || {};

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
                    <MenuItem key={opt} value={opt}>{t(opt)}</MenuItem>
                  ))}
                </Select>
                {validationErrors.requestType && (
                  <Typography variant="caption" color="error">{validationErrors.requestType}</Typography>
                )}
              </FormControl>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Grade")}</div>
              <FormControl className="ops-flagged-request-details-dropdown" error={!!validationErrors.grade}>
                <Select
                  value={selectedGradeId}
                  onChange={(e) => {
                    setSelectedGradeId(e.target.value);
                    const grade = gradeOptions.find((g) => g.id === e.target.value);
                    setSelectedGrade(grade?.name || "");
                    setValidationErrors({ ...validationErrors, grade: "" });
                  }}
                  displayEmpty
                  disabled={isLoadingDropdowns}
                >
                  <MenuItem value="" disabled>
                    {t("Select Grade")}
                  </MenuItem>
                  {gradeOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                  ))}
                </Select>
                {validationErrors.grade && (
                  <Typography variant="caption" color="error">{validationErrors.grade}</Typography>
                )}
              </FormControl>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Class Section")}</div>
              <FormControl className="ops-flagged-request-details-dropdown" error={!!validationErrors.section}>
                <Select
                  value={selectedSectionId}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value);
                    const section = sectionOptions.find((s) => s.id === e.target.value);
                    setSelectedSection(section?.name || "");
                    setValidationErrors({ ...validationErrors, section: "" });
                  }}
                  displayEmpty
                  disabled={!selectedSchoolId || sectionOptions.length === 0}
                >
                  <MenuItem value="" disabled>
                    {sectionOptions.length === 0 && selectedSchoolId
                      ? t("No sections available for this school")
                      : t("Select Section")}
                  </MenuItem>
                  {sectionOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                  ))}
                </Select>
                {validationErrors.section && (
                  <Typography variant="caption" color="error">{validationErrors.section}</Typography>
                )}
                {selectedSchoolId && sectionOptions.length === 0 && !validationErrors.section && (
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
              <div className="ops-flagged-request-details-label">{t("Flagged on")}</div>
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
                value={selectedSchoolName ? { id: selectedSchoolId, name: selectedSchoolName } : null}
                onChange={(_, newValue) => handleSchoolSelect(newValue)}
                onInputChange={(_, newInputValue) => {
                  if (newInputValue.length >= 3) {
                    handleSchoolSearch(newInputValue);
                  }
                }}
                options={schoolOptions}
                getOptionLabel={(option) => option.name}
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
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
