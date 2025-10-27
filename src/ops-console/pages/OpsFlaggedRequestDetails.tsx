import React, { useEffect, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { DEFAULT_PAGE_SIZE, PAGES, REQUEST_TABS } from "../../common/constants";
import { useTranslation } from "react-i18next";
import { Typography, Divider, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid } from "@mui/material";
import "./OpsFlaggedRequestDetails.css";

const OpsFlaggedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  type RequestDetails = {
    school?: {
      id?: string;
      name?: string;
      udise?: string;
      country?: string;
      group1?: string;
      group3?: string;
      district?: string;
      state?: string;
    };
    respondedBy?: { id?: string; name?: string; phone_number?: string; email?: string };
    requestedBy?: { id?: string; name?: string; phone_number?: string; email?: string };
    request_id?: string;
    request_type?: string;
    created_at?: string;
    updated_at?: string;
    classInfo?: { name?: string; section?: string };
    class_id?: string;
    flagged_by?: string;
    flagged_date?: string;
  };

  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedRequestType, setSelectedRequestType] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestDetails(state.request);
          setSelectedRequestType(state.request.request_type || "");
          setSelectedGrade(state.request.classInfo?.name || "");
          setSelectedSection(state.request.classInfo?.section || "");
          setSelectedSchoolUdise(state.request.school?.udise || "");
          setSelectedSchoolName(state.request.school?.name || "");
          setSelectedDistrict(state.request.school?.district || "");
          setSelectedState(state.request.school?.state || "");
          setSelectedCountry(state.request.school?.country || "");
        } else {
          const flaggedRequests = await api.getOpsRequests(
            "flagged",
            1,
            DEFAULT_PAGE_SIZE
          );
          const req = flaggedRequests?.find((r: any) => r.request_id === id);
          if (req) {
            setRequestDetails(req);
            setSelectedRequestType(req.request_type || "");
            setSelectedGrade(req.classInfo?.name || "");
            setSelectedSection(req.classInfo?.section || "");
            setSelectedSchoolUdise(req.school?.udise || "");
            setSelectedSchoolName(req.school?.name || "");
            setSelectedDistrict(req.school?.district || "");
            setSelectedState(req.school?.state || "");
            setSelectedCountry(req.school?.country || "");
          }
          else setError(t("Request not found"));
        }
      } catch (e) {
        setError(t("Failed to load request details. Please try again."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, api, location.state, t]);

  if (isLoading)
    return (
      <div className="ops-flagged-request-details-centered">
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

  const school = requestDetails.school || {};
  const flaggedBy = requestDetails.respondedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  // Example dropdown options (replace with real data as needed)
  const requestTypeOptions = [];
  const gradeOptions = [];
  const sectionOptions = [];
  const schoolOptions = [];

  const handleApprove = async () => {
    // TODO: Implement approve functionality
    console.log("Approve button clicked");
  };

  const handleCancel = () => {
    history.goBack();
  };

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
              <div>{requestedBy.phone_number || t("-")}</div>
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
              <FormControl className="ops-flagged-request-details-dropdown">
                <Select
                  value={selectedRequestType}
                  onChange={(e) => setSelectedRequestType(e.target.value)}
                  displayEmpty
                >
                  {requestTypeOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Grade")}</div>
              <FormControl className="ops-flagged-request-details-dropdown">
                <Select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  displayEmpty
                >
                  {gradeOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Class Section")}</div>
              <FormControl className="ops-flagged-request-details-dropdown">
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  displayEmpty
                >
                  {sectionOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Paper>
          <Paper className="ops-flagged-request-details-flagged-card ops-flagged-request-details-card">
            <Typography variant="h6" className="ops-flagged-request-details-card-title ops-flagged-request-details-flagged-title">
              {t("Flagged Details")}
            </Typography>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-label-row">
              <span className="ops-flagged-request-details-label-flagged">{t("Flagged By")}</span>
              <span className="ops-flagged-request-details-value-flagged">{flaggedBy.name || t("-")}</span>
            </div>
            <div className="ops-flagged-request-details-label-row">
              <span className="ops-flagged-request-details-label-flagged">{t("Phone Number")}</span>
              <span className="ops-flagged-request-details-value-flagged">{flaggedBy.phone_number || t("-")}</span>
            </div>
            <div className="ops-flagged-request-details-label-row">
              <span className="ops-flagged-request-details-label-flagged">{t("Flagged on")}</span>
              <span className="ops-flagged-request-details-value-flagged">{formatDT(requestDetails.updated_at)}</span>
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
                onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                variant="outlined"
                size="small"
                className="ops-flagged-request-details-textfield"
                placeholder={t("Enter UDISE") || ""}
              />
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("School Name")}</div>
              <FormControl className="ops-flagged-request-details-dropdown">
                <Select
                  value={selectedSchoolName}
                  onChange={(e) => setSelectedSchoolName(e.target.value)}
                  displayEmpty
                >
                  {schoolOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <Divider className="ops-flagged-request-details-divider" />
            <div className="ops-flagged-request-details-flex-row">
              <div className="ops-flagged-request-details-field-column">
                <div className="ops-flagged-request-details-label">{t("District")}</div>
                <TextField
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  variant="outlined"
                  size="small"
                  className="ops-flagged-request-details-textfield-small"
                  placeholder={t("District") || ""}
                />
              </div>
              <div className="ops-flagged-request-details-field-column">
                <div className="ops-flagged-request-details-label">{t("State")}</div>
                <TextField
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  variant="outlined"
                  size="small"
                  className="ops-flagged-request-details-textfield-small"
                  placeholder={t("State") || ""}
                />
              </div>
            </div>
            <div className="ops-flagged-request-details-field-row-label">
              <div className="ops-flagged-request-details-label">{t("Country")}</div>
              <TextField
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                variant="outlined"
                size="small"
                className="ops-flagged-request-details-textfield"
                placeholder={t("Country") || ""}
              />
            </div>
          </Paper>
          <div className="ops-flagged-request-details-action-row">
            <Button variant="outlined" color="error" className="ops-flagged-request-details-cancel-btn" onClick={handleCancel}>
              {t("Cancel")}
            </Button>
            <Button variant="contained" color="success" className="ops-flagged-request-details-approve-btn" onClick={handleApprove}>
              {t("Approve")}
            </Button>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default OpsFlaggedRequestDetails;
