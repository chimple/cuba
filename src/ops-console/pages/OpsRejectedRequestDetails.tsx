import React, { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { DEFAULT_PAGE_SIZE, PAGES, REQUEST_TABS } from "../../common/constants";
import "./OpsRejectedRequestDetails.css";
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
      country?: string;
      group1?: string;
      group2?: string;
      group3?: string;
    };
    rejectedBy?: { name?: string };
    respondedBy?: { name?: string };
    requestedBy?: { name?: string; phone?: string; email?: string };
    request_id?: string;
    request_type?: string;
    created_at?: string;
    updated_at?: string;
    rejected_reason_type?: string;
    rejected_reason_description?: string;
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
            DEFAULT_PAGE_SIZE
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
      <div className="ops-rejected-request-details-centered">
        <Typography>{t("Loading request details...")}</Typography>{" "}
        {/* Translated */}
      </div>
    );
  if (error)
    return (
      <div className="ops-rejected-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t("Go Back")}</Button>{" "}
        {/* Translated */}
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
  const rejectedBy = requestDetails.respondedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  return (
    <div className="ops-rejected-request-details-layout">
      <Typography
        variant="h4"
        className="ops-rejected-request-details-page-title"
      >
        {t("Requests")} {/* Translated */}
      </Typography>
      <div className="ops-rejected-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="ops-rejected-request-details-link"
        >
          {t("Requests")}
        </span>
        <span> &gt; </span>

        <span
          onClick={() =>
            history.push({
              pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
              search: `?tab=${REQUEST_TABS.REJECTED}`,
            })
          }
          className="ops-rejected-request-details-link"
        >
          {t("Rejected")}
        </span>
        <span> &gt; </span>

        <span className="ops-rejected-request-details-active">
          {t("Request ID - {{id}}", { id })}{" "}
        </span>
      </div>

      <Grid
        container
        spacing={3}
        className="ops-rejected-request-details-main-content-row"
        alignItems="flex-start"
      >
        {/* LEFT: Request Details */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper className="ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t("Request ID - {{id}}", { id })}{" "}
              {/* Translated with interpolation */}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{" "}
            {/* Class name updated */}
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("School Name")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{school.name || t("-")}</div> {/* Translated '-' */}
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("School ID (UDISE)")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{school.udise || t("-")}</div> {/* Translated '-' */}
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />{" "}
            {/* Class name updated */}
            <div className="ops-rejected-request-details-field-row">
              {" "}
              {/* Class name updated */}
              <div
                className="ops-rejected-request-details-field-stack ops-rejected-request-details-field-stack-margin" // Class name updated
              >
                <div className="ops-rejected-request-details-label">
                  {t("District")}
                </div>{" "}
                {/* Class name updated & Translated */}
                <div>{school.group2 || t("-")}</div> {/* Translated '-' */}
              </div>
              <div className="ops-rejected-request-details-field-stack">
                <div className="ops-rejected-request-details-label">
                  {t("State")}
                </div>{" "}
                {/* Class name updated & Translated */}
                <div>{school.group1 || t("-")}</div> {/* Translated '-' */}
              </div>
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("Country")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{school.country || t("-")}</div> {/* Translated '-' */}
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />{" "}
            {/* Class name updated */}
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t("Request Details")} {/* Translated */}
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <div className="ops-rejected-request-details-label-sm">
                  {t("Request For:")}
                </div>{" "}
                {/* Class name updated & Translated */}
                <div>
                  {requestDetails.request_type || t("-")} {/* Translated '-' */}
                </div>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <div className="ops-rejected-request-details-label-sm">
                  {t("Requested On:")}
                </div>{" "}
                {/* Class name updated & Translated */}
                <div>{formatDT(requestDetails.created_at)}</div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* RIGHT: Rejection Details (red), Request From */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper className="ops-rejected-request-details-rejection-card ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title ops-rejected-request-details-rejection-title"
            >
              {t("Rejection Details")} {/* Translated */}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{" "}
            {/* Class name updated */}
            <div className="ops-rejected-request-details-label-row"></div>
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t("Rejected By:")}
              </span>{" "}
              {/* Class name updated & Translated */}
              <span>{rejectedBy.name || t("-")}</span> {/* Translated '-' */}
            </div>
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t("Rejected On:")}
              </span>{" "}
              {/* Class name updated & Translated */}
              <span>{formatDT(requestDetails.updated_at)}</span>
            </div>
            <Divider className="ops-rejected-request-details-divider-margin" />
            <div className="ops-rejected-request-details-label-row">
              <span className="ops-rejected-request-details-label-reject">
                {t("Message to Admin:")}
              </span>
            </div>
            <div className="ops-rejected-request-details-message-box">
              {requestDetails.rejected_reason_description?.trim()}
            </div>
          </Paper>
          <Paper className="ops-rejected-request-details-details-card">
            <Typography
              variant="h6"
              className="ops-rejected-request-details-card-title"
            >
              {t("Request From")} {/* Translated */}
            </Typography>
            <Divider className="ops-rejected-request-details-divider-margin" />{" "}
            {/* Class name updated */}
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("Name :")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{requestedBy.name || t("N/A")}</div> {/* Translated 'N/A' */}
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("Phone Number :")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{requestedBy.phone || t("N/A")}</div>{" "}
              {/* Translated 'N/A' */}
            </div>
            <div className="ops-rejected-request-details-field-stack">
              <div className="ops-rejected-request-details-label">
                {t("Email ID:")}
              </div>{" "}
              {/* Class name updated & Translated */}
              <div>{requestedBy.email || t("N/A")}</div>{" "}
              {/* Translated 'N/A' */}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default StudentRejectedRequestDetails;
