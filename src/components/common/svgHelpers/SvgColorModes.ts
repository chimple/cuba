import { applyShapePaint } from './SvgPaintHelpers';

export function applyLockedStickerOutline(svg: SVGSVGElement) {
  const slots = Array.from(svg.querySelectorAll('[data-slot-id]'));

  slots.forEach((slot) => {
    const shapes = slot.querySelectorAll(
      'path,circle,ellipse,rect,polygon,polyline,line',
    );
    shapes.forEach((shape) => {
      const isHighlight = shape.getAttribute('mode') === 'color';

      // White stroke, no fill for stickers
      shape.setAttribute('fill', '#C0C0C0');
      (shape as SVGElement).style?.setProperty('fill', '#C0C0C0', 'important');
      shape.removeAttribute('fill-opacity');

      const strokeColor = isHighlight ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF';
      applyShapePaint(shape, 'stroke', strokeColor);
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

// Sets a solid background color on the SVG and ensures background elements have no fill.
export function applyLockedBackground(svg: SVGSVGElement, color: string) {
  svg.style.backgroundColor = color;
  svg.style.background = color;

  // Background elements (not inside slots) should have no fill
  const shapes = svg.querySelectorAll(
    'path,circle,ellipse,rect,polygon,polyline,line',
  );
  shapes.forEach((el) => {
    if (!el.closest('[data-slot-id]')) {
      el.setAttribute('fill', '#C0C0C0');
      (el as SVGElement).style?.setProperty('fill', '#C0C0C0');
    }
  });
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
