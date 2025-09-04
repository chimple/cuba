import React, { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { DEFAULT_PAGE_SIZE, PAGES } from "../../common/constants";
import "./StudentApprovedRequestDetails.css";

const StudentApprovedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const api = ServiceConfig.getI().apiHandler;

  type RequestDetails = {
    school?: {
      name?: string;
      udise?: string;
      group2?: string;
      group1?: string;
      group3?: string;
    };
    respondedBy?: { name?: string };
    requestedBy?: { name?: string; phone_number?: string; email?: string };
    request_id?: string;
    request_type?: string;
    created_at?: string;
    updated_at?: string;
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
          const approvedRequest = await api.getOpsRequests(
            "approved",
            1,
            DEFAULT_PAGE_SIZE
          );
          const req = approvedRequest?.find((r) => r.request_id === id);
          if (req) setRequestDetails(req);
          else setError(t("requestNotFound"));
        }
      } catch {
        setError(t("failedToLoadRequest"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, api, location.state, t]);

  if (isLoading)
    return (
      <div className="student-approved-request-details-centered">
        <Typography>{t("loadingRequestDetails")}</Typography>
      </div>
    );
  if (error)
    return (
      <div className="student-approved-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>{t("goBack")}</Button>
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
      : "-";

  const school = requestDetails.school || {};
  const approvedBy = requestDetails.respondedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  return (
    <div className="student-approved-request-details-layout">
      <Typography
        variant="h4"
        className="student-approved-request-details-page-title"
      >
        {t("Requests")}
      </Typography>
      <div className="student-approved-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="student-approved-request-details-link"
        >
          {t("Requests")}
        </span>
        <span>&gt;</span>
        <span className="student-approved-request-details-active">
          {t("RequestId")} - {id}
        </span>
      </div>
      <Grid
        container
        spacing={3}
        className="student-approved-request-details-main-content-row"
        alignItems="flex-start"
        justifyContent="flex-start"
      >
        {/* LEFT SIDE */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper className="student-approved-request-details-card">
            <Typography
              variant="h6"
              className="student-approved-request-details-card-title"
            >
              {t("Request Id")} - {id}
            </Typography>
            <Divider className="student-approved-request-details-divider" />

            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("School Name")}
              </div>
              <div>{school.name || "-"}</div>
            </div>
            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("School Id (UDISE)")}
              </div>
              <div>{school.udise || "N/A"}</div>
            </div>
            <Divider className="student-approved-request-details-divider" />

            <div className="student-approved-request-details-flex-row">
              <div className="student-approved-request-details-field-stack student-approved-request-details-mr">
                <div className="student-approved-request-details-label">
                  {t("City")}
                </div>
                <div>{school.group2 || "N/A"}</div>
              </div>
              <div className="student-approved-request-details-field-stack">
                <div className="student-approved-request-details-label">
                  {t("State")}
                </div>
                <div>{school.group1 || "N/A"}</div>
              </div>
            </div>
            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("District")}
              </div>
              <div>{school.group3 || "N/A"}</div>
            </div>
            <Divider className="student-approved-request-details-divider" />
            <Typography
              variant="h6"
              className="student-approved-request-details-card-title"
            >
              {t("Request Details")}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <div className="student-approved-request-details-label-sm">
                  {t("Request For")}
                </div>
                <div>{requestDetails.request_type || "-"}</div>
              </Grid>
              <Grid item xs={6}>
                <div className="student-approved-request-details-label-sm">
                  {t("Requested On")}
                </div>
                <div>{formatDT(requestDetails.created_at)}</div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* RIGHT SIDE */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper className="student-approved-request-details-card">
            <Typography
              variant="h6"
              className="student-approved-request-details-card-title"
            >
              {t("Approved Details")}
            </Typography>
            <Divider className="student-approved-request-details-divider" />
            <div className="student-approved-request-details-label-row">
              <span>{t("Approved By")}</span>
              <span>{approvedBy.name || "-"}</span>
            </div>
            <div className="student-approved-request-details-label-row">
              <span>{t("Approved On")}</span>
              <span>{formatDT(requestDetails.updated_at)}</span>
            </div>
          </Paper>

          <Paper className="student-approved-request-details-card">
            <Typography
              variant="h6"
              className="student-approved-request-details-card-title"
            >
              {t("Request From")}
            </Typography>
            <Divider className="student-approved-request-details-divider" />
            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("Name")}
              </div>
              <div>{requestedBy.name || "N/A"}</div>
            </div>
            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("Phone Number")}
              </div>
              <div>{requestedBy.phone_number || "N/A"}</div>
            </div>
            <div className="student-approved-request-details-field-stack">
              <div className="student-approved-request-details-label">
                {t("Email Id")}
              </div>
              <div>{requestedBy.email || "N/A"}</div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default StudentApprovedRequestDetails;
