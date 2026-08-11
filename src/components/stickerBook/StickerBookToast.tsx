import React, { useEffect, useState } from 'react';
import './StickerBookToast.css';

const TOAST_EXIT_ANIMATION_MS = 320;

type StickerBookToastProps = {
  isOpen: boolean;
  text: string;
  image?: string;
  duration?: number;
  onClose: () => void;
  className?: string;
  imageAlt?: string;
};

const StickerBookToast: React.FC<StickerBookToastProps> = ({
  isOpen,
  text,
  image,
  duration = 3000,
  onClose,
  className = '',
  imageAlt = 'toast-icon',
}) => {
  // Keep the toast mounted briefly after `isOpen` flips false so the exit
  // animation can play instead of disappearing immediately.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, TOAST_EXIT_ANIMATION_MS);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => {
      onClose();
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [isOpen, duration, onClose]);

  if (!shouldRender) return null;

  const toastStateClass = isClosing
    ? 'sticker-book-toast--closing'
    : 'sticker-book-toast--open';

  return (
    <div
      id="sb-toast-container"
      className={`sticker-book-toast ${toastStateClass} ${className}`.trim()}
      role="status"
    >
      {image && (
        <img
          id="sb-toast-icon"
          className="sticker-book-toast-icon"
          src={image}
          alt={imageAlt}
        />
      )}
      <div id="sb-toast-text" className="sticker-book-toast-text">
        {text}
      </div>
    </div>
  );
};

export default StickerBookToast;
