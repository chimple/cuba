export type AttachMediaVariant = 'fc-interact' | 'add-note-modal';

export type VariantConfig = {
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

export const variantConfig: Record<AttachMediaVariant, VariantConfig> = {
  'fc-interact': {
    sectionClassName:
      'fc-interact-popup-section fc-interact-popup-attach-section',
    sectionId: 'fc-attach-section',
    labelClassName: 'fc-interact-popup-label',
    labelId: 'fc-attach-label',
    buttonsClassName: 'fc-interact-popup-attach-buttons',
    buttonsId: 'fc-attach-buttons',
    captureButtonClassName: 'fc-interact-popup-attach-btn',
    captureButtonId: 'fc-attach-capture',
    captureButtonIconId: 'fc-attach-capture-icon',
    uploadButtonClassName: 'fc-interact-popup-attach-btn',
    uploadButtonId: 'fc-attach-upload',
    uploadButtonIconId: 'fc-attach-upload-icon',
    iconClassName: 'fc-interact-popup-attach-icon',
    errorId: 'fc-attach-error',
    captureAnyInputId: 'fc-attach-capture-any-input',
    captureImageInputId: 'fc-attach-capture-image-input',
    captureVideoInputId: 'fc-attach-capture-video-input',
    uploadInputId: 'fc-attach-upload-input',
    mediaListClassName: 'fc-interact-popup-media-list',
    mediaListId: 'fc-media-list',
    mediaItemClassName: 'fc-interact-popup-media-item',
    mediaItemIdPrefix: 'fc-media-',
    mediaPreviewClassName: 'fc-interact-popup-media-preview',
    mediaThumbClassName: 'fc-interact-popup-media-thumb',
    mediaTopRowClassName: 'fc-interact-popup-media-top-row',
    mediaNameClassName: 'fc-interact-popup-media-name',
    mediaRemoveClassName: 'fc-interact-popup-media-remove',
    mediaProgressClassName: 'fc-interact-popup-media-progress',
    mediaProgressBarClassName: 'fc-interact-popup-media-progress-bar',
  },
  'add-note-modal': {
    sectionClassName: 'add-note-modal-attach-section',
    sectionId: 'add-note-modal-attach-section',
    labelClassName: 'add-note-modal-attach-label',
    labelId: 'add-note-modal-attach-label',
    buttonsClassName: 'add-note-modal-attach-buttons',
    buttonsId: 'add-note-modal-attach-buttons',
    captureButtonClassName: 'add-note-modal-attach-btn',
    captureButtonId: 'add-note-modal-attach-capture',
    captureButtonIconId: 'add-note-modal-attach-capture-icon',
    uploadButtonClassName: 'add-note-modal-attach-btn',
    uploadButtonId: 'add-note-modal-attach-upload',
    uploadButtonIconId: 'add-note-modal-attach-upload-icon',
    iconClassName: 'add-note-modal-attach-icon',
    errorId: 'add-note-modal-attach-error',
    captureAnyInputId: 'add-note-modal-capture-any-input',
    captureImageInputId: 'add-note-modal-capture-image-input',
    captureVideoInputId: 'add-note-modal-capture-video-input',
    uploadInputId: 'add-note-modal-upload-input',
    mediaListClassName: 'add-note-modal-media-list',
    mediaListId: 'add-note-modal-media-list',
    mediaItemClassName: 'add-note-modal-media-item',
    mediaItemIdPrefix: 'add-note-modal-media-',
    mediaPreviewClassName: 'add-note-modal-media-preview',
    mediaThumbClassName: 'add-note-modal-media-thumb',
    mediaTopRowClassName: 'add-note-modal-media-top-row',
    mediaNameClassName: 'add-note-modal-media-name',
    mediaRemoveClassName: 'add-note-modal-media-remove',
    mediaProgressClassName: 'add-note-modal-media-progress',
    mediaProgressBarClassName: 'add-note-modal-media-progress-bar',
  },
};
