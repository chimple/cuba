import { AudioUtil } from '../../utility/AudioUtil';
import type {
  StickerBookPreviewMode,
  StickerBookPreviewVariant,
} from './StickerBookPreviewModal.logic';

export const STICKER_BOOK_POPUP_SOUND_EFFECT_URL =
  '/assets/audios/common/generic_sound_effect.mp3';

export async function playStickerBookPopupAudio(
  folder: string,
  clipName: string,
  fallbackText: string,
) {
  const audioUrl = await AudioUtil.getLocalizedAudioUrl(folder, clipName);

  return AudioUtil.playAudioOrTts({
    audioUrl,
    text: fallbackText,
  });
}

export function getStickerBookAudioConfig(
  mode: StickerBookPreviewMode,
  variant: StickerBookPreviewVariant,
) {
  if (mode === 'completion') {
    return {
      folder: 'stickerbookThirdPopup',
      clipName: 'popup_all_stickers_collected',
    };
  }

  if (variant === 'drag_collect') {
    return {
      folder: 'stickerbookSecondPopup',
      clipName: 'popup_sticker_collected',
    };
  }

  return {
    folder: 'stickerbookFirstPopup',
    clipName: 'popup_current_sticker',
  };
}
