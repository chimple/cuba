import { useEffect, useState } from "react";

export function useSvgColoring() {
  const [selectedColor, setSelectedColor] = useState("#ff0000");

  // 🔹 make all colorable shapes white ONCE
  useEffect(() => {
    const svg = document.querySelector("#coloring-svg");
    if (!svg) return;

    const colorables = svg.querySelectorAll("[color-id]");

    colorables.forEach((el) => {
      (el as SVGElement).setAttribute("fill", "#ffffff");
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
