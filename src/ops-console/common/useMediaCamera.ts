import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import logger from '../../utility/logger';
import type { CameraUiMode } from './mediaactions.types';

type UseMediaCameraOptions = {
  translate: (key: string) => string;
  addMediaFile: (file: File) => void;
  captureAnyInputRef: RefObject<HTMLInputElement | null>;
  captureImageInputRef: RefObject<HTMLInputElement | null>;
  captureVideoInputRef: RefObject<HTMLInputElement | null>;
};

export function useMediaCamera({
  translate,
  addMediaFile,
  captureAnyInputRef,
  captureImageInputRef,
  captureVideoInputRef,
}: UseMediaCameraOptions) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraUiMode, setCameraUiMode] = useState<CameraUiMode>('desktop');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<
    number | null
  >(null);
  const recordingTimerRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const discardRecordingRef = useRef(false);
  const shutterTimerRef = useRef<number | null>(null);
  const shutterStartedRecordingRef = useRef(false);
  const hasAutoStoppedRef = useRef(false);

  const stopRecordingTimer = (opts: { updateState?: boolean } = {}) => {
    const updateState = opts.updateState ?? true;
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (updateState) setRecordingSecondsLeft(null);
    hasAutoStoppedRef.current = false;
  };

  const closeCamera = () => {
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (recorder.state !== 'inactive') {
          discardRecordingRef.current = true;
          recorder.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    recordedChunksRef.current = [];
    setIsRecording(false);

    if (cameraStream) {
      for (const track of cameraStream.getTracks()) track.stop();
    }
    setCameraStream(null);
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const cancelCamera = () => {
    discardRecordingRef.current = true;
    closeCamera();
  };

  const openCamera = async () => {
    discardRecordingRef.current = false;
    const ua = (navigator.userAgent ?? '').toLowerCase();
    const isLikelyMobile =
      /android|iphone|ipad|ipod|mobi/.test(ua) || navigator.maxTouchPoints > 1;

    setCameraError(null);
    setCameraUiMode(isLikelyMobile ? 'mobile' : 'desktop');
    setIsCameraOpen(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraUiMode('mobile');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraUiMode('desktop');
      setCameraStream(stream);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCameraUiMode('desktop');
        setCameraStream(stream);
      } catch (err2) {
        logger.error('Failed to access camera:', err2);
        setCameraError(
          translate(
            'Camera access was blocked. Please allow permission or upload media.',
          ),
        );
        setCameraUiMode('mobile');
      }
    }
  };

  const openCapture = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      captureAnyInputRef.current?.click();
      return;
    }
    void openCamera();
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
    if (!blob) {
      closeCamera();
      captureImageInputRef.current?.click();
      return;
    }

    const safeTs = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([blob], `capture-${safeTs}.jpg`, { type: blob.type });
    addMediaFile(file);
    closeCamera();
  };

  const startRecording = () => {
    if (!cameraStream) {
      closeCamera();
      captureVideoInputRef.current?.click();
      return;
    }
    discardRecordingRef.current = false;

    if (!(window as any).MediaRecorder) {
      closeCamera();
      captureVideoInputRef.current?.click();
      return;
    }

    const preferredTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const supportedType =
      preferredTypes.find((mt) =>
        (window as any).MediaRecorder?.isTypeSupported?.(mt),
      ) ?? '';

    try {
      recordedChunksRef.current = [];
      const recordingOptions: MediaRecorderOptions = supportedType
        ? { mimeType: supportedType }
        : {};

      // Try to keep recorded videos reasonably small; browsers may ignore these values.
      // 1.6 Mbps tends to be acceptable quality while reducing size on mobile.
      (recordingOptions as any).videoBitsPerSecond = 1_600_000;
      const recorder = new MediaRecorder(
        cameraStream,
        Object.keys(recordingOptions).length > 0 ? recordingOptions : undefined,
      );
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'video/webm',
        });
        recordedChunksRef.current = [];
        const shouldDiscard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        if (!shouldDiscard && blob.size > 0) {
          const safeTs = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `capture-${safeTs}.webm`, {
            type: blob.type,
          });
          addMediaFile(file);
        }
        setIsRecording(false);
        stopRecordingTimer();
        closeCamera();
      };
      mediaRecorderRef.current = recorder;
      // Avoid timeslices so very short recordings still produce a blob on stop.
      recorder.start();
      setIsRecording(true);

      stopRecordingTimer();
      setRecordingSecondsLeft(30);
      hasAutoStoppedRef.current = false;
      recordingTimerRef.current = window.setInterval(() => {
        let shouldAutoStop = false;
        setRecordingSecondsLeft((prev) => {
          if (prev === null) return prev;
          const next = prev - 1;
          if (next <= 0) {
            shouldAutoStop = true;
            return 0;
          }
          return next;
        });

        if (shouldAutoStop && !hasAutoStoppedRef.current) {
          hasAutoStoppedRef.current = true;
          try {
            stopRecording();
          } catch {
            // ignore
          }
        }
      }, 1000);
    } catch (e) {
      logger.error('Failed to start recording:', e);
      closeCamera();
      captureVideoInputRef.current?.click();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'inactive') return;
    try {
      stopRecordingTimer();
      try {
        recorder.requestData?.();
      } catch {
        // ignore
      }
      recorder.stop();
    } catch (e) {
      logger.error('Failed to stop recording:', e);
      setIsRecording(false);
    }
  };

  const shutterPressStart = () => {
    if (!cameraStream) return;
    // While recording, a single tap stops & saves (no need to keep holding).
    if (isRecording) {
      stopRecording();
      return;
    }
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    shutterTimerRef.current = window.setTimeout(() => {
      shutterTimerRef.current = null;
      shutterStartedRecordingRef.current = true;
      startRecording();
    }, 350);
  };

  const shutterPressEnd = () => {
    // If the user released before long-press threshold, take a photo.
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
      void takePhoto();
      return;
    }

    // If recording started, releasing should NOT stop it; timer (or a later tap) will.
    if (shutterStartedRecordingRef.current) {
      shutterStartedRecordingRef.current = false;
      return;
    }
  };

  const shutterPressCancel = () => {
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
      shutterTimerRef.current = null;
    }
    shutterStartedRecordingRef.current = false;
    if (isRecording) {
      discardRecordingRef.current = true;
      stopRecording();
    } else {
      cancelCamera();
    }
  };

  useEffect(() => {
    if (!isCameraOpen || !cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    // Some browsers (esp. desktop Safari) won't start playback without an explicit play().
    // Muted + playsInline makes autoplay much more likely to succeed.
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    void videoRef.current.play().catch(() => {});
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (!cameraStream) return;
      if (cameraStream) {
        for (const track of cameraStream.getTracks()) track.stop();
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      stopRecordingTimer({ updateState: false });
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            discardRecordingRef.current = true;
            mediaRecorderRef.current.stop();
          }
        } catch {
          // ignore
        }
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  return {
    captureAnyInputRef,
    captureImageInputRef,
    captureVideoInputRef,
    isCameraOpen,
    cameraError,
    cameraUiMode,
    cameraStream,
    isRecording,
    recordingSecondsLeft,
    videoRef,
    canvasRef,
    openCapture,
    openCamera,
    closeCamera,
    cancelCamera,
    takePhoto,
    startRecording,
    stopRecording,
    shutterPressStart,
    shutterPressEnd,
    shutterPressCancel,
  };
}
