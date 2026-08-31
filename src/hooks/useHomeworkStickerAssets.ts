import { extractStickerSvg } from '../components/common/SvgHelpers';
import { fetchStickerBookSvgText } from '../utility/stickerBookAssets';

const STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH = '/assets/audios';
const STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX =
  'congrats_on_sticker_collection.mp3';
const stickerDataUrlCache: Record<string, string> = {};

export const STICKER_REWARD_BOX_SELECTOR =
  '.PathwayStructure-end-reward-box--sticker';
export const STICKER_REWARD_BOX_OPEN_CLASS =
  'PathwayStructure-end-reward-box--sticker-open';
export const STICKER_REWARD_BOX_CLOSE_CLASS =
  'PathwayStructure-end-reward-box--sticker-close-anim';
export const STICKER_REWARD_BOX_TILT_CLASS =
  'PathwayStructure-end-reward-box--sticker-clicked';
export const CROWD_CHEER_AUDIO_URL = '/assets/audios/common/crowd_cheer.mp3';

export const getStickerCollectMascotAudioPath = (languageCode?: string) => {
  const normalizedLanguageCode = languageCode?.toLowerCase().split('-')[0];
  const resolvedLanguageCode = normalizedLanguageCode || 'en';
  return `${STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH}/${resolvedLanguageCode}_${STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX}`;
};

export const getStickerImageFallbackFromBookSvg = async (
  stickerBookSvgUrl: string,
  stickerId: string,
) => {
  const cacheKey = `${stickerBookSvgUrl}::${stickerId}`;
  const cached = stickerDataUrlCache[cacheKey];
  if (cached) return cached;

  let stickerSvg: string | null = null;
  try {
    const text = await fetchStickerBookSvgText(stickerBookSvgUrl);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = text;
    const svgNode = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (svgNode) {
      stickerSvg = extractStickerSvg(svgNode, stickerId);
    }
  } catch {
    stickerSvg = null;
  }

  if (!stickerSvg) return null;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stickerSvg)}`;
  stickerDataUrlCache[cacheKey] = dataUrl;
  return dataUrl;
};
