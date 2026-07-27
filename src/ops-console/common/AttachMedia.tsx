import React from 'react';
import { FileUploadOutlined, PhotoCameraOutlined } from '@mui/icons-material';
import type { UseMediaActionsResult } from './mediaactions';
import { AttachMediaVariant, variantConfig } from './AttachMedia.config';

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
    variant === 'fc-interact'
      ? 'fc-interact-popup-media-error'
      : 'add-note-modal-error';

  return (
    <div className={cfg.sectionClassName} id={cfg.sectionId}>
      <div className={cfg.labelClassName} id={cfg.labelId}>
        {t('Attach Media')}
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
          {t('Capture')}
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
          {t('Upload')}
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
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = '';
        }}
      />

      <input
        id={cfg.captureImageInputId}
        ref={media.captureImageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = '';
          media.closeCamera();
        }}
      />

      <input
        id={cfg.captureVideoInputId}
        ref={media.captureVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = '';
          media.closeCamera();
        }}
      />

      <input
        id={cfg.uploadInputId}
        ref={media.uploadInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => {
          media.clearMediaError();
          media.addMediaFiles(e.target.files);
          e.currentTarget.value = '';
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
              {m.mediaType !== 'file' && (
                <div
                  className={cfg.mediaPreviewClassName}
                  id={`${cfg.mediaItemIdPrefix}${m.id}-preview`}
                >
                  {m.mediaType === 'image' ? (
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
                  aria-label={t('Remove') || 'Remove'}
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
