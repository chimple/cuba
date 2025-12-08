import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Divider,
  Drawer,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { PERFORMANCE_UI, PerformanceLevel } from "../../common/constants";
import { OpsUtil } from "../OpsUtility/OpsUtil";

/* -------------------------------------------------------
   INLINE LABEL + VALUE  →  Name: Thilak
--------------------------------------------------------*/
const InfoRow = ({ label, value }: { label: string; value: any }) => {
  return (
    <Box sx={{ display: "flex", mb: 1 }}>
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          color: "text.secondary",
          minWidth: "120px",
        }}
      >
        {label}:
      </Typography>

      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/* -------------------------------------------------------
   SECTION BOX WITH TITLE + GREY PAPER CONTENT
--------------------------------------------------------*/
const DetailSection = ({ label, text }: { label: string; text: string }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "15px",
          mb: 1,
          textAlign: "left",
        }}
      >
        {label}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          bgcolor: "#fafafa",
          fontSize: "14px",
          whiteSpace: "pre-line",
        }}
      >
        {text || "--"}
      </Paper>
    </Box>
  );
};

/* -------------------------------------------------------
   MAIN PANEL
--------------------------------------------------------*/
interface Props {
  activity: any; // Later from backend
  onClose: () => void;
}

const CALL_STATUS_LABEL: Record<string, string> = {
  call_picked: "Call Attended",
  call_later: "Call Later",
  call_not_reachable: "Call Not Reachable",
};

const FcActivityDetailsPanel: React.FC<Props> = ({ activity, onClose }) => {
  if (!activity) return null;

  const { raw, user, classInfo } = activity;

  const perf = PERFORMANCE_UI[raw.support_level as PerformanceLevel];

  const contactType =
    raw.contact_target.charAt(0).toUpperCase() +
    raw.contact_target.slice(1);

  const callOutcome =
    CALL_STATUS_LABEL[raw.call_status] || raw.call_status || "--";

  const challenges = raw.question_response || "--";
  const howHelped = raw.how_helped || "--";
  const otherComments = raw.comment || "--";
  const techIssueDetails = raw.tech_issues_reported ? "Yes" : "No";

  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          p: 3,
          bgcolor: "#ffffff",
        },
      }}
    >
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          Details
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* TOP INFO CARD */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          p: 2.5,
          mb: 4,
          bgcolor: "#ffffff",
        }}
      >
        <Box display="flex" justifyContent="space-between">
          {/* LEFT */}
          <Box>
            <InfoRow label="Name" value={user?.name ?? "--"} />
            <InfoRow label="Grade" value={classInfo?.name ?? "--"} />
            <InfoRow label="Contact Type" value={contactType} />
          </Box>

          {/* RIGHT */}
          <Box textAlign="right">
            <InfoRow
              label="Profile Status"
              value={
                <Chip
                  label={perf?.label ?? "NA"}
                  size="small"
                  sx={{
                    bgcolor: perf?.bgColor,
                    color: perf?.textColor,
                    fontWeight: 600,
                  }}
                />
              }
            />

            <InfoRow
              label="Time"
              value={OpsUtil.formatTimeToIST(raw.created_at)}
            />

            <InfoRow
              label="Tech Issues"
              value={
                raw.tech_issues_reported ? (
                  <Chip
                    label="Yes"
                    size="small"
                    sx={{
                      bgcolor: "#fff3cd",
                      color: "#b26a00",
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  "--"
                )
              }
            />
          </Box>
        </Box>
      </Paper>

      {/* SECTIONS */}
      <DetailSection label="Call Outcome" text={callOutcome} />

      <DetailSection
        label="What challenges did they mention while using the app?"
        text={challenges}
      />

      <DetailSection
        label="How did you help them understand its use?"
        text={howHelped}
      />

      <DetailSection
        label="Any other questions or comments?"
        text={otherComments}
      />

      <DetailSection label="Tech Issue Reported" text={techIssueDetails} />
    </Drawer>
  );
};

export default FcActivityDetailsPanel;
