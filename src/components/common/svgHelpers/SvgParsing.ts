import logger from '../../../utility/logger';

// Parsed SVG payload for inline rendering.
// Changes: added stricter visibility, sizing, and sanitization utilities.
export type ParsedSvg = {
  inner: string;
  attrs: Record<string, string>;
};

// Extracts the root <svg> element and its attributes from a raw string.
export function parseSvg(raw: string): ParsedSvg | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    const attrs: Record<string, string> = {};
    for (const attr of Array.from(svg.attributes)) {
      attrs[attr.name] = attr.value;
    }

    return { inner: svg.innerHTML, attrs };
  } catch (e) {
    logger.error('Failed to parse sticker book svg:', e);
    return null;
  }
}

// Extracts a single sticker group into a standalone SVG string.
export function extractStickerSvg(
  svg: SVGSVGElement,
  stickerId: string,
): string | null {
  // Stickers are stored as groups under their slot id inside the full book SVG.
  const sticker = svg.querySelector(
    `[data-slot-id="${stickerId}"]`,
  ) as SVGGElement | null;

  if (!sticker) return null;

  const clonedSticker = sticker.cloneNode(true) as SVGGElement;

  // Build a tight viewBox around sticker content so rendered sticker
  // fills its container (instead of looking tiny in a large fixed canvas).
  let tightViewBox: string | null = null;
  try {
    const measureSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    measureSvg.setAttribute('width', '1');
    measureSvg.setAttribute('height', '1');
    // Mount off-screen so getBBox can measure accurately without visual flicker.
    measureSvg.style.position = 'absolute';
    measureSvg.style.left = '-10000px';
    measureSvg.style.top = '-10000px';
    measureSvg.style.visibility = 'hidden';
    const forMeasure = clonedSticker.cloneNode(true) as SVGGElement;
    measureSvg.appendChild(forMeasure);
    document.body.appendChild(measureSvg);
    const bbox = forMeasure.getBBox();
    document.body.removeChild(measureSvg);
    if (bbox.width > 0 && bbox.height > 0) {
      // Add a small safety inset around the measured sticker bounds so
      // outlines and rounded edges are not clipped when rendered into
      // tight reward boxes or preview cards.
      const padding = Math.max(2, Math.max(bbox.width, bbox.height) * 0.08);
      tightViewBox = `${bbox.x - padding} ${bbox.y - padding} ${
        bbox.width + padding * 2
      } ${bbox.height + padding * 2}`;
    }
  } catch {
    tightViewBox = null;
  }

  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapper.setAttribute('width', '100%');
  wrapper.setAttribute('height', '100%');
  // Fall back to the historical full-book viewBox if measurement fails.
  wrapper.setAttribute('viewBox', tightViewBox ?? '0 0 500 282');
  wrapper.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  wrapper.setAttribute('fill', 'none');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  wrapper.appendChild(clonedSticker);

  return wrapper.outerHTML;
}

export function sanitizeSvg(svg: string): string {
  if (!svg) return svg;

  return (
    svg
      // remove script tags
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      // remove style tags (avoid inline SVG CSS overriding paint fills)
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      // remove event handlers like onclick, onload
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      // remove javascript: links
      .replace(/javascript:/gi, '')
  );
}
