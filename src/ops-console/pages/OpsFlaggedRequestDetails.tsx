import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";
import { useTranslation } from "react-i18next";
import { Typography, Divider, Paper, Button, TextField, Select, MenuItem, FormControl, Grid } from "@mui/material";
import "./OpsFlaggedRequestDetails.css";

const OpsFlaggedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { t } = useTranslation();

  // Editable state for design only
  const [selectedRequestType, setSelectedRequestType] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Dropdown options (empty for design only)
  const requestTypeOptions: string[] = [];
  const gradeOptions: string[] = [];
  const sectionOptions: string[] = [];
  const schoolOptions: string[] = [];

  const handleApprove = () => {
    // implement later
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
              <div>-</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Phone Number")}</div>
              <div>-</div>
            </div>
            <div className="ops-flagged-request-details-field-stack">
              <div className="ops-flagged-request-details-label">{t("Email ID")}</div>
              <div>-</div>
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
              <span className="ops-flagged-request-details-value-flagged">-</span>
            </div>
            <div className="ops-flagged-request-details-label-row">
              <span className="ops-flagged-request-details-label-flagged">{t("Phone Number")}</span>
              <span className="ops-flagged-request-details-value-flagged">-</span>
            </div>
            <div className="ops-flagged-request-details-label-row">
              <span className="ops-flagged-request-details-label-flagged">{t("Flagged on")}</span>
              <span className="ops-flagged-request-details-value-flagged">-</span>
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
