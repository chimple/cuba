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

interface ActivityDetailsPanelProps {
  activity: any; // row passed from SchoolActivities
  onClose: () => void;
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box mb={1}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

const DetailSection = ({ label, text }: { label: string; text: string }) => (
  <Box mb={3}>
    <Typography fontWeight={600} mb={1}>
      {label}
    </Typography>

    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        bgcolor: "#f9f9f9",
        whiteSpace: "pre-line",
      }}
    >
      {text || "--"}
    </Paper>
  </Box>
);

const CALL_STATUS_LABEL: Record<string, string> = {
  call_picked: "Call Attended",
  call_later: "Call Later",
  call_not_reachable: "Call Not Reachable",
};

const ActivityDetailsPanel: React.FC<ActivityDetailsPanelProps> = ({
  activity,
  onClose,
}) => {
  const { raw, user, classInfo } = activity;

  const perf = PERFORMANCE_UI[raw.support_level as PerformanceLevel];

  const contactType =
    raw.contact_target.charAt(0).toUpperCase() + raw.contact_target.slice(1);

  const callOutcome =
    CALL_STATUS_LABEL[raw.call_status as string] || raw.call_status || "NA";
  const comment = raw.comment || "";
  const questionResponse = raw.question_response || "";

  // For now, we use simple mapping – adjust when you have structured data:
  const challenges = questionResponse || comment || "No Comment";
  const howHelped = "--";
  const otherComments = "--";
  const techIssueDetails = raw.tech_issues_reported ? "Yes" : "No";

  return (
    <Drawer
      anchor="right"
      open={true} // component is only mounted when selectedActivity is truthy
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          boxSizing: "border-box",
          p: 3,
          bgcolor: "#ffffff",
        },
      }}
      ModalProps={{
        keepMounted: true,
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

      {/* TOP INFORMATION CARD */}
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
          {/* LEFT SIDE */}
          <Box>
            <InfoItem label="Name" value={user?.name ?? "--"} />
            <InfoItem label="Grade" value={classInfo?.name ?? "--"} />
            <InfoItem label="Contact Type" value={contactType} />
          </Box>

          {/* RIGHT SIDE */}
          <Box textAlign="right">
            <InfoItem
              label="Profile Status"
              value={
                <Chip
                  label={perf?.label ?? "Not Tracked"}
                  size="small"
                  sx={{
                    bgcolor: perf?.bgColor,
                    color: perf?.textColor,
                    fontWeight: 600,
                  }}
                />
              }
            />

            <InfoItem
              label="Time"
              value={OpsUtil.formatTimeToIST(raw.created_at)}
            />

            <InfoItem
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

      {/* MAIN SECTIONS */}
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

export default ActivityDetailsPanel;
