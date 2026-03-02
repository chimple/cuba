import { useState, useEffect, useCallback, useRef } from "react";

export type ColoredRegions = Record<string, string>;

export interface UseSvgColoringReturn {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  coloredRegions: ColoredRegions;
  coloredCount: number;
  totalRegions: number;
  resetColoring: () => void;
}

export const useSvgColoring = (svgId: string): UseSvgColoringReturn => {
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [coloredRegions, setColoredRegions] = useState<ColoredRegions>({});
  const totalRegionsRef = useRef<number>(0);

  /**
   * Apply color to region
   */
  const applyColorToRegion = useCallback(
    (region: Element) => {
      if (!selectedColor) return;

      const regionId = region.id;
      if (!regionId) return;

      region.setAttribute("fill", selectedColor);

      setColoredRegions((prev) => ({
        ...prev,
        [regionId]: selectedColor,
      }));
    },
    [selectedColor]
  );

  /**
   * Setup SVG click delegation
   */
  useEffect(() => {
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    // select only colorable regions
    const regions = svgElement.querySelectorAll(
      "[data-colorable='true']"
    );

    totalRegionsRef.current = regions.length;

    const handleClick = (event: Event) => {
      const target = event.target as Element;

      if (!target) return;
      if (!target.hasAttribute("data-colorable")) return;

      applyColorToRegion(target);
    };

    svgElement.addEventListener("click", handleClick);

    return () => {
      svgElement.removeEventListener("click", handleClick);
    };
  }, [svgId, applyColorToRegion]);

  /**
   * Reset all regions
   */
  const resetColoring = useCallback(() => {
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    const regions = svgElement.querySelectorAll(
      "[data-colorable='true']"
    );

    regions.forEach((region) => {
      region.setAttribute("fill", "#FFFFFF");
    });

    setColoredRegions({});
  }, [svgId]);

  return {
    selectedColor,
    setSelectedColor,
    coloredRegions,
    coloredCount: Object.keys(coloredRegions).length,
    totalRegions: totalRegionsRef.current,
    resetColoring,
  };
};