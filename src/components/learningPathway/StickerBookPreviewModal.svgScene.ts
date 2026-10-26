import {
  applyStickerVisibilityStrict,
  parseSvg,
  type ParsedSvg,
} from '../common/SvgHelpers';
import logger from '../../utility/logger';

export const prepareStickerPreviewSceneSvg = ({
  fallbackParsedSvg,
  sceneCollectedStickers,
  sceneNextStickerId,
  svgMarkup,
}: {
  fallbackParsedSvg: ParsedSvg | null;
  sceneCollectedStickers: string[];
  sceneNextStickerId?: string;
  svgMarkup: string;
}) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return null;

    applyStickerVisibilityStrict(
      svg,
      sceneCollectedStickers,
      sceneNextStickerId,
      true,
    );

    const serializedSvg = new XMLSerializer().serializeToString(svg);
    return parseSvg(serializedSvg);
  } catch (error) {
    logger.error('Failed to prepare sticker preview scene SVG:', error);
    return fallbackParsedSvg;
  }
};

export const serializeStickerPreviewSceneSvg = ({
  sceneCollectedStickers,
  sceneNextStickerId,
  svgMarkup,
}: {
  sceneCollectedStickers: string[];
  sceneNextStickerId?: string;
  svgMarkup: string;
}) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return null;

    applyStickerVisibilityStrict(
      svg,
      sceneCollectedStickers,
      sceneNextStickerId,
      true,
    );

    return new XMLSerializer().serializeToString(svg);
  } catch (error) {
    logger.error('Failed to serialize completion SVG:', error);
    return svgMarkup;
  }
};

export const countStickerBookSvgSlots = (svgMarkup: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    return doc.querySelectorAll('[data-slot-id]').length || undefined;
  } catch (error) {
    logger.warn('Failed to count sticker slots from SVG.', error);
    return undefined;
  }
};

export const resolveStickerBookTotalCount = ({
  payloadTotalStickerCount,
  svgSlotCount,
}: {
  payloadTotalStickerCount?: number;
  svgSlotCount?: number;
}) => {
  if (
    typeof payloadTotalStickerCount === 'number' &&
    payloadTotalStickerCount > 0
  ) {
    return payloadTotalStickerCount;
  }
  if (svgSlotCount && svgSlotCount > 0) {
    return svgSlotCount;
  }
  return undefined;
};
