import React from 'react';
import { t } from 'i18next';

type FcInteractCameraModalProps = {
  media: any;
};

export default function FcInteractCameraModal({
  media,
}: FcInteractCameraModalProps) {
  if (!media.isCameraOpen) return null;

  return (
    <div
      className="fc-interact-popup-camera-overlay"
      id="fc-camera-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div className="fc-interact-popup-camera-modal" id="fc-camera-modal">
        <div className="fc-interact-popup-camera-header" id="fc-camera-header">
          <div className="fc-interact-popup-camera-title" id="fc-camera-title">
            {t('Capture') || 'Capture'}
          </div>
          <button
            type="button"
            className="fc-interact-popup-camera-close"
            aria-label={t('Close') || 'Close'}
            onClick={media.cancelCamera}
          >
            ×
          </button>
        </div>

        {media.cameraError && (
          <div className="fc-interact-popup-camera-error" id="fc-camera-error">
            {media.cameraError}
          </div>
        )}

        {media.cameraUiMode === 'desktop' && media.cameraStream && (
          <>
            <div
              className="fc-interact-popup-camera-preview"
              id="fc-camera-preview"
            >
              <video
                ref={media.videoRef}
                className="fc-interact-popup-camera-video"
                id="fc-camera-video"
                autoPlay
                playsInline
                muted
              />
              {media.isRecording && media.recordingSecondsLeft !== null && (
                <div
                  className="fc-interact-popup-camera-timer"
                  id="fc-camera-timer"
                  aria-live="polite"
                >
                  {media.recordingSecondsLeft}
                </div>
              )}
            </div>
            <canvas
              ref={media.canvasRef}
              id="fc-camera-canvas"
              style={{ display: 'none' }}
            />
          </>
        )}

        {media.cameraUiMode === 'mobile' && (
          <div className="fc-interact-popup-camera-hint" id="fc-camera-hint">
            {/* {t("Camera permission is required to use the in-app camera.") ||
              "Camera permission is required to use the in-app camera."} */}
          </div>
        )}

        <div
          className="fc-interact-popup-camera-actions"
          id="fc-camera-actions"
        >
          {media.cameraStream && (
            <button
              type="button"
              id="fc-camera-shutter"
              className={`fc-interact-popup-camera-shutter ${
                media.isRecording
                  ? 'fc-interact-popup-camera-shutter-recording'
                  : ''
              }`}
              aria-label={t('Shutter') || 'Shutter'}
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
                className="fc-interact-popup-camera-shutter-inner"
                id="fc-camera-shutter-inner"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
