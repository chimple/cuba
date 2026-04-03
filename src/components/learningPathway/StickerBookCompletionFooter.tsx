import React from 'react';
import StickerBookActions from '../stickerBook/StickerBookActions';
import './StickerBookCompletionFooter.css';

interface StickerBookCompletionFooterProps {
  isSaving: boolean;
  onSave: () => void;
  onPaint: () => void;
}

export default function StickerBookCompletionFooter({
  isSaving,
  onSave,
  onPaint,
}: StickerBookCompletionFooterProps) {
  return (
    <div className="StickerBookCompletionFooter-root">
      <StickerBookActions
        showPaint={true}
        canSave={true}
        onSave={onSave}
        onPaint={onPaint}
        saveDisabled={isSaving}
      />
    </div>
  );
}
