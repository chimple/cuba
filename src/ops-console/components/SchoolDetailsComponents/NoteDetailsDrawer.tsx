// NoteDetailsDrawer.tsx
import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { t } from "i18next";

/* ----------------------------------------------------
   helpers
----------------------------------------------------*/
function parseMonthNameToNumber(mon: string): number | null {
  const m = mon.toLowerCase().slice(0, 3);
  const map: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return map[m] ?? null;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";

  // try direct Date parse (works for ISO)
  const d1 = new Date(dateStr);
  if (!isNaN(d1.getTime())) {
    return d1.toLocaleDateString("en-GB"); // dd/mm/yyyy
  }

  // try format like "22 - Nov - 2025" or "22 - Nov - 2025"
  const parts = dateStr.split("-").map((p) => p.trim());
  if (parts.length === 3) {
    const [dayRaw, monRaw, yearRaw] = parts;
    const day = Number(dayRaw);
    const monthNum = parseMonthNameToNumber(monRaw);
    const year = Number(yearRaw);
    if (!Number.isNaN(day) && monthNum && !Number.isNaN(year)) {
      const dt = new Date(year, monthNum - 1, day);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString("en-GB");
    }
  }

  // fallback: return original trimmed string
  return dateStr.trim();
}

/* inline label/value row */
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
    <Typography
      sx={{
        fontSize: 14,
        fontWeight: 500,
        color: "text.secondary",
        width: 110,
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {label}:
    </Typography>
    <Typography
      sx={{
        fontSize: 14,
        fontWeight: 700,
        color: "text.primary",
        textAlign: "left",
      }}
    >
      {value}
    </Typography>
  </Box>
);

/* section with title + paper */
const DetailSection = ({ label, text }: { label: string; text: string }) => (
  <Box sx={{ mb: 3 }}>
    <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1, textAlign: "left" }}>
      {label}
    </Typography>
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e8e8e8",
        bgcolor: "#fafafa",
        fontSize: 14,
        whiteSpace: "pre-line",
        minHeight: 120,
        maxHeight: 360,
        overflow: "auto",
      }}
    >
      {text || "--"}
    </Paper>
  </Box>
);

type Note = {
  id: string;
  createdBy: string;
  role: string;
  className?: string | null;
  // accept either ISO ("2023-02-12") or display strings ("22 - Nov - 2025")
  date?: string;
  text: string;
};

interface Props {
  note: Note | null;
  open: boolean;
  onClose: () => void;
}

const NoteDetailsDrawer: React.FC<Props> = ({ note, open, onClose }) => {
  if (!note) return null;

  const displayDate = formatDate(note.date);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
        BackdropProps: { style: { backgroundColor: "rgba(0,0,0,0.45)" } },
      }}
      PaperProps={{
        sx: {
          width: 520,
          p: 3,
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      {/* HEADER: left aligned */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600} sx={{ textAlign: "left" }}>
          {t("Note Details")}
        </Typography>

        <IconButton onClick={onClose} aria-label="close-note-drawer">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* TOP INFO CARD: left info + right date */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e8e8e8",
          borderRadius: 2,
          p: 2.5,
          mb: 4,
          bgcolor: "#ffffff",
          width: "100%",
        }}
      >
        <Box display="flex" justifyContent="space-between" gap={2} alignItems="flex-start">
          {/* LEFT: Created By / Role / Class */}
          <Box>
            <InfoRow label={t("Created By")} value={note.createdBy} />
            <InfoRow label={t("Role")} value={note.role} />
            <InfoRow label={t("Class")} value={note.className ?? "--"} />
          </Box>

          {/* RIGHT: Date (aligned to top-right) */}
          <Box textAlign="right" sx={{ minWidth: 120 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>
              {t("Date")}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 0.5 }}>
              {displayDate}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* NOTES SECTION */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <DetailSection label={t("Notes")} text={note.text} />
      </Box>
    </Drawer>
  );
};

export default NoteDetailsDrawer;
