import React from "react";
import { Paper, Typography, Divider } from "@mui/material";
import "./RequestFromCard.css";
import { t } from "i18next";

interface RequestFromCardProps {
  requestedBy: {
    name: string;
    phone: string;
    email?: string;
  };
}

const RequestFromCard: React.FC<RequestFromCardProps> = ({ requestedBy }) => {
  return (
    <Paper className="request-from-card" elevation={0}>
      <Typography variant="subtitle1" className="request-from-title">
        {t("Request From")}
      </Typography>
      <Divider sx={{ my: 1.5 }} />

      <div className="request-from-field-stack">
        <div className="request-from-label">{t("Name")}</div>
        <div className="request-from-value">{requestedBy?.name || "-"}</div>
      </div>

      <div className="request-from-field-stack">
        <div className="request-from-label">{t("Phone Number")}</div>
        <div className="request-from-value">{requestedBy?.phone || "-"}</div>
      </div>

      <div className="request-from-field-stack">
        <div className="request-from-label">{t("Email ID")}</div>
        <div className="request-from-value">{requestedBy?.email || "-"}</div>
      </div>
    </Paper>
  );
};

export default RequestFromCard;
