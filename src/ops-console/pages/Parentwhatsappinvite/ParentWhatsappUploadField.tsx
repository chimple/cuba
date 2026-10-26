import {
  CloseRounded,
  CloudUploadOutlined,
  InsertDriveFileOutlined,
} from '@mui/icons-material';
import { Button } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import {
  formatFileSize,
  useParentWhatsappInvitationPageLogic,
} from './ParentWhatsappInvitationPageLogic';
import { FieldBlock } from './ParentWhatsappInvitationShared';

type ParentWhatsappPageLogic = ReturnType<
  typeof useParentWhatsappInvitationPageLogic
>;

export default function ParentWhatsappUploadField({
  logic,
}: {
  logic: ParentWhatsappPageLogic;
}) {
  const {
    uploadInputRef,
    isDraggingFile,
    setIsDraggingFile,
    uploadedMedia,
    setUploadedMedia,
    handleFileSelect,
  } = logic;
  const uploadZoneClassName = `parent-whatsapp-page-upload-zone${isDraggingFile ? ' parent-whatsapp-page-upload-zone--dragging' : ''}`;

  return (
    <FieldBlock
      label={t(
        'Upload Image (<=5MB) or Video (<=16MB) (optional, must match template header type)',
      )}
    >
      <div
        id={uploadZoneClassName}
        className={uploadZoneClassName}
        role="button"
        tabIndex={0}
        onClick={() => uploadInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            uploadInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingFile(false);
          handleFileSelect(event.dataTransfer.files);
        }}
      >
        <div
          id="parent-whatsapp-page-upload-copy"
          className="parent-whatsapp-page-upload-copy"
        >
          <CloudUploadOutlined
            id="parent-whatsapp-page-upload-icon"
            className="parent-whatsapp-page-upload-icon"
          />
          <div>
            <div
              id="parent-whatsapp-page-upload-title"
              className="parent-whatsapp-page-upload-title"
            >
              {t('Drag and drop file here')}
            </div>
            <div
              id="parent-whatsapp-page-upload-caption"
              className="parent-whatsapp-page-upload-caption"
            >
              {t('Limit 200MB per file | PNG, JPEG, MP4, 3GP, JPG, MPEG4')}
            </div>
          </div>
        </div>
        <Button
          variant="outlined"
          id="parent-whatsapp-page-browse-button"
          className="parent-whatsapp-page-browse-button"
          onClick={(event) => {
            event.stopPropagation();
            uploadInputRef.current?.click();
          }}
        >
          {t('Browse files')}
        </Button>
        <input
          ref={uploadInputRef}
          hidden
          type="file"
          accept=".png,.jpeg,.jpg,.mp4,.3gp"
          onChange={(event) => handleFileSelect(event.target.files)}
        />
      </div>
      {uploadedMedia ? (
        <div
          id="parent-whatsapp-page-upload-file"
          className="parent-whatsapp-page-upload-file"
        >
          <div
            id="parent-whatsapp-page-upload-file-info"
            className="parent-whatsapp-page-upload-file-info"
          >
            <InsertDriveFileOutlined
              id="parent-whatsapp-page-upload-file-icon"
              className="parent-whatsapp-page-upload-file-icon"
            />
            <div
              id="parent-whatsapp-page-upload-file-copy"
              className="parent-whatsapp-page-upload-file-copy"
            >
              <div
                id="parent-whatsapp-page-upload-file-name"
                className="parent-whatsapp-page-upload-file-name"
              >
                {uploadedMedia.name}
              </div>
              <div
                id="parent-whatsapp-page-upload-file-size"
                className="parent-whatsapp-page-upload-file-size"
              >
                {formatFileSize(uploadedMedia.size)}
              </div>
            </div>
          </div>
          <button
            type="button"
            id="parent-whatsapp-page-upload-file-remove"
            className="parent-whatsapp-page-upload-file-remove"
            onClick={() => setUploadedMedia(null)}
            aria-label={String(t('Remove uploaded file'))}
          >
            <CloseRounded fontSize="small" />
          </button>
        </div>
      ) : null}
    </FieldBlock>
  );
}
