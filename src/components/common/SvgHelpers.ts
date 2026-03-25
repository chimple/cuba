import logger from '../../utility/logger';

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
        applyShapeStrokeWidth(shape, '2');
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

function getSlotShapes(slot: SVGElement): Element[] {
  const selector = 'g,path,circle,ellipse,rect,polygon,polyline,line,use,image';
  const shapes = Array.from(slot.querySelectorAll(selector));
  if (slot.matches(selector)) {
    shapes.unshift(slot);
  }
  return shapes;
}

// Ensures a white filter exists for whitening uncollected stickers.
function ensureWhiteFilter(svg: SVGSVGElement, id: string) {
  ensureSolidColorFilter(svg, id, { r: 1, g: 1, b: 1 });
}

function ensureSolidColorFilter(
  svg: SVGSVGElement,
  id: string,
  color: { r: number; g: number; b: number },
) {
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
  matrix.setAttribute(
    'values',
    `0 0 0 0 ${color.r}  0 0 0 0 ${color.g}  0 0 0 0 ${color.b}  0 0 0 1 0`,
  );

  filter.appendChild(matrix);
  defs.appendChild(filter);
}

// Preserves original fill/stroke attrs and inline styles before overriding.
function ensureOriginalShapeState(shape: Element) {
  const MISSING_ATTR = '__MISSING__';
  const fill = shape.getAttribute('fill');
  const stroke = shape.getAttribute('stroke');
  const fillOpacity = shape.getAttribute('fill-opacity');
  const strokeOpacity = shape.getAttribute('stroke-opacity');
  if (!shape.hasAttribute('data-orig-fill')) {
    shape.setAttribute('data-orig-fill', fill !== null ? fill : MISSING_ATTR);
  }
  if (!shape.hasAttribute('data-orig-stroke')) {
    shape.setAttribute(
      'data-orig-stroke',
      stroke !== null ? stroke : MISSING_ATTR,
    );
  }
  if (!shape.hasAttribute('data-orig-fill-opacity')) {
    shape.setAttribute(
      'data-orig-fill-opacity',
      fillOpacity !== null ? fillOpacity : MISSING_ATTR,
    );
  }
  if (!shape.hasAttribute('data-orig-stroke-opacity')) {
    shape.setAttribute(
      'data-orig-stroke-opacity',
      strokeOpacity !== null ? strokeOpacity : MISSING_ATTR,
    );
  }

  const svgShape = shape as SVGElement;
  const style = svgShape.style;
  if (!shape.hasAttribute('data-orig-style-fill')) {
    shape.setAttribute('data-orig-style-fill', style?.fill || '');
  }
  if (!shape.hasAttribute('data-orig-style-stroke')) {
    shape.setAttribute('data-orig-style-stroke', style?.stroke || '');
  }
  if (!shape.hasAttribute('data-orig-style-fill-opacity')) {
    shape.setAttribute(
      'data-orig-style-fill-opacity',
      style?.fillOpacity || '',
    );
  }
  if (!shape.hasAttribute('data-orig-style-stroke-opacity')) {
    shape.setAttribute(
      'data-orig-style-stroke-opacity',
      style?.strokeOpacity || '',
    );
  }
}

function getOriginalState(shape: Element, key: 'fill' | 'stroke') {
  const MISSING_ATTR = '__MISSING__';
  return shape.getAttribute(`data-orig-${key}`) ?? MISSING_ATTR;
}

// Restores fill/stroke after temporary modifications.
function restoreShapeState(shape: Element) {
  const MISSING_ATTR = '__MISSING__';
  const svgShape = shape as SVGElement;
  const style = svgShape.style;
  if (shape.hasAttribute('data-orig-fill')) {
    const originalFill = shape.getAttribute('data-orig-fill');
    if (!originalFill || originalFill === MISSING_ATTR) {
      shape.removeAttribute('fill');
    } else {
      shape.setAttribute('fill', originalFill);
    }
  }
  if (shape.hasAttribute('data-orig-stroke')) {
    const originalStroke = shape.getAttribute('data-orig-stroke');
    if (!originalStroke || originalStroke === MISSING_ATTR) {
      shape.removeAttribute('stroke');
    } else {
      shape.setAttribute('stroke', originalStroke);
    }
  }
  if (shape.hasAttribute('data-orig-fill-opacity')) {
    const originalFillOpacity = shape.getAttribute('data-orig-fill-opacity');
    if (!originalFillOpacity || originalFillOpacity === MISSING_ATTR) {
      shape.removeAttribute('fill-opacity');
    } else {
      shape.setAttribute('fill-opacity', originalFillOpacity);
    }
  }
  if (shape.hasAttribute('data-orig-stroke-opacity')) {
    const originalStrokeOpacity = shape.getAttribute(
      'data-orig-stroke-opacity',
    );
    if (!originalStrokeOpacity || originalStrokeOpacity === MISSING_ATTR) {
      shape.removeAttribute('stroke-opacity');
    } else {
      shape.setAttribute('stroke-opacity', originalStrokeOpacity);
    }
  }

  if (style) {
    style.fill = shape.getAttribute('data-orig-style-fill') || '';
    style.stroke = shape.getAttribute('data-orig-style-stroke') || '';
    style.fillOpacity =
      shape.getAttribute('data-orig-style-fill-opacity') || '';
    style.strokeOpacity =
      shape.getAttribute('data-orig-style-stroke-opacity') || '';
  }
}

function resetSlotState(slot: SVGElement) {
  if (slot.style) {
    slot.style.opacity = '';
    slot.style.filter = '';
  }
  slot.removeAttribute('filter');
}

function setSlotState(slot: SVGElement, opacity: string, filter?: string) {
  if (slot.style) {
    slot.style.setProperty('opacity', opacity, 'important');
    if (filter) {
      slot.style.setProperty('filter', filter, 'important');
    } else {
      slot.style.removeProperty('filter');
    }
  }

  if (filter) {
    slot.setAttribute('filter', filter);
  } else {
    slot.removeAttribute('filter');
  }
}

function applyShapePaint(
  shape: Element,
  key: 'fill' | 'stroke',
  value: string,
) {
  shape.setAttribute(key, value);
  (shape as SVGElement).style?.setProperty(key, value, 'important');
}

function applyShapeStrokeWidth(shape: Element, value: string) {
  shape.setAttribute('stroke-width', value);
  (shape as SVGElement).style?.setProperty('stroke-width', value, 'important');
}

function applyShapeColor(shape: Element, value: string) {
  shape.setAttribute('color', value);
  (shape as SVGElement).style?.setProperty('color', value, 'important');
}

function clearShapeOpacity(shape: Element) {
  const svgShape = shape as SVGElement;
  shape.removeAttribute('opacity');
  shape.removeAttribute('fill-opacity');
  shape.removeAttribute('stroke-opacity');
  if (svgShape.style) {
    svgShape.style.setProperty('opacity', '1', 'important');
    svgShape.style.setProperty('fill-opacity', '1', 'important');
    svgShape.style.setProperty('stroke-opacity', '1', 'important');
  }
}

// Outlines all stickers for locked state.
export function applyLockedStickerOutline(svg: SVGSVGElement) {
  const slots = Array.from(svg.querySelectorAll('[data-slot-id]'));

  slots.forEach((slot) => {
    const shapes = slot.querySelectorAll(
      'path,circle,ellipse,rect,polygon,polyline,line',
    );
    shapes.forEach((shape) => {
      // Make fills transparent without forcing a fill value.
      shape.setAttribute('fill-opacity', '0');
      (shape as SVGElement).style?.setProperty(
        'fill-opacity',
        '0',
        'important',
      );

      applyShapePaint(shape, 'stroke', '#FFFFFF');
      shape.removeAttribute('stroke-opacity');
      (shape as SVGElement).style?.setProperty(
        'stroke-opacity',
        '1',
        'important',
      );

      if (!shape.getAttribute('stroke-width')) {
        shape.setAttribute('stroke-width', '1');
      }
    });
  });
}

// Sets a solid background color on the SVG.
export function applyLockedBackground(svg: SVGSVGElement, color: string) {
  const svgEl = svg as SVGSVGElement;
  svgEl.style.background = 'transparent';
  svgEl.setAttribute('fill', 'transparent');
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
    const strokeFillableFalse = el.getAttribute('stroke-fillable') === 'false';
    const setFill = (value: string) => {
      if (strokeFillableFalse) return;
      el.setAttribute('fill', value);
    };
    const setFillOpacity = (value: string) => {
      if (strokeFillableFalse) return;
      el.setAttribute('fill-opacity', value);
    };
    const removeFillOpacity = () => {
      if (strokeFillableFalse) return;
      el.removeAttribute('fill-opacity');
    };

    if (el.getAttribute('data-colored') === 'true') {
      return;
    }

    if (uncolouredStyle === 'outline') {
      setFill('none');
      el.setAttribute('stroke', uncolouredColor);
      if (!strokeFillableFalse) {
        (el as SVGElement).style.fill = 'none';
      }
      (el as SVGElement).style.stroke = uncolouredColor;
      if (!el.getAttribute('stroke-width')) {
        el.setAttribute('stroke-width', '1');
      }
      removeFillOpacity();
      el.removeAttribute('stroke-opacity');
      return;
    }

    const isUncoloured = el.getAttribute('uncoloured') === 'true';
    const isHighlight = el.getAttribute('mode') === 'color';
    const isSpecial = el.getAttribute('special') === 'true';
    const hasColorId = el.hasAttribute('color-id');
    const hasMarkId = el.hasAttribute('mark-id');

    if (isSpecial) {
      setFill('none');
      el.setAttribute('stroke', '#FFFFFF');
      el.setAttribute('stroke-opacity', '0.3');
      removeFillOpacity();
      if (isHighlight) {
        const svgEl = el as SVGElement;
        const hasStrokeWidthAttr = el.hasAttribute('stroke-width');
        const hasStrokeWidthStyle =
          !!svgEl.style?.strokeWidth && svgEl.style.strokeWidth !== '0';
        if (!hasStrokeWidthAttr && !hasStrokeWidthStyle) {
          setFill('#FFFFFF');
          setFillOpacity('0.3');
          if (!strokeFillableFalse) {
            el.setAttribute('stroke', 'none');
          }
        }
      }
      return;
    }
    if (isHighlight) {
      const hasFill =
        el.hasAttribute('fill') && el.getAttribute('fill') !== 'none';
      const hasStroke =
        el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none';
      const svgEl = el as SVGElement;
      const hasStrokeWidthAttr = el.hasAttribute('stroke-width');
      const hasStrokeWidthStyle =
        !!svgEl.style?.strokeWidth && svgEl.style.strokeWidth !== '0';
      if (hasFill) {
        setFill('#FFFFFF');
        setFillOpacity('0.3');
      }
      if (hasStroke) {
        el.setAttribute('stroke', '#FFFFFF');
        el.setAttribute('stroke-opacity', '0.3');
      }
      if (!hasStrokeWidthAttr && !hasStrokeWidthStyle) {
        setFill('#FFFFFF');
        setFillOpacity('0.3');
      }
      return;
    }

    if (isUncoloured) {
      const svgEl = el as SVGElement;
      const isFillableFalse = el.getAttribute('data-fillable') === 'false';
      const hasStrokeWidthAttr = el.hasAttribute('stroke-width');
      const hasStrokeWidthStyle =
        !!svgEl.style?.strokeWidth && svgEl.style.strokeWidth !== '0';
      const strokeWidthAttr = el.getAttribute('stroke-width');
      const strokeWidthStyle = svgEl.style?.strokeWidth;
      const isStrokeWidthTwo =
        strokeWidthAttr === '2' || strokeWidthStyle === '2';
      if (isFillableFalse) {
        setFill('#202020');
      } else if (hasStrokeWidthAttr || hasStrokeWidthStyle) {
        setFill('none');
      } else {
        setFill('#202020');
      }
      el.setAttribute('stroke', uncolouredColor);
      removeFillOpacity();
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
        setFill('#FFFFFF');
        setFillOpacity('0.3');
      }
      return;
    }

    if (hasColorId) {
      if (strokeFillableFalse) {
        el.setAttribute('stroke', '#FFFFFF');
        el.removeAttribute('stroke-opacity');
      } else {
        setFill('#FFFFFF');
        removeFillOpacity();
      }
      return;
    }

    // Default non-colorable shapes to black stroke in color mode.
    const hasStroke =
      el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none';
    if (hasStroke) {
      el.setAttribute('stroke', '#202020');
      el.removeAttribute('stroke-opacity');
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
  const label = id.includes('left')
    ? 'Previous page'
    : id.includes('right')
      ? 'Next page'
      : 'Navigate';
  img.setAttribute('role', 'button');
  img.setAttribute('aria-label', label);
  img.setAttribute('tabindex', enabled ? '0' : '-1');
  img.style.cursor = enabled ? 'pointer' : 'default';
  img.style.opacity = enabled ? '1' : '0.5';
  img.style.pointerEvents = enabled ? 'all' : 'none';
  img.style.outline = 'none';
  img.style.userSelect = 'none';
  (img.style as any).webkitTapHighlightColor = 'transparent';
  img.onclick = enabled ? onClick : null;
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
