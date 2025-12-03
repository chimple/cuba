import React from "react";
import { Paper, Typography, Divider, Grid } from "@mui/material";
import "./SchoolDetailsCard.css";
import { OpsUtil } from "../../OpsUtility/OpsUtil";
import { t } from "i18next";

interface SchoolDetailsCardProps {
  requestData?: any;
}

const SchoolDetailsCard: React.FC<SchoolDetailsCardProps> = ({
  requestData,
}) => {
  return (
    <Paper className="school-details-card">
      <Typography variant="subtitle1" className="school-details-title">
        {t("Request ID")} - {requestData?.request_id || "-"}
      </Typography>
      <Divider sx={{ my: 1.5 }} />

      <div className="school-details-field-stack">
        <div className="school-details-label">{t("School Name") || ""}</div>
        <div className="school-details-value">
          {requestData.school.name || "-"}
        </div>
      </div>

      <div className="school-details-field-stack">
        <div className="school-details-label">{t("School ID")} (UDISE)</div>
        <div className="school-details-value">
          {requestData.school.udise || "-"}
        </div>
      </div>

      <Divider sx={{ my: 1.5 }} />

      <div className="school-details-row">
        <div
          className="school-details-field-stack"
          style={{ flex: 1, marginRight: "1rem" }}
        >
          <div className="school-details-label">{t("Block")}</div>
          <div className="school-details-value">
            {requestData.school.group3 || "-"}
          </div>
        </div>
        <div className="school-details-field-stack" style={{ flex: 1 }}>
          <div className="school-details-label">{t("State")}</div>
          <div className="school-details-value">
            {requestData.school.group1 || "-"}
          </div>
        </div>
      </div>

      <div className="school-details-field-stack">
        <div className="school-details-label">{t("District")}</div>
        <div className="school-details-value">
          {requestData.school.group2 || "-"}
        </div>
      </div>
      <div className="school-details-field-stack">
        <div className="school-details-label">{t("Address")}</div>
        <div className="school-details-value">
          {requestData.school.address || "-"}
        </div>
      </div>

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="subtitle1" className="school-details-text">
        Request Details
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6 }}>
          <div className="school-details-label-sm">{t("Request For")}:</div>
          <div className="school-details-value-sm">{t("New School")}</div>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <div className="school-details-label-sm">{t("Requested On")}:</div>
          <div className="school-details-value-sm">
            {OpsUtil.formatDT(requestData?.created_at)}
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SchoolDetailsCard;
