import { useMemo } from 'react';
import type { ParsedSvg } from '../components/common/SvgHelpers';
import {
  prepareStickerPreviewSceneSvg,
  serializeStickerPreviewSceneSvg,
} from '../components/learningPathway/StickerBookPreviewModal.svgScene';
import type { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal.types';

export const useStickerBookPreviewScene = ({
  fallbackParsedSvg,
  isDragVariant,
  isDropSuccessful,
  renderData,
  svgMarkup,
}: {
  fallbackParsedSvg: ParsedSvg | null;
  isDragVariant: boolean;
  isDropSuccessful: boolean;
  renderData: StickerBookModalData;
  svgMarkup: string;
}) => {
  const sanitizedCollectedStickers = useMemo(() => {
    // Keep previously collected stickers visible in both preview and drag
    // variants. The next sticker still renders as grey until collected.
    return renderData.collectedStickerIds;
  }, [renderData.collectedStickerIds]);

  const sceneCollectedStickers = useMemo(() => {
    if (isDragVariant && isDropSuccessful) {
      return Array.from(
        new Set(
          [...sanitizedCollectedStickers, renderData.nextStickerId].filter(
            Boolean,
          ),
        ),
      ) as string[];
    }
    return sanitizedCollectedStickers;
  }, [
    isDragVariant,
    isDropSuccessful,
    sanitizedCollectedStickers,
    renderData.nextStickerId,
  ]);
  const sceneNextStickerId =
    isDragVariant && isDropSuccessful ? undefined : renderData.nextStickerId;

  const sceneSvg = useMemo<ParsedSvg | null>(() => {
    if (!svgMarkup) return null;
    return prepareStickerPreviewSceneSvg({
      fallbackParsedSvg,
      sceneCollectedStickers,
      sceneNextStickerId,
      svgMarkup,
    });
  }, [fallbackParsedSvg, sceneCollectedStickers, sceneNextStickerId, svgMarkup]);

  const sceneSvgMarkup = useMemo<string | null>(() => {
    if (!svgMarkup) return null;
    return serializeStickerPreviewSceneSvg({
      sceneCollectedStickers,
      sceneNextStickerId,
      svgMarkup,
    });
  }, [sceneCollectedStickers, sceneNextStickerId, svgMarkup]);

  return {
    sceneCollectedStickers,
    sceneNextStickerId,
    sceneSvg,
    sceneSvgMarkup,
  };
};
