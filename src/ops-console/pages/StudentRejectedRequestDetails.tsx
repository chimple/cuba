import React, { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES } from "../../common/constants";
import "./StudentRejectedRequestDetails.css";
import { useTranslation } from "react-i18next"; // Import useTranslation

const StudentRejectedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation(); // Initialize the translation hook

  type RequestDetails = {
    school?: {
      name?: string;
      udise?: string;
      group2?: string;
      group1?: string;
      group3?: string;
    };
    rejectedBy?: { name?: string };
    requestedBy?: { name?: string; phone_number?: string; email?: string };
    request_id?: string;
    request_type?: string;
    created_at?: string;
    updated_at?: string;
    rejected_reason_type?: string;
  };

  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestDetails(state.request);
        } else {
          const rejectedRequests = await api.getOpsRequests(
            "rejected",
            1,
            1000
          );
          const req = rejectedRequests?.find((r) => r.request_id === id);
          if (req) setRequestDetails(req);
          else setError(t("Request not found")); // Translated
        }
      } catch (e) {
        setError(t("Failed to load request details. Please try again.")); // Translated
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, api, location.state, t]); // Add t to dependency array

  if (isLoading)
    return (
      <div className="student-rejected-request-details-centered">
        <Typography>{t("Loading request details...")}</Typography> {/* Translated */}
      </div>
    );
  if (error)
    return (
      <div className="student-rejected-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t("Go Back")}</Button> {/* Translated */}
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
      : t("-"); // Translated '-'

  const school = requestDetails.school || {};
  const rejectedBy = requestDetails.rejectedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  return (
    <div className="student-rejected-request-details-layout">
      <Typography variant="h4" className="student-rejected-request-details-page-title">
        {t("Requests")} {/* Translated */}
      </Typography>
      <div className="student-rejected-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="student-rejected-request-details-link" // Class name updated
        >
          {t("Requests")} {/* Translated */}
        </span>
        <span> &gt; </span>
        <span
          onClick={() =>
            history.push(
              PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST + "?tab=REJECTED"
            )
          }
          className="student-rejected-request-details-link" // Class name updated
        >
          {t("Rejected")} {/* Translated */}
        </span>
        <span> &gt; </span>
        <span className="student-rejected-request-details-active">
          {t("Request ID - {{id}}", { id })} {/* Translated with interpolation */}
        </span>
      </div>
      <Grid
        container
        spacing={3}
        className="student-rejected-request-details-main-content-row"
        alignItems="flex-start"
      >
        {/* LEFT: Request Details */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper className="student-rejected-request-details-details-card">
            <Typography variant="h6" className="student-rejected-request-details-card-title">
              {t("Request ID - {{id}}", { id })} {/* Translated with interpolation */}
            </Typography>
            <Divider className="student-rejected-request-details-divider-margin" /> {/* Class name updated */}
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("School Name")}</div> {/* Class name updated & Translated */}
              <div>{school.name || t("-")}</div> {/* Translated '-' */}
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("School ID (UDISE)")}</div> {/* Class name updated & Translated */}
              <div>{school.udise || t("-")}</div> {/* Translated '-' */}
            </div>
            <Divider className="student-rejected-request-details-divider-margin" /> {/* Class name updated */}
            <div className="student-rejected-request-details-field-row"> {/* Class name updated */}
              <div
                className="student-rejected-request-details-field-stack student-rejected-request-details-field-stack-margin" // Class name updated
              >
                <div className="student-rejected-request-details-label">{t("City")}</div> {/* Class name updated & Translated */}
                <div>{school.group2 || t("-")}</div> {/* Translated '-' */}
              </div>
              <div className="student-rejected-request-details-field-stack">
                <div className="student-rejected-request-details-label">{t("State")}</div> {/* Class name updated & Translated */}
                <div>{school.group1 || t("-")}</div> {/* Translated '-' */}
              </div>
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("District")}</div> {/* Class name updated & Translated */}
              <div>{school.group3 || t("-")}</div> {/* Translated '-' */}
            </div>
            <Divider className="student-rejected-request-details-divider-margin" /> {/* Class name updated */}
            <Typography variant="h6" className="student-rejected-request-details-card-title">
              {t("Request Details")} {/* Translated */}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <div className="student-rejected-request-details-label-sm">{t("Request For:")}</div> {/* Class name updated & Translated */}
                <div>
                  {requestDetails.request_type || t("-")} {/* Translated '-' */}
                </div>
              </Grid>
              <Grid item xs={6}>
                <div className="student-rejected-request-details-label-sm">{t("Requested On:")}</div> {/* Class name updated & Translated */}
                <div>
                  {formatDT(requestDetails.created_at)}
                </div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* RIGHT: Rejection Details (red), Request From */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper className="student-rejected-request-details-rejection-card student-rejected-request-details-details-card">
            <Typography variant="h6" className="student-rejected-request-details-card-title student-rejected-request-details-rejection-title">
              {t("Rejection Details")} {/* Translated */}
            </Typography>
            <Divider className="student-rejected-request-details-divider-margin" /> {/* Class name updated */}
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">{t("Reason:")}</span> {/* Class name updated & Translated */}
              <span>
                {requestDetails.rejected_reason_type || t("-")} {/* Translated '-' */}
              </span>
            </div>
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">{t("Rejected By:")}</span> {/* Class name updated & Translated */}
              <span>{rejectedBy.name || t("-")}</span> {/* Translated '-' */}
            </div>
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">{t("Rejected On:")}</span> {/* Class name updated & Translated */}
              <span>
                {formatDT(requestDetails.updated_at)}
              </span>
            </div>
          </Paper>
          <Paper className="student-rejected-request-details-details-card">
            <Typography variant="h6" className="student-rejected-request-details-card-title">
              {t("Request From")} {/* Translated */}
            </Typography>
            <Divider className="student-rejected-request-details-divider-margin" /> {/* Class name updated */}
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("Name :")}</div> {/* Class name updated & Translated */}
              <div>{requestedBy.name || t("N/A")}</div> {/* Translated 'N/A' */}
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("Phone Number :")}</div> {/* Class name updated & Translated */}
              <div>{requestedBy.phone_number || t("N/A")}</div> {/* Translated 'N/A' */}
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="student-rejected-request-details-label">{t("Email ID:")}</div> {/* Class name updated & Translated */}
              <div>{requestedBy.email || t("N/A")}</div> {/* Translated 'N/A' */}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default StudentRejectedRequestDetails;