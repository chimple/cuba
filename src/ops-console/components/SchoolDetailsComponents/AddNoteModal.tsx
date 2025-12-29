// AddNoteModal.tsx
import React, { useEffect, useState } from "react";
import { t } from "i18next";
import "./AddNoteModal.css";
import { useMediaActions } from "../../common/mediaactions";
import { ServiceConfig } from "../../../services/ServiceConfig";
import AttachMedia from "../../common/AttachMedia";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    text: string;
    mediaLinks?: string[] | null;
  }) => void | Promise<void>;
  source: "school" | "class";
  schoolId?: string;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  source,
  schoolId,
}) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const translate = (key: string) => t(key).toString();
  const media = useMediaActions({ t: translate, schoolId });
  const hasProcessingMedia = media.mediaUploads.some(
    (m) => m.status !== "done"
  );

  useEffect(() => {
    if (isOpen) return;
    setText("");
    setError("");
    setIsSaving(false);
    media.resetMedia();
    media.cancelCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isSaving) return;
    if (!text.trim()) {
      setError(t("please_enter_note").toString());
      return;
    }
    if (media.mediaUploads.length > 0 && hasProcessingMedia) {
      setError(t("Please wait for media processing to finish.").toString());
      return;
    }

    if (!schoolId && media.mediaUploads.length > 0) {
      setError(t("School ID is required to upload media.").toString());
      return;
    }

    setIsSaving(true);
    setError("");
    onClose();

    try {
      const api = ServiceConfig.getI().apiHandler;
      const mediaLinks =
        schoolId && media.mediaUploads.length > 0
          ? await media.uploadAllMedia((file) =>
              api.uploadSchoolVisitMediaFile({ schoolId, file })
            )
          : [];

      await onSave({
        text: text.trim(),
        mediaLinks: mediaLinks.length > 0 ? mediaLinks : null,
      });
    } catch (err) {
      console.error("Failed to save note:", err);
      setError(t("Failed to save note. Please try again.").toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    setText("");
    setError("");
    media.resetMedia();
    media.cancelCamera();
    onClose();
  };

  return (
    <div className="add-note-modal-overlay" id="add-note-modal-overlay">
      <div className="add-note-modal-container" id="add-note-modal-container">
        {/* Header */}
        <div className="add-note-modal-header" id="add-note-modal-header">
          <h3 className="add-note-modal-title" id="add-note-modal-title">
            {source === "school" ? t("Add School Note") : t("Add Class Note")}
          </h3>

          <button
            className="add-note-modal-close"
            id="add-note-modal-close"
            onClick={handleCancel}
            aria-label="close"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        {/* Textarea */}
        <textarea
          className="add-note-modal-textarea"
          id="add-note-modal-textarea"
          placeholder={t("Type your note here...").toString()}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError("");
          }}

          rows={6}
        />

        {error && (
          <p className="add-note-modal-error" id="add-note-modal-error">
            {error}
          </p>
        )}

        <AttachMedia
          variant="add-note-modal"
          t={translate}
          media={media}
          disabled={isSaving}
        />
        {/* Actions */}
        <div className="add-note-modal-actions" id="add-note-modal-actions">
          <button
            className="add-note-modal-btn-outline"
            id="add-note-modal-cancel-btn"
            onClick={handleCancel}
            disabled={isSaving}
          >
            {t("Cancel")}
          </button>

          <button
            className="add-note-modal-btn-primary"
            id="add-note-modal-save-btn"
            onClick={handleSave}
            disabled={
              isSaving || (media.mediaUploads.length > 0 && hasProcessingMedia)
            }
          >
            {isSaving ? t("Saving...") : t("Save")}
          </button>
        </div>
      </div>

      {media.isCameraOpen && (
        <div
          className="add-note-modal-camera-overlay"
          id="add-note-modal-camera-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="add-note-modal-camera-modal"
            id="add-note-modal-camera-modal"
          >
            <div
              className="add-note-modal-camera-header"
              id="add-note-modal-camera-header"
            >
              <div
                className="add-note-modal-camera-title"
                id="add-note-modal-camera-title"
              >
                {t("Capture") || "Capture"}
              </div>
              <button
                type="button"
                className="add-note-modal-camera-close"
                id="add-note-modal-camera-close"
                aria-label={t("Close") || "Close"}
                onClick={media.cancelCamera}
              >
                ×
              </button>
            </div>

            {media.cameraError && (
              <div
                className="add-note-modal-camera-error"
                id="add-note-modal-camera-error"
              >
                {media.cameraError}
              </div>
            )}

            {media.cameraUiMode === "desktop" && media.cameraStream && (
              <>
                <div
                  className="add-note-modal-camera-preview"
                  id="add-note-modal-camera-preview"
                >
                  <video
                    ref={media.videoRef}
                    className="add-note-modal-camera-video"
                    id="add-note-modal-camera-video"
                    autoPlay
                    playsInline
                    muted
                  />
                  {media.isRecording && media.recordingSecondsLeft !== null && (
                    <div
                      className="add-note-modal-camera-timer"
                      id="add-note-modal-camera-timer"
                      aria-live="polite"
                    >
                      {media.recordingSecondsLeft}
                    </div>
                  )}
                </div>
                <canvas
                  ref={media.canvasRef}
                  id="add-note-modal-camera-canvas"
                  style={{ display: "none" }}
                />
              </>
            )}

            {media.cameraUiMode === "mobile" && (
              <div
                className="add-note-modal-camera-hint"
                id="add-note-modal-camera-hint"
              >
                {/* {t("Camera permission is required to use the in-app camera.") ||
                  "Camera permission is required to use the in-app camera."} */}
              </div>
            )}

            <div
              className="add-note-modal-camera-actions"
              id="add-note-modal-camera-actions"
            >
              {media.cameraStream && (
                <button
                  type="button"
                  id="add-note-modal-camera-shutter"
                  className={`add-note-modal-camera-shutter ${
                    media.isRecording
                      ? "add-note-modal-camera-shutter-recording"
                      : ""
                  }`}
                  aria-label={t("Shutter") || "Shutter"}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    media.shutterPressStart();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    media.shutterPressEnd();
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    media.shutterPressCancel();
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span
                    className="add-note-modal-camera-shutter-inner"
                    id="add-note-modal-camera-shutter-inner"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNoteModal;
