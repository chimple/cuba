import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { ServiceConfig } from "../../services/ServiceConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  visitId: string | null;
}

const FcActivityDetailsPanel: React.FC<Props> = ({ open, onClose, visitId }) => {
  const api = ServiceConfig.getI().apiHandler;

  const [data, setData] = useState<any>(null);
  const [questionnaire, setQuestionnaire] = useState<any>({});

  useEffect(() => {
  if (open && visitId) fetchData();
}, [open, visitId]);

const fetchData = async () => {
  const rows = await api.getFcUserFormDetails(visitId!);

  if (!rows || rows.length === 0) {
    setData(null);
    return;
  }

  // Show the FIRST entry or merge them
  const entry = rows[0];
  setData(entry);

  try {
    const parsed = entry.question_response ? JSON.parse(entry.question_response) : {};
    setQuestionnaire(parsed);
  } catch (e) {
    setQuestionnaire({});
  }
};


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "480px",
          padding: "24px",
          backgroundColor: "#fff",
          overflowY: "auto",
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          FC Activity Details
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {!data && (
        <Typography>Loading...</Typography>
      )}

      {data && (
        <Box sx={{ textAlign: "left" }}>
          <Section label="Contact Target" value={data.contact_target} />
          <Section label="Contact Method" value={data.contact_method} />
          <Section label="Call Status" value={data.call_status} />
          <Section label="Support Level" value={data.support_level} />

          {Object.keys(questionnaire).length > 0 && (
            <>
              <Typography fontWeight={700} mt={3} mb={1}>
                Questionnaire
              </Typography>

              {Object.entries(questionnaire).map(([q, a], i) => (
                <Box key={i} mb={2}>
                  <Typography fontWeight={600}>{q}</Typography>
                  <Box
                    sx={{
                      background: "#f5f5f5",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  >
                    {"anmol"}
                  </Box>
                </Box>
              ))}
            </>
          )}

          <Section
            label="Tech Issues Reported"
            value={data.tech_issues_reported ? "Yes" : "No"}
          />

          {data.tech_issue_comment && (
            <Section label="Tech Issue Comment" value={data.tech_issue_comment} />
          )}

          {data.comment && (
            <Section label="Comment" value={data.comment} />
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default FcActivityDetailsPanel;

const Section = ({ label, value }: { label: string; value: any }) => (
  <Box mb={2}>
    <Typography fontWeight={600} mb={0.5}>
      {label}
    </Typography>
    <Box
      sx={{
        background: "#f8f8f8",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      {value ?? "—"}
    </Box>
  </Box>
);
