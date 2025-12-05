import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  open: boolean;
  onClose: () => void;
}

// ----------------------
// REUSABLE COMPONENTS
// ----------------------

const InfoItem = ({ label, value }: { label: string; value: any }) => (
  <Box mb={1.2}>
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
      {text}
    </Paper>
  </Box>
);

// ----------------------
// MAIN COMPONENT
// ----------------------

const FcActivityDetailsPanel: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          p: 3,
          bgcolor: "#fff",
        },
      }}
    >
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          FC Activity Details
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
        }}
      >
        <Box display="flex" justifyContent="space-between">
          {/* LEFT SIDE */}
          <Box>
            <InfoItem label="Name" value="Sneha Reddy" />
            <InfoItem label="Grade" value="1A" />
            <InfoItem label="Contact Type" value="Student" />
          </Box>

          {/* RIGHT SIDE */}
          <Box textAlign="right">
            <InfoItem
              label="Profile Status"
              value={
                <Chip
                  label="Need Help"
                  size="small"
                  sx={{
                    bgcolor: "#ffebee",
                    color: "#c62828",
                    fontWeight: 600,
                  }}
                />
              }
            />

            <InfoItem label="Time" value="03:00 PM" />

            <InfoItem
              label="Tech Issues"
              value={
                <Chip
                  label="Yes"
                  size="small"
                  sx={{
                    bgcolor: "#fff3cd",
                    color: "#b26a00",
                    fontWeight: 600,
                  }}
                />
              }
            />
          </Box>
        </Box>
      </Paper>

      {/* MAIN SECTIONS */}
      <DetailSection label="Call Outcome" text="Call Attended" />

      <DetailSection
        label="What challenges did the student mention while using the app?"
        text={`Having trouble understanding fractions and decimal conversions.
Finds it difficult to relate concepts to real-world scenarios.`}
      />

      <DetailSection
        label="How did you help them understand its use?"
        text={`Demonstrated practical examples using money and measurements.
Shared visual learning resources and practice worksheets.`}
      />

      <DetailSection
        label="Any other questions or comments?"
        text={`Student is motivated but needs regular practice sessions.
Parent requested weekly progress updates.`}
      />

      <DetailSection
        label="Tech Issue Reported"
        text={`Student is motivated but needs regular practice sessions.
Parent requested weekly progress updates.`}
      />
    </Drawer>
  );
};

export default FcActivityDetailsPanel;
