// AddNoteModal.tsx
import React, { useState } from "react";
import { t } from "i18next";
import "./SchoolDetailsTabs.css"; // reuse styling

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { text: string }) => void;
  source: "school" | "class"; // identifies where modal is used
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
      setError(t("please_enter_note")as any);
      return;
    }
    setError("");

    // Return only UI mock data → parent will construct full note object
    onSave({ text });
    setText("");
  };

  const handleCancel = () => {
    setText("");
    setError("");
    onClose();
  };

  return (
    <div className="note-modal-overlay">
      <div className="note-modal">
        {/* Header */}
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            {source === "school" ? t("Add school note") : t("Add class note")}
          </h3>

          <button
            onClick={handleCancel}
            className="modal-close-button"
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Text Field */}  
        <textarea
          className="note-textarea"
          placeholder={t("Type your note here") as any}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #d6d6d6",
            marginTop: 14,
            fontSize: 14,
            resize: "vertical",
          }}
        />

        {error && (
          <p style={{ color: "red", marginTop: 6, marginBottom: 0 }}>{error}</p>
        )}

        {/* Buttons */}
        <div
          className="modal-actions"
          style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 12 }}
        >
          <button
            className="btn-outline"
            onClick={handleCancel}
            style={{ padding: "8px 14px", borderRadius: 6 }}
          >
            {t("cancel")}
          </button>

          <button
            className="btn-primary"
            onClick={handleSave}
            style={{
              padding: "8px 18px",
              background: "#4f46e5",
              color: "white",
              borderRadius: 6,
            }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
