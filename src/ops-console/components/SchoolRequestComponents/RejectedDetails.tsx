import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";


interface RejectedDetailsProps {
  requestData: any;
}

const RejectionDetails: React.FC<RejectedDetailsProps>  = ({
    requestData
}) => {

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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #f5c6cb",
        backgroundColor: "#FEF2F2",
        maxWidth: 500,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "#7F1D1D", textAlign: "left" }}
      >
        Rejection Details
      </Typography>

      <Divider sx={{ borderColor: "#f5c6cb", mb: 2 }} />

      <Typography sx={{ mb: 1, textAlign: "left" }}>
        <span style={{ color: "#7F1D1D", fontWeight: 500 }}>Rejected By:</span>{" "}
        <span style={{ color: "#B91C1C" }}>{requestData.respondedBy.name}</span>
      </Typography>

      <Typography sx={{ mb: 2, textAlign: "left" }}>
        <span style={{ color: "#7F1D1D", fontWeight: 500 }}>Rejected On:</span>{" "}
        <span style={{ color: "#B91C1C" }}>{formatDT(requestData?.created_at)}</span>
      </Typography>

      <Divider sx={{ borderColor: "#f5c6cb", mb: 2 }} />

      <Typography
        sx={{
          mb: 1,
          fontWeight: 500,
          color: "#7F1D1D",
          textAlign: "left",
          
        }}
      >
        Message to Admin:
      </Typography>
      <Box
        sx={{
          p: 1.5,
          border: "1px solid #7F1D1D",
          borderRadius: 1,
          backgroundColor: "#fff",
           minHeight: 100,
          color: "#333",
          fontSize: "14px",
          textAlign: "left",
        }}
      >
        {requestData.rejected_reason_description}
      </Box>
    </Paper>
  );
};

export default RejectionDetails;
