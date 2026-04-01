import { useState } from 'react';
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
  onSaveSuccess?: (fileName: string) => void | Promise<void>;
};

function sanitizeFileName(value: string): string {
  return (
    value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'artwork'
  );
}

export function useStickerBookSave({
  fileBaseName,
  shareText,
  backgroundColor = '#fffdee',
  onShareSuccess,
  onSaveSuccess,
}: useStickerBookSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [savedSvgMarkup, setSavedSvgMarkup] = useState<string | null>(null);
  const PortPlugin = registerPlugin<any>('Port');

  const openSaveModal = (svgMarkup: string | null) => {
    if (!svgMarkup) return;
    setSavedSvgMarkup(svgMarkup);
    setShowSaveToast(false);
    setShowSaveModal(true);
  };

  const closeSaveModal = () => {
    setShowSaveModal(false);
    setShowSaveToast(true);
  };

  const closeSaveToast = () => {
    setShowSaveToast(false);
  };

  const handleSaveAndShare = async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);

    let fileName = '';

    try {
      const shareTarget = document.getElementById(
        'sticker-book-save-modal-frame',
      );
      if (!shareTarget) return;

      const pngDataUrl = await toPng(shareTarget, {
        cacheBust: true,
        backgroundColor,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        filter: (node: HTMLElement) => {
          return node.id !== 'sticker-book-save-blink-overlay';
        },
      });
      if (!pngDataUrl) return;

      fileName = `${sanitizeFileName(fileBaseName)}_${Date.now()}.png`;
      const blob = await fetch(pngDataUrl).then((response) => response.blob());
      const file = new File([blob], fileName, { type: 'image/png' });

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
        setIsSaving(false);
      }

      try {
        await Util.saveImage(file);
        await onSaveSuccess?.(fileName);
      } catch (error) {
        logger.error('Failed to save artwork snapshot:', error);
      }
    } catch (error) {
      logger.error('Failed to prepare artwork snapshot:', error);
    } finally {
      setIsSaving(false);
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
