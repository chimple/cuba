export function getSlotShapes(slot: SVGElement): Element[] {
  const selector = 'g,path,circle,ellipse,rect,polygon,polyline,line,use,image';
  const shapes = Array.from(slot.querySelectorAll(selector));
  if (slot.matches(selector)) {
    shapes.unshift(slot);
  }
  return shapes;
}

// Ensures a white filter exists for whitening uncollected stickers.
export function ensureWhiteFilter(svg: SVGSVGElement, id: string) {
  ensureSolidColorFilter(svg, id, { r: 1, g: 1, b: 1 });
}

export function ensureSolidColorFilter(
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
export function ensureOriginalShapeState(shape: Element) {
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

export function getOriginalState(shape: Element, key: 'fill' | 'stroke') {
  const MISSING_ATTR = '__MISSING__';
  return shape.getAttribute(`data-orig-${key}`) ?? MISSING_ATTR;
}

// Restores fill/stroke after temporary modifications.
export function restoreShapeState(shape: Element) {
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

export function resetSlotState(slot: SVGElement) {
  if (slot.style) {
    slot.style.opacity = '';
    slot.style.filter = '';
  }
  slot.removeAttribute('filter');
}

export function setSlotState(
  slot: SVGElement,
  opacity: string,
  filter?: string,
) {
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

export function applyShapePaint(
  shape: Element,
  key: 'fill' | 'stroke',
  value: string,
) {
  shape.setAttribute(key, value);
  (shape as SVGElement).style?.setProperty(key, value, 'important');
}

export function applyShapeStrokeWidth(shape: Element, value: string) {
  shape.setAttribute('stroke-width', value);
  (shape as SVGElement).style?.setProperty('stroke-width', value, 'important');
}

export function applyShapeColor(shape: Element, value: string) {
  shape.setAttribute('color', value);
  (shape as SVGElement).style?.setProperty('color', value, 'important');
}

export function clearShapeOpacity(shape: Element) {
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
