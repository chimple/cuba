import React, { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { DEFAULT_PAGE_SIZE, PAGES, REQUEST_TABS, RequestTypes } from "../../common/constants";
import "./OpsApprovedRequestDetails.css";

const OpsApprovedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const api = ServiceConfig.getI().apiHandler;

  type RequestDetails = {
    school?: {
      name?: string;
      udise?: string;
      country?: string;
      group1?: string;
      group2?: string;
      group3?: string;
    };
    respondedBy?: { name?: string };
    requestedBy?: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
    };
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
  const [parent, setParent] = useState<any>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const state = location.state as { request?: any } | undefined;

        let req: RequestDetails | null = null;
        if (state?.request && state.request.request_id === id) {
          req = state.request;
          setRequestDetails(state.request);
        } else {
          const approvedRequest = await api.getOpsRequests(
            "approved",
            1,
            DEFAULT_PAGE_SIZE
          );
          req = approvedRequest?.find((r) => r.request_id === id);
          if (req) setRequestDetails(req);
          else setError(t("requestNotFound"));
        }

        if (req?.request_type === RequestTypes.STUDENT && req?.requestedBy?.id) {
          const data = await api.getStudentAndParentByStudentId(
            req.requestedBy.id
          );
          setParent(data?.parents?.[0]);
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
      <div className="ops-approved-request-details-centered">
        <Typography>{t("loadingRequestDetails")}</Typography>
      </div>
    );
  if (error)
    return (
      <div className="ops-approved-request-details-centered">
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
  const phone =
    requestDetails?.request_type === RequestTypes.STUDENT
      ? parent?.phone
      : requestedBy?.phone;

  const email =
    requestDetails?.request_type === RequestTypes.STUDENT
      ? parent?.email
      : requestedBy?.email;

  return (
    <div className="ops-approved-request-details-layout">
      <Typography
        variant="h4"
        className="ops-approved-request-details-page-title"
      >
        {t("Requests")}
      </Typography>
      <div className="ops-approved-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="ops-approved-request-details-link"
        >
          {t("Requests")}
        </span>
        <span> &gt; </span>
        <span
          onClick={() =>
            history.push({
              pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
              search: `?tab=${REQUEST_TABS.APPROVED}`,
            })
          }
          className="ops-approved-request-details-link"
        >
          {t("Approved")}
        </span>
        <span> &gt; </span>
        <span className="ops-approved-request-details-active">
          {t("RequestId")} - {id}
        </span>
      </div>
      <Grid
        container
        spacing={3}
        className="ops-approved-request-details-main-content-row"
        alignItems="flex-start"
        justifyContent="flex-start"
      >
        {/* LEFT SIDE */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper className="ops-approved-request-details-card">
            <Typography
              variant="h6"
              className="ops-approved-request-details-card-title"
            >
              {t("Request Id")} - {id}
            </Typography>
            <Divider className="ops-approved-request-details-divider" />

            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("School Name")}
              </div>
              <div>{school.name || "-"}</div>
            </div>
            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("School Id (UDISE)")}
              </div>
              <div>{school.udise || "N/A"}</div>
            </div>
            <Divider className="ops-approved-request-details-divider" />

            <div className="ops-approved-request-details-flex-row">
              <div className="ops-approved-request-details-field-stack ops-approved-request-details-mr">
                <div className="ops-approved-request-details-label">
                  {t("District")}
                </div>
                <div>{school.group2 || "N/A"}</div>
              </div>
              <div className="ops-approved-request-details-field-stack">
                <div className="ops-approved-request-details-label">
                  {t("State")}
                </div>
                <div>{school.group1 || "N/A"}</div>
              </div>
            </div>
            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("Country")}
              </div>
              <div>{school.country || "N/A"}</div>
            </div>
            <Divider className="ops-approved-request-details-divider" />
            <Typography
              variant="h6"
              className="ops-approved-request-details-card-title"
            >
              {t("Request Details")}
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <div className="ops-approved-request-details-label-sm">
                  {t("Request For")}
                </div>
                <div>{requestDetails.request_type || "-"}</div>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <div className="ops-approved-request-details-label-sm">
                  {t("Requested On")}
                </div>
                <div>{formatDT(requestDetails.created_at)}</div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* RIGHT SIDE */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper className="ops-approved-request-details-card">
            <Typography
              variant="h6"
              className="ops-approved-request-details-card-title"
            >
              {t("Approved Details")}
            </Typography>
            <Divider className="ops-approved-request-details-divider" />
            <div className="ops-approved-request-details-label-row">
              <span>{t("Approved By")}</span>
              <span>{approvedBy.name || "-"}</span>
            </div>
            <div className="ops-approved-request-details-label-row">
              <span>{t("Approved On")}</span>
              <span>{formatDT(requestDetails.updated_at)}</span>
            </div>
          </Paper>

          <Paper className="ops-approved-request-details-card">
            <Typography
              variant="h6"
              className="ops-approved-request-details-card-title"
            >
              {t("Request From")}
            </Typography>
            <Divider className="ops-approved-request-details-divider" />
            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("Name")}
              </div>
              <div>{requestedBy.name || "N/A"}</div>
            </div>
            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("Phone Number")}
              </div>
              <div>{phone || "N/A"}</div>
            </div>
            <div className="ops-approved-request-details-field-stack">
              <div className="ops-approved-request-details-label">
                {t("Email Id")}
              </div>
              <div>{email || "N/A"}</div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default OpsApprovedRequestDetails;
