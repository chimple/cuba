export const getStickerBookSlotRectInFrame = ({
  frame,
  svg,
  scale,
  stickerId,
}: {
  frame: HTMLDivElement | null;
  svg: SVGSVGElement | null;
  scale: number;
  stickerId?: string;
}) => {
  if (!frame || !svg) return null;
  const slot = svg.querySelector(
    `[data-slot-id="${stickerId}"]`,
  ) as SVGGElement | null;
  if (!slot) return null;

  const candidateElements = [slot, ...Array.from(slot.querySelectorAll('*'))].filter(
    (element): element is SVGGraphicsElement =>
      element instanceof SVGGraphicsElement &&
      typeof element.getBBox === 'function',
  );
  const measuredElement =
    candidateElements.find((element) => {
      try {
        const box = element.getBBox();
        return box.width > 0 || box.height > 0;
      } catch (error) {
        return false;
      }
    }) ?? (slot as SVGGraphicsElement);

  const fallbackRectForElement = (element: Element) => {
    const fallbackRect = element.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    return {
      x: (fallbackRect.left - frameRect.left) / scale,
      y: (fallbackRect.top - frameRect.top) / scale,
      width: fallbackRect.width / scale,
      height: fallbackRect.height / scale,
    };
  };

  if (
    !(measuredElement instanceof SVGGraphicsElement) ||
    typeof measuredElement.getScreenCTM !== 'function'
  ) {
    return fallbackRectForElement(slot);
  }

  let box: DOMRect | SVGRect;
  try {
    box = measuredElement.getBBox();
  } catch (error) {
    return fallbackRectForElement(slot);
  }

  const ctm = measuredElement.getScreenCTM();
  if (!ctm) {
    return fallbackRectForElement(measuredElement);
  }

  const point = svg.createSVGPoint();
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ].map(({ x, y }) => {
    point.x = x;
    point.y = y;
    const transformed = point.matrixTransform(ctm);
    return { x: transformed.x, y: transformed.y };
  });

  const frameRect = frame.getBoundingClientRect();
  const left = Math.min(...corners.map((corner) => corner.x));
  const right = Math.max(...corners.map((corner) => corner.x));
  const top = Math.min(...corners.map((corner) => corner.y));
  const bottom = Math.max(...corners.map((corner) => corner.y));

  return {
    x: (left - frameRect.left) / scale,
    y: (top - frameRect.top) / scale,
    width: (right - left) / scale,
    height: (bottom - top) / scale,
  };
};
