import React from "react";
import { FileUploadOutlined, PhotoCameraOutlined } from "@mui/icons-material";
import type { UseMediaActionsResult } from "./mediaactions";

type AttachMediaVariant = "fc-interact" | "add-note-modal";

type VariantConfig = {
  sectionClassName: string;
  sectionId: string;

  labelClassName: string;
  labelId: string;

  buttonsClassName: string;
  buttonsId: string;

  captureButtonClassName: string;
  captureButtonId: string;
  captureButtonIconId: string;

  uploadButtonClassName: string;
  uploadButtonId: string;
  uploadButtonIconId: string;

  iconClassName: string;

  errorId: string;

  captureAnyInputId: string;
  captureImageInputId: string;
  captureVideoInputId: string;
  uploadInputId: string;

  mediaListClassName: string;
  mediaListId: string;
  mediaItemClassName: string;
  mediaItemIdPrefix: string;

  mediaPreviewClassName: string;
  mediaThumbClassName: string;
  mediaTopRowClassName: string;
  mediaNameClassName: string;
  mediaRemoveClassName: string;
  mediaProgressClassName: string;
  mediaProgressBarClassName: string;
};

const variantConfig: Record<AttachMediaVariant, VariantConfig> = {
  "fc-interact": {
    sectionClassName:
      "fc-interact-popup-section fc-interact-popup-attach-section",
    sectionId: "fc-attach-section",

    labelClassName: "fc-interact-popup-label",
    labelId: "fc-attach-label",

    buttonsClassName: "fc-interact-popup-attach-buttons",
    buttonsId: "fc-attach-buttons",

    captureButtonClassName: "fc-interact-popup-attach-btn",
    captureButtonId: "fc-attach-capture",
    captureButtonIconId: "fc-attach-capture-icon",
    uploadButtonClassName: "fc-interact-popup-attach-btn",
    uploadButtonId: "fc-attach-upload",
    uploadButtonIconId: "fc-attach-upload-icon",

    iconClassName: "fc-interact-popup-attach-icon",

    errorId: "fc-attach-error",

    captureAnyInputId: "fc-attach-capture-any-input",
    captureImageInputId: "fc-attach-capture-image-input",
    captureVideoInputId: "fc-attach-capture-video-input",
    uploadInputId: "fc-attach-upload-input",

    mediaListClassName: "fc-interact-popup-media-list",
    mediaListId: "fc-media-list",
    mediaItemClassName: "fc-interact-popup-media-item",
    mediaItemIdPrefix: "fc-media-",

    mediaPreviewClassName: "fc-interact-popup-media-preview",
    mediaThumbClassName: "fc-interact-popup-media-thumb",
    mediaTopRowClassName: "fc-interact-popup-media-top-row",
    mediaNameClassName: "fc-interact-popup-media-name",
    mediaRemoveClassName: "fc-interact-popup-media-remove",
    mediaProgressClassName: "fc-interact-popup-media-progress",
    mediaProgressBarClassName: "fc-interact-popup-media-progress-bar",
  },
  "add-note-modal": {
    sectionClassName: "add-note-modal-attach-section",
    sectionId: "add-note-modal-attach-section",

    labelClassName: "add-note-modal-attach-label",
    labelId: "add-note-modal-attach-label",

    buttonsClassName: "add-note-modal-attach-buttons",
    buttonsId: "add-note-modal-attach-buttons",

    captureButtonClassName: "add-note-modal-attach-btn",
    captureButtonId: "add-note-modal-attach-capture",
    captureButtonIconId: "add-note-modal-attach-capture-icon",
    uploadButtonClassName: "add-note-modal-attach-btn",
    uploadButtonId: "add-note-modal-attach-upload",
    uploadButtonIconId: "add-note-modal-attach-upload-icon",

    iconClassName: "add-note-modal-attach-icon",

    errorId: "add-note-modal-attach-error",

    captureAnyInputId: "add-note-modal-capture-any-input",
    captureImageInputId: "add-note-modal-capture-image-input",
    captureVideoInputId: "add-note-modal-capture-video-input",
    uploadInputId: "add-note-modal-upload-input",

    mediaListClassName: "add-note-modal-media-list",
    mediaListId: "add-note-modal-media-list",
    mediaItemClassName: "add-note-modal-media-item",
    mediaItemIdPrefix: "add-note-modal-media-",

    mediaPreviewClassName: "add-note-modal-media-preview",
    mediaThumbClassName: "add-note-modal-media-thumb",
    mediaTopRowClassName: "add-note-modal-media-top-row",
    mediaNameClassName: "add-note-modal-media-name",
    mediaRemoveClassName: "add-note-modal-media-remove",
    mediaProgressClassName: "add-note-modal-media-progress",
    mediaProgressBarClassName: "add-note-modal-media-progress-bar",
  },
};

export type AttachMediaProps = {
  variant: AttachMediaVariant;
  t: (key: string) => string;
  media: UseMediaActionsResult;
  disabled?: boolean;
};

export default function AttachMedia({
  variant,
  t,
  media,
  disabled = false,
}: AttachMediaProps) {
  const cfg = variantConfig[variant];
  const errorClassName =
    variant === "fc-interact"
      ? "fc-interact-popup-media-error"
      : "add-note-modal-error";

  return (
    <div className={cfg.sectionClassName} id={cfg.sectionId}>
      <div className={cfg.labelClassName} id={cfg.labelId}>
        {t("Attach Media")}
      </div>

      <div className={cfg.buttonsClassName} id={cfg.buttonsId}>
        <button
          type="button"
          className={cfg.captureButtonClassName}
          id={cfg.captureButtonId}
          onClick={() => {
            media.clearMediaError();
            media.openCapture();
          }}
          disabled={disabled}
        >
          <PhotoCameraOutlined
            className={cfg.iconClassName}
            id={cfg.captureButtonIconId}
          />
          {t("Capture")}
        </button>

        <button
          type="button"
          className={cfg.uploadButtonClassName}
          id={cfg.uploadButtonId}
          onClick={() => {
            media.clearMediaError();
            media.uploadInputRef.current?.click();
          }}
          disabled={disabled}
        >
          <FileUploadOutlined
            className={cfg.iconClassName}
            id={cfg.uploadButtonIconId}
          />
          {t("Upload")}
        </button>
      </div>

      {media.mediaError && (
        <div className={errorClassName} role="alert" id={cfg.errorId}>
          {media.mediaError}
        </div>
      )}

      <input
        id={cfg.captureAnyInputId}
        ref={media.captureAnyInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      <input
        id={cfg.captureImageInputId}
        ref={media.captureImageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = "";
          media.closeCamera();
        }}
      />

      <input
        id={cfg.captureVideoInputId}
        ref={media.captureVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = "";
          media.closeCamera();
        }}
      />

      <input
        id={cfg.uploadInputId}
        ref={media.uploadInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {media.mediaUploads.length > 0 && (
        <div className={cfg.mediaListClassName} id={cfg.mediaListId}>
          {media.mediaUploads.map((m) => (
            <div
              key={m.id}
              className={cfg.mediaItemClassName}
              id={`${cfg.mediaItemIdPrefix}${m.id}`}
            >
              {m.mediaType !== "file" && (
                <div
                  className={cfg.mediaPreviewClassName}
                  id={`${cfg.mediaItemIdPrefix}${m.id}-preview`}
                >
                  {m.mediaType === "image" ? (
                    <img
                      id={`${cfg.mediaItemIdPrefix}${m.id}-thumb`}
                      className={cfg.mediaThumbClassName}
                      src={m.previewUrl}
                      alt={m.file.name}
                    />
                  ) : (
                    <video
                      id={`${cfg.mediaItemIdPrefix}${m.id}-video`}
                      className={cfg.mediaThumbClassName}
                      src={m.previewUrl}
                      controls
                      preload="metadata"
                    />
                  )}
                </div>
              )}
              <div
                className={cfg.mediaTopRowClassName}
                id={`${cfg.mediaItemIdPrefix}${m.id}-top-row`}
              >
                <div
                  className={cfg.mediaNameClassName}
                  id={`${cfg.mediaItemIdPrefix}${m.id}-name`}
                  title={m.file.name}
                >
                  {m.file.name}
                </div>
                <button
                  type="button"
                  className={cfg.mediaRemoveClassName}
                  id={`${cfg.mediaItemIdPrefix}${m.id}-remove`}
                  aria-label={t("Remove") || "Remove"}
                  onClick={() => media.removeMedia(m.id)}
                  disabled={disabled}
                >
                  x
                </button>
              </div>
              <div
                className={cfg.mediaProgressClassName}
                id={`${cfg.mediaItemIdPrefix}${m.id}-progress`}
              >
                <div
                  className={cfg.mediaProgressBarClassName}
                  id={`${cfg.mediaItemIdPrefix}${m.id}-progress-bar`}
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
