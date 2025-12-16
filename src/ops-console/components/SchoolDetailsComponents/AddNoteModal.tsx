// AddNoteModal.tsx
import React, { useState } from "react";
import { t } from "i18next";
import "./AddNoteModal.css";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { text: string }) => void;
  source: "school" | "class";
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  source,
}) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!text.trim()) {
      setError(t("please_enter_note") as any);
      return;
    }
    setError("");
    onSave({ text });
    setText("");
  };

  const handleCancel = () => {
    setText("");
    setError("");
    onClose();
  };

  return (
    <div className="add-note-modal-overlay">
      <div className="add-note-modal-container">
        {/* Header */}
        <div className="add-note-modal-header">
          <h3 className="add-note-modal-title">
            {source === "school"
              ? t("Add School Note")
              : t("Add Class Note")}
          </h3>

          <button
            className="add-note-modal-close"
            onClick={handleCancel}
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Textarea */}
        <textarea
          className="add-note-modal-textarea"
          placeholder={t("Type your note here") as any}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />

        {error && (
          <p className="add-note-modal-error">{error}</p>
        )}

        {/* Actions */}
        <div className="add-note-modal-actions">
          <button
            className="add-note-modal-btn-outline"
            onClick={handleCancel}
          >
            {t("Cancel")}
          </button>

          <button
            className="add-note-modal-btn-primary"
            onClick={handleSave}
          >
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
