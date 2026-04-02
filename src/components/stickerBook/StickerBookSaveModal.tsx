import React, { useEffect, useRef, useState } from 'react';
import './StickerBookSaveModal.css';

type Props = {
  open: boolean;
  svgMarkup?: string | null;
  onClose: () => void;
  onAnimationComplete?: () => void;
};

const AUTO_CLOSE_DELAY_MS = 3000;
const CLOSE_ANIMATION_MS = 1000;

const StickerBookSaveModal: React.FC<Props> = ({
  open,
  svgMarkup,
  onClose,
  onAnimationComplete,
}) => {
  const [blink, setBlink] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const onCloseRef = useRef(onClose);
  const isClosingRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const autoCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (autoCloseTimeoutRef.current !== null) {
        window.clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  const requestClose = () => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    setIsClosing(true);
    if (autoCloseTimeoutRef.current !== null) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onCloseRef.current();
    }, CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    if (!open) {
      setBlink(false);
      setCanClose(false);
      isClosingRef.current = false;
      setIsClosing(false);
      return;
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (autoCloseTimeoutRef.current !== null) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }

    isClosingRef.current = false;
    setIsClosing(false);

    // Hold the modal open until the flash finishes so we do not dismiss it
    // before the share/download snapshot has captured the final frame.
    // After 700ms, trigger blink
    const blinkDelay = setTimeout(() => {
      setBlink(true);
    }, 700);

    // Match the 1s CSS flash animation duration
    const blinkEnd = setTimeout(() => {
      setBlink(false);
      setCanClose(true);
      onAnimationCompleteRef.current?.();
    }, 1700);

    autoCloseTimeoutRef.current = window.setTimeout(() => {
      requestClose();
    }, AUTO_CLOSE_DELAY_MS);

    return () => {
      clearTimeout(blinkDelay);
      clearTimeout(blinkEnd);
      if (autoCloseTimeoutRef.current !== null) {
        window.clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      id="sticker-book-save-modal-overlay"
      className={`stickerBook-save-modal-overlay ${isClosing ? 'stickerBook-save-modal-overlay-closing' : ''}`}
      onClick={() => {
        if (canClose && !isClosing) requestClose();
      }}
    >
      <div
        id="sticker-book-save-modal-content"
        className={`stickerBook-save-modal-content ${isClosing ? 'stickerBook-save-modal-content-closing' : ''}`}
      >
        {/* Star - top left, smaller */}
        <img
          id="sticker-book-save-star-left"
          src="assets/icons/StickerBookStar.svg"
          alt=""
          className={`stickerBook-save-star stickerBook-save-star-left ${blink ? 'visible' : ''}`}
        />
        {/* Star - right side, larger */}
        <img
          id="sticker-book-save-star-right"
          src="assets/icons/StickerBookStar.svg"
          alt=""
          className={`stickerBook-save-star stickerBook-save-star-right ${blink ? 'visible' : ''}`}
        />
        <div
          id="sticker-book-save-modal-frame"
          className="stickerBook-save-modal-frame"
        >
          <div
            id="sticker-book-save-modal-img"
            role="img"
            aria-label="Sticker Book Saved"
            className="stickerBook-save-modal-img"
          >
            <div className="stickerBook-save-modal-artboard">
              {svgMarkup && (
                <div
                  id="sticker-book-save-modal-svg-overlay"
                  className="stickerBook-save-modal-svg-overlay"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              )}
            </div>
            <div className="stickerBook-save-modal-footer">
              <img
                src="assets/icons/chimpleLearningLogo.svg"
                alt="Chimple Learning"
                className="stickerBook-save-modal-logo"
              />
            </div>
          </div>
          {/* Blink overlay */}
          <div
            id="sticker-book-save-blink-overlay"
            className={`stickerBook-save-blink-overlay ${blink ? 'active' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

export default StickerBookSaveModal;
