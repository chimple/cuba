import { useEffect, useState } from "react";

export function useSvgColoring() {
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  
  useEffect(() => {
  const svg = document.querySelector("#coloring-svg");
  if (!svg) return;

  const colorables = svg.querySelectorAll("[color-id]");
  const uncoloured = svg.querySelectorAll("[uncoloured]");
  const highlights = svg.querySelectorAll('[mode="color"]');
  const specials = svg.querySelectorAll("[special]");

  // MAIN paint areas → white
  colorables.forEach((el) => {
    const s = el as SVGElement;
    s.setAttribute("fill", "#ffffff");
  });

  // HIGHLIGHTS → white but keep opacity
  highlights.forEach((el) => {
    const s = el as SVGElement;
    s.setAttribute("fill", "#ffffff");
    s.setAttribute("fill-opacity", "0.3");
  });

  // OUTLINES → black
  uncoloured.forEach((el) => {
    const s = el as SVGElement;
    s.setAttribute("fill", "#202020");
    s.setAttribute("stroke", "#202020");
  });

  // SPECIAL strokes (snail swirl etc)
  specials.forEach((el) => {
    const s = el as SVGElement;
    s.setAttribute("stroke", "#ffffff");
    s.setAttribute("stroke-opacity", "0.3");
  });

}, []);

  // 🔹 click handler
  useEffect(() => {
    const svg = document.querySelector("#coloring-svg");
    if (!svg) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;

      const shape = target.closest("[color-id]");
      if (!shape) return;

      const id = shape.getAttribute("color-id")!;

      // fill ALL shapes with same id
      const same = svg.querySelectorAll(`[color-id="${id}"]`);

      same.forEach((el) => {
        (el as SVGElement).setAttribute("fill", selectedColor);
      });
    };

    svg.addEventListener("click", handleClick);
    return () => svg.removeEventListener("click", handleClick);
  }, [selectedColor]);

  return {
    selectedColor,
    setSelectedColor,
  };
}