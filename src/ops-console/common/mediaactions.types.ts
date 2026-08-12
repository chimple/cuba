import type { RefObject } from 'react';

export type MediaUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: 'image' | 'video' | 'file';
  progress: number;
  status: 'compressing' | 'uploading' | 'done';
  uploadedUrl?: string | null;
};

export type CameraUiMode = 'desktop' | 'mobile';

export type UseMediaActionsOptions = {
  t?: (key: string) => string;
  schoolId?: string;
};

export type UseMediaActionsResult = {
  mediaUploads: MediaUploadItem[];
  mediaError: string | null;
  clearMediaError: () => void;
  addMediaFiles: (files: FileList | null) => void;
  removeMedia: (id: string) => void;
  resetMedia: () => void;
  uploadAllMedia: (
    uploadFn: (file: File) => Promise<string>,
  ) => Promise<string[]>;

  captureAnyInputRef: RefObject<HTMLInputElement | null>;
  captureImageInputRef: RefObject<HTMLInputElement | null>;
  captureVideoInputRef: RefObject<HTMLInputElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;

  isCameraOpen: boolean;
  cameraError: string | null;
  cameraUiMode: CameraUiMode;
  cameraStream: MediaStream | null;
  isRecording: boolean;
  recordingSecondsLeft: number | null;

  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;

  openCapture: () => void;
  openCamera: () => Promise<void>;
  closeCamera: () => void;
  cancelCamera: () => void;
  takePhoto: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;

  shutterPressStart: () => void;
  shutterPressEnd: () => void;
  shutterPressCancel: () => void;
};
