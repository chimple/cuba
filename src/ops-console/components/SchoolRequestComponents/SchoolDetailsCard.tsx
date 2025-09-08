import React from "react";
import { Paper, Typography, Divider, Grid } from "@mui/material";
import "./SchoolDetailsCard.css";

interface SchoolDetailsCardProps {
  requestData?: any;
}

const formatDT = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SchoolDetailsCard: React.FC<SchoolDetailsCardProps> = ({
  requestData,
}) => {
  return (
    <Paper className="school-details-card">
      <Typography variant="subtitle1" className="school-details-title">
        Request ID - {requestData?.request_id || "-"}
      </Typography>
      <Divider sx={{ my: 1.5 }} />

      <div className="field-stack">
        <div className="label">School Name</div>
        <div className="value">{requestData.school.name || "-"}</div>
      </div>

      <div className="field-stack">
        <div className="label">School ID (UDISE)</div>
        <div className="value">{requestData.school.udise || "-"}</div>
      </div>

      <Divider sx={{ my: 1.5 }} />

      <div className="row">
        <div className="field-stack" style={{ flex: 1, marginRight: "1rem" }}>
          <div className="label">City</div>
          <div className="value">{requestData.school.group2 || "-"}</div>
        </div>
        <div className="field-stack" style={{ flex: 1 }}>
          <div className="label">State</div>
          <div className="value">{requestData.school.group1 || "-"}</div>
        </div>
      </div>

      {/* District */}
      <div className="field-stack">
        <div className="label">District</div>
        <div className="value">{requestData.school.group3 || "-"}</div>
      </div>

      <Divider sx={{ my: 1.5 }} />

      {/* Request Details */}
      <Typography variant="subtitle1" className="school-details-title">
        Request Details
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <div className="label-sm">Request For:</div>
          <div className="value-sm">
            {"New School"}
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="label-sm">Requested On:</div>
          <div className="value-sm">
            {formatDT(requestData?.created_at)}
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SchoolDetailsCard;
