import React, { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES } from "../../common/constants";
import "./StudentRejectedRequestDetails.css";

const StudentRejectedRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

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
          else setError("Request not found");
        }
      } catch (e) {
        setError("Failed to load request details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, api, location.state]);

  if (isLoading)
    return (
      <div className="student-rejected-request-details-centered">
        <Typography>Loading request details...</Typography>
      </div>
    );
  if (error)
    return (
      <div className="student-rejected-request-details-centered">
        <Typography color="error">{error}</Typography>
        <Button onClick={() => history.goBack()}>Go Back</Button>
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
  const rejectedBy = requestDetails.rejectedBy || {};
  const requestedBy = requestDetails.requestedBy || {};

  return (
    <div className="student-rejected-request-details-layout">
      <Typography variant="h4" className="student-rejected-request-details-page-title">
        Requests
      </Typography>
      <div className="student-rejected-request-details-breadcrumbs">
        <span
          onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
          className="link"
        >
          Requests
        </span>
        <span> &gt; </span>
        <span
          onClick={() =>
            history.push(
              PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST + "?tab=REJECTED"
            )
          }
          className="link"
        >
          Rejected
        </span>
        <span> &gt; </span>
        <span className="active">Request ID - {id}</span>
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
              Request ID - {id}
            </Typography>
            <Divider sx={{ my: "1.5vh" }} />
            <div className="student-rejected-request-details-field-stack">
              <div className="label">School Name</div>
              <div className="value">{school.name || "-"}</div>
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="label">School ID (UDISE)</div>
              <div className="value">{school.udise || "-"}</div>
            </div>
            <Divider sx={{ my: "1.5vh" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                className="student-rejected-request-details-field-stack"
                style={{ flex: 1, marginRight: "1rem" }}
              >
                <div className="label">City</div>
                <div className="value">{school.group2 || "-"}</div>
              </div>
              <div className="student-rejected-request-details-field-stack" style={{ flex: 1 }}>
                <div className="label">State</div>
                <div className="value">{school.group1 || "-"}</div>
              </div>
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="label">District</div>
              <div className="value">{school.group3 || "-"}</div>
            </div>
            <Divider sx={{ my: "1.5vh" }} />
            <Typography variant="h6" className="student-rejected-request-details-card-title">
              Request Details
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <div className="student-rejected-request-details-label-sm">Request For:</div>
                <div className="student-rejected-request-details-value-sm">
                  {requestDetails.request_type || "-"}
                </div>
              </Grid>
              <Grid item xs={6}>
                <div className="student-rejected-request-details-label-sm">Requested On:</div>
                <div className="student-rejected-request-details-value-sm">
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
              Rejection Details
            </Typography>
            <Divider style={{ margin: "1.5vh 0" }} />
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">Reason:</span>
              <span className="student-rejected-request-details-value-reject">
                {requestDetails.rejected_reason_type || "-"}
              </span>
            </div>
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">Rejected by:</span>
              <span className="student-rejected-request-details-value-reject">{rejectedBy.name || "-"}</span>
            </div>
            <div className="student-rejected-request-details-label-row">
              <span className="student-rejected-request-details-label-reject">Rejected On:</span>
              <span className="student-rejected-request-details-value-reject">
                {formatDT(requestDetails.updated_at)}
              </span>
            </div>
          </Paper>
          <Paper className="student-rejected-request-details-details-card">
            <Typography variant="h6" className="student-rejected-request-details-card-title">
              Request From
            </Typography>
            <Divider style={{ margin: "1.5vh 0" }} />
            <div className="student-rejected-request-details-field-stack">
              <div className="label">Name :</div>
              <div>{requestedBy.name || "N/A"}</div>
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="label">Phone Number :</div>
              <div>{requestedBy.phone_number || "N/A"}</div>
            </div>
            <div className="student-rejected-request-details-field-stack">
              <div className="label">Email ID:</div>
              <div>{requestedBy.email || "N/A"}</div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default StudentRejectedRequestDetails;
