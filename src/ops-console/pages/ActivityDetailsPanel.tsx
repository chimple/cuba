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
   INLINE LABEL + VALUE  →  Name: Thilak  (with ID)
--------------------------------------------------------*/
const InfoRow = ({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: React.ReactNode;
}) => (
  <Box
    id={id}
    data-testid={id}
    sx={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
      mb: 1,
    }}
  >
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 500,
        color: "text.secondary",
        width: "90px",
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
   SECTION BOX WITH TITLE + GREY PAPER CONTENT  (with ID)
--------------------------------------------------------*/
const DetailSection = ({
  id,
  label,
  text,
}: {
  id: string;
  label: string;
  text: string;
}) => {
  return (
    <Box id={id} data-testid={id} sx={{ mb: 3 }}>
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
  call_not_reachable: t("No Response"),
};

const isValidText = (value?: string) => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "--";
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

  let questionAnswerPairs: Record<string, string> = {};

  try {
    questionAnswerPairs =
      typeof raw.question_response === "string"
        ? JSON.parse(raw.question_response)
        : raw.question_response || {};
  } catch (error) {
    questionAnswerPairs = {};
  }

  const otherComments = raw.comment || "--";

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
      <Box
        id="fc-header"
        data-testid="fc-header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6" fontWeight={600}>
          {t("Details")}
        </Typography>

        <IconButton id="fc-close-btn" data-testid="fc-close-btn" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* TOP INFO CARD */}
      <Paper
        id="fc-top-info-card"
        data-testid="fc-top-info-card"
        elevation={0}
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          pt: 1.5,
          pb: 0.3,
          px: 1.5,
          mb: 4,
          bgcolor: "#ffffff",
        }}
      >
        <Box display="flex" justifyContent="space-between">
          {/* LEFT */}
          <Box>
            <InfoRow id="fc-name" label={t("Name")} value={user?.name ?? "--"} />
            <InfoRow id="fc-grade" label={t("Grade")} value={classInfo?.name ?? "--"} />
            <InfoRow
              id="fc-contact-type"
              label={t("Contact Type")}
              value={contactType}
            />
          </Box>

          {/* RIGHT */}
          <Box textAlign="right">
            <InfoRow
              id="fc-profile-status"
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
              id="fc-time"
              label={t("Time")}
              value={OpsUtil.formatTimeToIST(raw.created_at)}
            />

            <InfoRow
              id="fc-tech-issues"
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
      <DetailSection
        id="fc-call-outcome"
        label={t("Call Outcome")}
        text={callOutcome}
      />

      {Object.entries(questionAnswerPairs).map(
        ([question, answer], index) => (
          <DetailSection
            key={index}
            id={`fc-question-${index}`}
            label={question}
            text={answer}
          />
        )
      )}

      <DetailSection
        id="fc-other-comments"
        label={t("Any other questions or comments?")}
        text={otherComments}
      />

      {raw.tech_issues_reported === true &&
        isValidText(raw.tech_issue_comment) && (
          <DetailSection
            id="fc-tech-issue-reported"
            label={t("Tech Issue Reported")}
            text={raw.tech_issue_comment ?? ""}
          />
        )}


    </Drawer>
  );
};

export default FcActivityDetailsPanel;
