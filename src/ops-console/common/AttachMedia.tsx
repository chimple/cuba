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
  uploadButtonClassName: string;
  uploadButtonId: string;

  iconClassName: string;

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
    sectionClassName: "fc-interact-popup-section fc-interact-popup-attach-section",
    sectionId: "fc-attach-section",

    labelClassName: "fc-interact-popup-label",
    labelId: "fc-attach-label",

    buttonsClassName: "fc-interact-popup-attach-buttons",
    buttonsId: "fc-attach-buttons",

    captureButtonClassName: "fc-interact-popup-attach-btn",
    captureButtonId: "fc-attach-capture",
    uploadButtonClassName: "fc-interact-popup-attach-btn",
    uploadButtonId: "fc-attach-upload",

    iconClassName: "fc-interact-popup-attach-icon",

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
    uploadButtonClassName: "add-note-modal-attach-btn",
    uploadButtonId: "add-note-modal-attach-upload",

    iconClassName: "add-note-modal-attach-icon",

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
          <PhotoCameraOutlined className={cfg.iconClassName} />
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
          <FileUploadOutlined className={cfg.iconClassName} />
          {t("Upload")}
        </button>
      </div>

      {media.mediaError && (
        <div className={errorClassName} role="alert">
          {media.mediaError}
        </div>
      )}

      <input
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
                <div className={cfg.mediaPreviewClassName}>
                  {m.mediaType === "image" ? (
                    <img
                      className={cfg.mediaThumbClassName}
                      src={m.previewUrl}
                      alt={m.file.name}
                    />
                  ) : (
                    <video
                      className={cfg.mediaThumbClassName}
                      src={m.previewUrl}
                      controls
                      preload="metadata"
                    />
                  )}
                </div>
              )}
              <div className={cfg.mediaTopRowClassName}>
                <div className={cfg.mediaNameClassName} title={m.file.name}>
                  {m.file.name}
                </div>
                <button
                  type="button"
                  className={cfg.mediaRemoveClassName}
                  aria-label={t("Remove") || "Remove"}
                  onClick={() => media.removeMedia(m.id)}
                  disabled={disabled}
                >
                  x
                </button>
              </div>
              <div className={cfg.mediaProgressClassName}>
                <div
                  className={cfg.mediaProgressBarClassName}
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

