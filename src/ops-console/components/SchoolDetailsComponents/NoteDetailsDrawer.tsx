// NoteDetailsDrawer.tsx
import {useState} from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Drawer,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { t } from "i18next";
import "./NoteDetailsDrawer.css";

/* helpers */
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

  const d1 = new Date(dateStr);
  if (!isNaN(d1.getTime())) {
    return d1.toLocaleDateString("en-GB");
  }

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

  return dateStr.trim();
}

/* Info row */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="note-details-drawer-info-row" id="note-details-drawer-info-row">
    <span className="note-details-drawer-info-label" id="note-details-drawer-info-label">{label}:</span>
    <span className="note-details-drawer-info-value" id="note-details-drawer-info-value">{value}</span>
  </div>
);

/* Notes section */
const DetailSection = ({ label, text }: { label: string; text: string }) => (
  <div>
    <div className="note-details-drawer-section-title" id="note-details-drawer-section-title">{label}</div>
    <div className="note-details-drawer-section-paper" id="note-details-drawer-section-paper">
      {text || "--"}
    </div>
  </div>
);

interface MediaItem {
  url: string;
  type: "image" | "video";
}

const MediaSection = ({
  id,
  label,
  media,
}: {
  id: string;
  label: string;
  media: MediaItem[];
}) => {
  const [open, setOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMedia(null);
  };

  if (!media || media.length === 0) {
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
          }}
        >
          --
        </Paper>
      </Box>
    );
  }

  return (
    <>
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {media.map((item, index) => (
            <Box
              key={index}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fafafa",
              }}
              onClick={() => handleClick(item)}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <video
                  src={item.url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  muted
                  preload="metadata"
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {selectedMedia && selectedMedia.type === "image" ? (
            <img
              src={selectedMedia.url}
              alt="Full size"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : selectedMedia ? (
            <video
              src={selectedMedia.url}
              controls
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("Close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

type Note = {
  id: string;
  createdBy: string;
  role: string;
  className?: string | null;
  date?: string;
  text: string;
  media_links?: string;
};

interface Props {
  note: Note | null;
  open: boolean;
  onClose: () => void;
}

const NoteDetailsDrawer: React.FC<Props> = ({ note, open, onClose }) => {
  if (!note) return null;

  console.log("NoteDetailsDrawer rendering with note:", note);

  let mediaItems: MediaItem[] = [];

if (note.media_links) {
  try {
    const links: string[] =
      typeof note.media_links === "string"
        ? JSON.parse(note.media_links)
        : [];
      console.log("Parsed media links:🙌🙌🙌🙌🙌", links);

    mediaItems = links.map((url) => ({
      url,
      type: url.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|mpg|mpeg|3gp|m4v)$/i) ? "video" : "image",
    }));
  } catch (err) {
    console.error("Invalid media_links JSON", err);
    mediaItems = [];
  }
}

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
        className: "note-details-drawer-paper",
      }}
    >
      {/* Header */}
      <div className="note-details-drawer-header" id="note-details-drawer-header">
        <Typography className="note-details-drawer-title" id="note-details-drawer-title">
          {t("Note Details")}
        </Typography>

        <IconButton onClick={onClose} aria-label="close-note-drawer">
          <CloseIcon />
        </IconButton>
      </div>

      <Divider className="note-details-drawer-divider" id="note-details-drawer-divider"/>

      {/* Info card */}
      <Paper elevation={0}>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <InfoRow label={t("Created By")} value={note.createdBy} />
            <InfoRow label={t("Role")} value={note.role} />
            <InfoRow label={t("Class")} value={note.className ?? "--"} />
          </Box>

          <Box textAlign="right">
            <div className="note-details-drawer-info-label" id="note-details-drawer-info-label">{t("Date")}</div>
            <div className="note-details-drawer-info-value" id="note-details-drawer-info-value">{displayDate}</div>
          </Box>
        </Box>
      </Paper>

      {/* Notes */}
      <div className="note-details-drawer-notes-container" id="note-details-drawer-notes-container">
        <DetailSection label={t("Notes")} text={note.text} />
      </div>

      {/* Media Section */}
      <div className="note-details-drawer-media-container" id="note-details-drawer-media-container">
        <MediaSection
          id="note-details-drawer-media-section"
          label={t("Attached Media")}
          media={mediaItems}
        />
      </div>
    </Drawer>
  );
};

export default NoteDetailsDrawer;
