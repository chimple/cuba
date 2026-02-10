import { useEffect, useState } from "react";
import { SlotColorMap } from "./types";

export function useSvgColoring() {
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const [colors, setColors] = useState<SlotColorMap>({});

  // 🟢 run only once → make all slots white initially
  useEffect(() => {
    const svg = document.querySelector("#coloring-svg");
    if (!svg) return;

    const slots = svg.querySelectorAll("[data-slot-id]");

    slots.forEach((group) => {
      const elements = group.querySelectorAll("path, circle, ellipse");
      elements.forEach((el) => {
        const fill = el.getAttribute("fill");
        if (!fill || fill === "none") return;

        el.setAttribute("fill", "#ffffff");
      });
    });
  }, []); // ← empty dependency (runs once)

  // 🟢 click handling
  useEffect(() => {
    const svg = document.querySelector("#coloring-svg");
    if (!svg) return;

    const handleClick = (e: Event) => {
      const target = (e.target as HTMLElement).closest("[data-slot-id]");
      if (!target) return;

      const group = target as SVGGElement;
      const slotId = group.dataset.slotId!;

      applyFill(group, selectedColor);

      setColors((prev) => ({
        ...prev,
        [slotId]: selectedColor,
      }));
    };

    svg.addEventListener("click", handleClick);
    return () => svg.removeEventListener("click", handleClick);
  }, [selectedColor]);

  const applyFill = (group: SVGGElement, color: string) => {
    const elements = group.querySelectorAll("path, circle, ellipse");

    elements.forEach((el) => {
      const fill = el.getAttribute("fill");
      if (!fill || fill === "none") return;

      el.setAttribute("fill", color);
    });
  };

  return {
    selectedColor,
    setSelectedColor,
    colors,
  };
}
