import { useState, useEffect, useCallback } from 'react';

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

      colorable.setAttribute('fill', selectedColor);

      setColoredRegions((prev) => ({
        ...prev,
        [regionId]: selectedColor,
      }));
    },
    [selectedColor],
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
