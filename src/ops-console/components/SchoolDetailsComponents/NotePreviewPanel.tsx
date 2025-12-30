// NotePreviewPanel.tsx
import React from "react";
import { t } from "i18next";

interface NotePreviewProps {
  note: any | null;
  onClose: () => void;
}

/**
 * Right-side panel preview for viewing a note.
 * UI-only, no backend logic.
 */
const NotePreviewPanel: React.FC<NotePreviewProps> = ({ note, onClose }) => {
  if (!note) return null;

  return (
    <div className="note-preview-overlay">
      <div className="note-preview-panel">
        {/* Close */}
        <div className="preview-header">
          <button
            className="preview-close-btn"
            onClick={onClose}
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Meta info */}
        <div className="preview-meta">
          <div className="preview-meta-row">
            <span className="label">{t("created_by")}:</span>
            <span className="value">{note.createdBy}</span>
          </div>

          <div className="preview-meta-row">
            <span className="label">{t("role")}:</span>
            <span className="value">{note.role}</span>
          </div>

          <div className="preview-meta-row">
            <span className="label">{t("class")}:</span>
            <span className="value">{note.className || "—"}</span>
          </div>

          <div className="preview-meta-row">
            <span className="label">{t("date")}:</span>
            <span className="value">{note.date}</span>
          </div>
        </div>

        {/* Note Body */}
        <div className="preview-body">
          <label className="notes-label">{t("notes")}</label>

          <div className="notes-box">
            {note.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotePreviewPanel;
