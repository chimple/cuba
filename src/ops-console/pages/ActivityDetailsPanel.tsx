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
import { t } from "i18next";
import { FcActivity } from "../../interface/modelInterfaces";

/* -------------------------------------------------------
   INLINE LABEL + VALUE  →  Name: Thilak
--------------------------------------------------------*/
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
      mb: 1,
    }}
  >
    {/* FIXED LABEL WIDTH — THIS FIXES THE ALIGNMENT */}
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 500,
        color: "text.secondary",
        width: "120px", // FIX WIDTH
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {label}:
    </Typography>

    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 600,
        color: "text.primary",
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </Typography>
  </Box>
);


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
  activity: FcActivity;
  onClose: () => void;
}

const CALL_STATUS_LABEL: Record<string, string> = {
  call_picked: t("Call Attended"),
  call_later: t("Call Later"),
  call_not_reachable: t("Call Not Reachable"),
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
          {t("Details")}
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
            <InfoRow label={t("Name")} value={user?.name ?? "--"} />
            <InfoRow label={t("Grade")} value={classInfo?.name ?? "--"} />
            <InfoRow label={t("Contact Type")} value={contactType} />
          </Box>

          {/* RIGHT */}
          <Box textAlign="right">
            <InfoRow
              label={t("Profile Status")}
              value={
                <Chip
                  label={perf?.label ?? t("NA")}
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
              label={t("Time")}
              value={OpsUtil.formatTimeToIST(raw.created_at)}
            />

            <InfoRow
              label={t("Tech Issues")}
              value={
                raw.tech_issues_reported ? (
                  <Chip
                    label={t("Yes")}
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
      <DetailSection label={t("Call Outcome")} text={callOutcome} />

      <DetailSection
        label={t("What challenges did they mention while using the app?")}
        text={challenges}
      />

      <DetailSection
        label={t("How did you help them understand its use?")}
        text={howHelped}
      />

      <DetailSection
        label={t("Any other questions or comments?")}
        text={otherComments}
      />

      <DetailSection label={t("Tech Issue Reported")} text={techIssueDetails} />
    </Drawer>
  );
};

export default FcActivityDetailsPanel;
