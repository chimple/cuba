import { useState, useEffect, useCallback } from 'react';
import { Util } from '../../utility/util';
import { EVENTS } from '../../common/constants';

export type ColoredRegions = Record<string, string>;

export interface UseSvgColoringReturn {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  coloredRegions: ColoredRegions;
}

export const useSvgColoring = (
  svgRef: React.RefObject<SVGSVGElement | null>,
): UseSvgColoringReturn => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [coloredRegions, setColoredRegions] = useState<ColoredRegions>({});

  const handleClick = useCallback(
    (event: Event) => {
      if (!selectedColor) return;

      const target = event.target as Element;
      if (!target) return;

      const colorable = target.closest('[color-id]') as Element | null;
      if (!colorable) return;

      const regionId = colorable.getAttribute('color-id');
      if (!regionId) return;

      const paintShape = (shape: Element) => {
        shape.setAttribute('fill', selectedColor);
        (shape as SVGElement).style.setProperty(
          'fill',
          selectedColor,
          'important',
        );
        shape.setAttribute('data-colored', 'true');
      };

      const tag = colorable.tagName.toLowerCase();
      if (tag === 'g') {
        const shapes = colorable.querySelectorAll(
          'path,circle,ellipse,rect,polygon,polyline',
        );
        if (shapes.length) {
          shapes.forEach((shape) => paintShape(shape));
        } else {
          paintShape(colorable);
        }
      } else {
        paintShape(colorable);
      }

      setColoredRegions((prev) => ({
        ...prev,
        [regionId]: selectedColor,
      }));

      // Change: track paint interactions for analytics.
      Util.logEvent(EVENTS.PAINT_CANVAS_TAP, {
        user_id: Util.getCurrentStudent()?.id ?? null,
        region_id: regionId,
        color: selectedColor,
        colored_count: Object.keys(coloredRegions).length + 1,
        page_path: window.location.pathname,
      });
    },
    [selectedColor, coloredRegions],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener('click', handleClick);

    return () => {
      svg.removeEventListener('click', handleClick);
    };
  }, [svgRef, handleClick]);

  return {
    selectedColor,
    setSelectedColor,
    coloredRegions,
  };
};
