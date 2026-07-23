import { t } from 'i18next';
import StickerBookCompletionModal from './StickerBookCompletionModal';
import StickerBookSaveModal from '../stickerBook/StickerBookSaveModal';
import StickerBookToast from '../stickerBook/StickerBookToast';

interface StickerBookPreviewCompletionLayerProps {
  bookSvgRef: React.RefObject<SVGSVGElement | null>;
  closeCompletionSaveModal: () => void;
  closeSaveToast: () => void;
  handleClose: (
    reason: 'close_button' | 'backdrop' | 'acknowledge_button',
  ) => void;
  handlePaint: () => void;
  handleReplayAudio: () => void;
  handleSave: () => void;
  handleSaveAndShare: () => Promise<void>;
  isSaving: boolean;
  savedSvgMarkup: string | null;
  sceneSvgMarkup: string | null;
  showSaveModal: boolean;
  showSaveToast: boolean;
}

const StickerBookPreviewCompletionLayer = ({
  bookSvgRef,
  closeCompletionSaveModal,
  closeSaveToast,
  handleClose,
  handlePaint,
  handleReplayAudio,
  handleSave,
  handleSaveAndShare,
  isSaving,
  savedSvgMarkup,
  sceneSvgMarkup,
  showSaveModal,
  showSaveToast,
}: StickerBookPreviewCompletionLayerProps) => (
  <>
    {!showSaveModal && !isSaving && (
      <StickerBookCompletionModal
        svgMarkup={sceneSvgMarkup}
        isSaving={isSaving}
        bookSvgRef={bookSvgRef}
        onClose={() => handleClose('close_button')}
        onBackdropClose={() => handleClose('backdrop')}
        onReplayAudio={handleReplayAudio}
        onSave={handleSave}
        onPaint={handlePaint}
      />
    )}
    <StickerBookSaveModal
      open={showSaveModal}
      svgMarkup={savedSvgMarkup}
      onClose={closeCompletionSaveModal}
      onAnimationComplete={handleSaveAndShare}
      autoClose={false}
    />
    <StickerBookToast
      isOpen={showSaveToast}
      text={t(
        'Yay! Your creation is saved, share it with your family & friends!',
      )}
      image="/assets/icons/Confirmation.svg"
      duration={4000}
      onClose={closeSaveToast}
    />
  </>
);

export default StickerBookPreviewCompletionLayer;
