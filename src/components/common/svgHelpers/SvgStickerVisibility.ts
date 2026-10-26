import {
  applyShapeColor,
  applyShapePaint,
  clearShapeOpacity,
  ensureOriginalShapeState,
  ensureSolidColorFilter,
  ensureWhiteFilter,
  getSlotShapes,
  resetSlotState,
  restoreShapeState,
  setSlotState,
} from './SvgPaintHelpers';

// Applies visibility rules for collected, next, and uncollected stickers.
export function applyStickerVisibilityStrict(
  svg: SVGSVGElement,
  collectedStickers: string[],
  nextStickerId?: string,
  showUncollectedStickers: boolean = true,
  useFilters: boolean = true,
) {
  const whiteFilterId = 'sticker-white-filter';
  const greyFilterId = 'sticker-grey-filter';
  if (useFilters) {
    ensureWhiteFilter(svg, whiteFilterId);
    ensureSolidColorFilter(svg, greyFilterId, {
      r: 209 / 255,
      g: 210 / 255,
      b: 212 / 255,
    });
  }
  const slots = Array.from(svg.querySelectorAll('[data-slot-id]'));
  const collectedSet = new Set(collectedStickers);

  slots.forEach((el) => {
    resetSlotState(el as SVGElement);
    const slotId = el.getAttribute('data-slot-id') ?? '';
    const isCollected = collectedSet.has(slotId);
    const isNext = !!nextStickerId && slotId === nextStickerId;

    if (isCollected) {
      setSlotState(el as SVGElement, '1');

      const shapes = getSlotShapes(el as SVGElement);

      shapes.forEach((shape) => {
        ensureOriginalShapeState(shape);
        restoreShapeState(shape);
      });
    } else if (isNext) {
      setSlotState(
        el as SVGElement,
        '1',
        useFilters ? `url(#${greyFilterId})` : undefined,
      );

      const shapes = getSlotShapes(el as SVGElement);

      shapes.forEach((shape) => {
        ensureOriginalShapeState(shape);

        applyShapePaint(shape, 'fill', '#D1D2D4');
        applyShapePaint(shape, 'stroke', '#D1D2D4');
        applyShapeColor(shape, '#D1D2D4');
        clearShapeOpacity(shape);
      });
    } else if (showUncollectedStickers) {
      setSlotState(
        el as SVGElement,
        '1',
        useFilters ? `url(#${whiteFilterId})` : undefined,
      );
      const shapes = getSlotShapes(el as SVGElement);
      shapes.forEach((shape) => {
        ensureOriginalShapeState(shape);
        applyShapePaint(shape, 'fill', '#FFFFFF');
        applyShapePaint(shape, 'stroke', '#FFFFFF');
        applyShapeColor(shape, '#FFFFFF');
        clearShapeOpacity(shape);
      });
    } else {
      setSlotState(el as SVGElement, '0');
    }
  });
}
