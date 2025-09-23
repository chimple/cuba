import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import { OpsUtil } from "../../OpsUtility/OpsUtil";
import { t } from "i18next";

interface RejectedDetailsProps {
  requestData: any;
}

const RejectionDetails: React.FC<RejectedDetailsProps> = ({ requestData }) => {

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #f5c6cb",
        backgroundColor: "#FEF2F2",
        // maxWidth: 500,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "#7F1D1D", textAlign: "left" }}
      >
        {t("Rejection Details")}
      </Typography>

      <Divider sx={{ borderColor: "#f5c6cb", mb: 2 }} />

      <Typography sx={{ mb: 1, textAlign: "left" }}>
        <span style={{ color: "#7F1D1D", fontWeight: 500 }}>
          {t("Rejected By")}:
        </span>{" "}
        <span style={{ color: "#B91C1C" }}>{requestData.respondedBy.name}</span>
      </Typography>

      <Typography sx={{ mb: 2, textAlign: "left" }}>
        <span style={{ color: "#7F1D1D", fontWeight: 500 }}>
          {t("Rejected On")}:
        </span>{" "}
        <span style={{ color: "#B91C1C" }}>
          {OpsUtil.formatDT(requestData?.created_at)}
        </span>
      </Typography>

      {requestData.rejected_reason_description?.trim() && (
        <>
          <Divider sx={{ borderColor: "#f5c6cb", mb: 2 }} />

          <Typography
            sx={{
              mb: 1,
              fontWeight: 500,
              color: "#7F1D1D",
              textAlign: "left",
            }}
          >
            {t("Message to Admin")}:
          </Typography>
          <Box
            sx={{
              p: 1.5,
              border: "1px solid #7F1D1D",
              borderRadius: 1,
              backgroundColor: "#fff",
              // minHeight: 100,
              color: "#333",
              textAlign: "left",
            }}
          >
            {requestData.rejected_reason_description}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default RejectionDetails;
