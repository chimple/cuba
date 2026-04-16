import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import logger from '../utility/logger';
import { Util } from '../utility/util';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor, registerPlugin } from '@capacitor/core';

type useStickerBookSaveOptions = {
  fileBaseName: string;
  shareText: string;
  backgroundColor?: string;
  onShareSuccess?: (fileName: string) => void | Promise<void>;
  onShareSettled?: (fileName: string) => void | Promise<void>;
  onSaveSuccess?: (fileName: string) => void | Promise<void>;
};

const SHARE_DELAY_MS = 2000;

function sanitizeFileName(value: string): string {
  return (
    value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'artwork'
  );
}

function createSnapshotTarget(source: HTMLElement) {
  const snapshotWrapper = document.createElement('div');
  const snapshotTarget = source.cloneNode(true) as HTMLElement;
  const bounds = source.getBoundingClientRect();
  const width = Math.max(Math.ceil(bounds.width), source.offsetWidth, 1);
  const height = Math.max(Math.ceil(bounds.height), source.offsetHeight, 1);

  snapshotWrapper.setAttribute('aria-hidden', 'true');
  snapshotWrapper.style.position = 'fixed';
  snapshotWrapper.style.left = '-10000px';
  snapshotWrapper.style.top = '0';
  snapshotWrapper.style.pointerEvents = 'none';
  snapshotWrapper.style.opacity = '0';
  snapshotWrapper.style.zIndex = '-1';

  snapshotTarget.style.width = `${width}px`;
  snapshotTarget.style.height = `${height}px`;
  snapshotTarget.style.margin = '0';

  snapshotWrapper.appendChild(snapshotTarget);
  document.body.appendChild(snapshotWrapper);

  return {
    snapshotTarget,
    cleanup: () => {
      snapshotWrapper.remove();
    },
  };
}

export function useStickerBookSave({
  fileBaseName,
  shareText,
  backgroundColor = '#fffdee',
  onShareSuccess,
  onShareSettled,
  onSaveSuccess,
}: useStickerBookSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [savedSvgMarkup, setSavedSvgMarkup] = useState<string | null>(null);
  const isSavingRef = useRef(false);
  const shareDelayTimeoutRef = useRef<number | null>(null);
  const PortPlugin = registerPlugin<any>('Port');

  useEffect(() => {
    return () => {
      if (shareDelayTimeoutRef.current !== null) {
        window.clearTimeout(shareDelayTimeoutRef.current);
      }
    };
  }, []);

  const setSavingState = (value: boolean) => {
    isSavingRef.current = value;
    setIsSaving(value);
  };

  const waitForShareDelay = () =>
    new Promise<void>((resolve) => {
      if (shareDelayTimeoutRef.current !== null) {
        window.clearTimeout(shareDelayTimeoutRef.current);
      }

      shareDelayTimeoutRef.current = window.setTimeout(() => {
        shareDelayTimeoutRef.current = null;
        resolve();
      }, SHARE_DELAY_MS);
    });

  const openSaveModal = (svgMarkup: string | null) => {
    if (!svgMarkup) return;
    if (shareDelayTimeoutRef.current !== null) {
      window.clearTimeout(shareDelayTimeoutRef.current);
      shareDelayTimeoutRef.current = null;
    }
    setSavedSvgMarkup(svgMarkup);
    setShowSaveToast(false);
    setShowSaveModal(true);
  };

  const closeSaveModal = () => {
    setShowSaveModal(false);
  };

  const closeSaveToast = () => {
    setShowSaveToast(false);
  };

  const handleSaveAndShare = async () => {
    if (isSavingRef.current) {
      return;
    }
    setSavingState(true);

    let fileName = '';
    let cleanupSnapshot = () => {};

    try {
      const shareTarget = document.getElementById(
        'sticker-book-save-modal-frame',
      );
      if (!shareTarget) return;

      const { snapshotTarget, cleanup } = createSnapshotTarget(shareTarget);
      cleanupSnapshot = cleanup;

      setShowSaveToast(true);

      const pngDataUrl = await toPng(snapshotTarget, {
        cacheBust: true,
        backgroundColor,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        filter: (node: HTMLElement) => {
          return node.id !== 'sticker-book-save-blink-overlay';
        },
      });
      if (!pngDataUrl) return;

      // Close the PNG preview once we've captured the snapshot so the toast
      // can remain visible on its own before the share sheet appears.
      setShowSaveModal(false);

      fileName = `${sanitizeFileName(fileBaseName)}_${Date.now()}.png`;
      const blob = await fetch(pngDataUrl).then((response) => response.blob());
      const file = new File([blob], fileName, { type: 'image/png' });

      try {
        await Util.saveImage(file);
        await onSaveSuccess?.(fileName);
      } catch (error) {
        logger.error('Failed to save artwork snapshot:', error);
      }

      await waitForShareDelay();

      try {
        if (Capacitor.isNativePlatform()) {
          const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          const fileUri = savedFile.uri.replace('file://', '');

          await PortPlugin.shareContentWithAndroidShare({
            text: shareText,
            title: fileName,
            url: '',
            imageFile: { name: fileName, path: fileUri },
          });
        } else {
          const shareData: ShareData = {
            text: shareText || 'Sticker Book',
            title: fileName || 'Sticker Book',
            url: undefined,
            files: [file],
          };
          await navigator.share(shareData);
        }
        await onShareSuccess?.(fileName);
      } catch (error) {
        logger.error('Failed to share artwork snapshot:', error);
      } finally {
        await onShareSettled?.(fileName);
      }
    } catch (error) {
      logger.error('Failed to prepare artwork snapshot:', error);
    } finally {
      cleanupSnapshot();
      setSavingState(false);
    }
  };

  return {
    isSaving,
    showSaveModal,
    showSaveToast,
    savedSvgMarkup,
    openSaveModal,
    closeSaveModal,
    closeSaveToast,
    handleSaveAndShare,
  };
}
