import React from "react";
import { Paper, Typography, Divider } from "@mui/material";
import "./RequestFromCard.css";

interface RequestFromCardProps {
  requestedBy: {
    name: string;
    phone_number: string;
    email?: string;
  };
}

const RequestFromCard: React.FC<RequestFromCardProps> = ({ requestedBy }) => {
  return (
    <Paper className="request-from-card" elevation={0}>
      <Typography variant="subtitle1" className="request-from-title">
        Request From
      </Typography>
      <Divider sx={{ my: 1.5 }} />

      <div className="field-stack">
        <div className="label">Name</div>
        <div className="value">{requestedBy?.name || "-"}</div>
      </div>

      <div className="field-stack">
        <div className="label">Phone Number</div>
        <div className="value">{requestedBy?.phone_number || "-"}</div>
      </div>

      <div className="field-stack">
        <div className="label">Email ID</div>
        <div className="value">{requestedBy?.email || "-"}</div>
      </div>
    </Paper>
  );
};

export default RequestFromCard;
