// Parsed SVG payload for inline rendering.
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
    console.error('Failed to parse sticker book svg:', e);
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
      tightViewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
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

// Applies visibility rules for collected, next, and uncollected stickers.
export function applyStickerVisibilityStrict(
  svg: SVGSVGElement,
  collectedStickers: string[],
  nextStickerId?: string,
  showUncollectedStickers: boolean = true,
) {
  const whiteFilterId = 'sticker-white-filter';
  ensureWhiteFilter(svg, whiteFilterId);
  const slots = Array.from(svg.querySelectorAll('[data-slot-id]'));
  const collectedSet = new Set(collectedStickers);

  slots.forEach((el) => {
    const slotId = el.getAttribute('data-slot-id') ?? '';
    const isCollected = collectedSet.has(slotId);
    const isNext = !!nextStickerId && slotId === nextStickerId;

    if (isCollected || isNext) {
      (el as SVGElement).style.opacity = '1';
      (el as SVGElement).style.filter = '';
      el.removeAttribute('filter');
      const shapes = el.querySelectorAll(
        'path,circle,ellipse,rect,polygon,polyline',
      );
      shapes.forEach((shape) => {
        ensureOriginalShapeAttrs(shape);
        if (isNext) {
          const originalFill = shape.getAttribute('data-orig-fill');
          const originalStroke = shape.getAttribute('data-orig-stroke');
          if (originalFill && originalFill !== 'none') {
            shape.setAttribute('fill', '#D1D2D4');
          }
          if (originalStroke && originalStroke !== 'none') {
            shape.setAttribute('stroke', '#D1D2D4');
          }
        } else {
          restoreShapeAttrs(shape);
        }
      });
    } else if (showUncollectedStickers) {
      (el as SVGElement).style.opacity = '1';
      (el as SVGElement).style.filter = '';
      el.setAttribute('filter', `url(#${whiteFilterId})`);
      const shapes = el.querySelectorAll(
        'path,circle,ellipse,rect,polygon,polyline',
      );
      shapes.forEach((shape) => {
        ensureOriginalShapeAttrs(shape);
        const originalFill = shape.getAttribute('data-orig-fill');
        const originalStroke = shape.getAttribute('data-orig-stroke');
        if (originalFill && originalFill !== 'none') {
          shape.setAttribute('fill', '#FFFFFF');
        }
        if (originalStroke && originalStroke !== 'none') {
          shape.setAttribute('stroke', '#FFFFFF');
        }
      });
    } else {
      (el as SVGElement).style.opacity = '0';
      (el as SVGElement).style.filter = '';
      el.removeAttribute('filter');
    }
  });
}

// Ensures a white filter exists for whitening uncollected stickers.
function ensureWhiteFilter(svg: SVGSVGElement, id: string) {
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  let filter = defs.querySelector(`#${id}`) as SVGFilterElement | null;
  if (filter) return;

  filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', id);

  const matrix = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'feColorMatrix',
  );
  matrix.setAttribute('type', 'matrix');
  matrix.setAttribute('values', '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0');

  filter.appendChild(matrix);
  defs.appendChild(filter);
}

// Preserves original fill/stroke before overriding.
function ensureOriginalShapeAttrs(shape: Element) {
  const fill = shape.getAttribute('fill');
  const stroke = shape.getAttribute('stroke');
  if (fill !== null && !shape.hasAttribute('data-orig-fill')) {
    shape.setAttribute('data-orig-fill', fill);
  }
  if (stroke !== null && !shape.hasAttribute('data-orig-stroke')) {
    shape.setAttribute('data-orig-stroke', stroke);
  }
}

// Restores fill/stroke after temporary modifications.
function restoreShapeAttrs(shape: Element) {
  if (shape.hasAttribute('data-orig-fill')) {
    shape.setAttribute('fill', shape.getAttribute('data-orig-fill') as string);
  }
  if (shape.hasAttribute('data-orig-stroke')) {
    shape.setAttribute(
      'stroke',
      shape.getAttribute('data-orig-stroke') as string,
    );
  }
}

// Outlines all stickers for locked state.
export function applyLockedStickerOutline(svg: SVGSVGElement) {
  const slots = Array.from(svg.querySelectorAll('[data-slot-id]'));

  slots.forEach((el) => {
    (el as SVGElement).style.opacity = '1';
    const shapes = el.querySelectorAll(
      'path,circle,ellipse,rect,polygon,polyline',
    );
    shapes.forEach((shape) => {
      shape.setAttribute('fill', 'none');
      shape.setAttribute('stroke', '#FFFFFF');
      shape.removeAttribute('fill-opacity');
      shape.removeAttribute('stroke-opacity');
    });
  });
}

// Sets a solid background color on the SVG.
export function applyLockedBackground(svg: SVGSVGElement, color: string) {
  const svgEl = svg as SVGSVGElement;
  svgEl.style.background = color;
}

// Applies the color mode styling rules to the SVG.
export function applyColorMode(
  svg: SVGSVGElement,
  uncolouredColor: string,
  uncolouredStyle: 'fill' | 'outline',
) {
  const shapes = svg.querySelectorAll(
    'path,circle,ellipse,rect,polygon,polyline',
  );

  shapes.forEach((el) => {
    const isUncoloured = el.getAttribute('uncoloured') === 'true';
    const isSpecial = el.getAttribute('special') === 'true';
    const hasColorId = el.hasAttribute('color-id');
    const hasMarkId = el.hasAttribute('mark-id');
    const isHighlight = el.getAttribute('mode') === 'color';

    if (isUncoloured) {
      if (uncolouredStyle === 'outline') {
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', uncolouredColor);
      } else {
        el.setAttribute('fill', uncolouredColor);
        el.setAttribute('stroke', uncolouredColor);
      }
      el.removeAttribute('fill-opacity');
      el.removeAttribute('stroke-opacity');
      return;
    }

    if (hasMarkId) {
      const hasFill =
        el.hasAttribute('fill') && el.getAttribute('fill') !== 'none';
      const hasStroke = el.hasAttribute('stroke');

      if (hasStroke) {
        el.setAttribute('stroke', '#FFFFFF');
        el.setAttribute('stroke-opacity', '0.3');
      }

      if (hasFill) {
        el.setAttribute('fill', '#FFFFFF');
        el.setAttribute('fill-opacity', '0.3');
      }
      return;
    }

    if (isSpecial) {
      el.setAttribute('stroke', '#FFFFFF');

      if (isHighlight) {
        el.setAttribute('stroke-opacity', '0.3');
      } else {
        el.removeAttribute('stroke-opacity');
      }
      return;
    }

    if (hasColorId) {
      el.setAttribute('fill', '#FFFFFF');
      el.removeAttribute('fill-opacity');
      return;
    }

    if (isHighlight) {
      el.setAttribute('fill', '#FFFFFF');
      el.setAttribute('fill-opacity', '0.3');
    }
  });
}

// Applies the drag mode styling rules to the SVG.
export function applyDragMode(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    'path,circle,ellipse,rect,polygon,polyline',
  );

  shapes.forEach((el) => {
    const isUncoloured = el.getAttribute('uncoloured') === 'true';
    const isSpecial = el.getAttribute('special') === 'true';
    const hasColorId = el.hasAttribute('color-id');
    const hasMarkId = el.hasAttribute('mark-id');

    if (isUncoloured) {
      el.setAttribute('fill', '#202020');
      el.setAttribute('stroke', '#202020');
      return;
    }

    if (isSpecial) {
      el.setAttribute('stroke', 'none');
      el.setAttribute('stroke-width', '0');
      return;
    }

    if (hasMarkId) {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'none');
      return;
    }

    if (hasColorId) {
      el.setAttribute('fill', '#FFFFFF');
      el.setAttribute('stroke', 'none');
    }
  });

  const highlights = svg.querySelectorAll('[mode="color"]');

  highlights.forEach((el) => {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'none');
  });
}

export function ensureNavImage(
  svg: SVGSVGElement,
  id: string,
  href: string,
  x: number,
  y: number,
  width: number,
  height: number,
  enabled: boolean,
  onClick: () => void,
) {
  let img = svg.querySelector(`#${id}`) as SVGImageElement | null;
  if (!img) {
    img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('id', id);
    svg.appendChild(img);
  }
  img.setAttribute('href', href);
  img.setAttribute('x', String(x));
  img.setAttribute('y', String(y));
  img.setAttribute('width', String(width));
  img.setAttribute('height', String(height));
  img.style.cursor = enabled ? 'pointer' : 'default';
  img.style.opacity = enabled ? '1' : '0.5';
  img.style.pointerEvents = enabled ? 'all' : 'none';
  img.onclick = enabled ? onClick : null;
}
export function sanitizeSvg(svg: string): string {
  if (!svg) return svg;

  return (
    svg
      // remove script tags
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      // remove event handlers like onclick, onload
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      // remove javascript: links
      .replace(/javascript:/gi, '')
  );
}
