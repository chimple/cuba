import { useEffect } from "react";
import { dragState } from "./dragState";

import { ReactComponent as Layout } from "../../assets/images/stickers/Whole_layout.svg";

export default function Board() {

  useEffect(() => {
  // make butterfly slot white on load
  const makeWhite = () => {
    const el = document.querySelector('[data-slot-id="butterfly"]');
    if (!el) return;

    const shapes = el.querySelectorAll("path, circle, ellipse, rect, polygon");
    shapes.forEach((s: any) => {
      s.dataset.originalFill = s.getAttribute("fill") || "";
      s.dataset.originalStroke = s.getAttribute("stroke") || "";

      s.setAttribute("fill", "white");
      s.setAttribute("stroke", "white");
    });
  };

  // wait for SVG mount
  setTimeout(makeWhite, 50);
}, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.dragging) return;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const slot = el?.closest("[data-slot-id]") as HTMLElement | null;
      if (!slot) return;

      const slotId = slot.getAttribute("data-slot-id");

      if (slotId === dragState.dragging) {
        // 👉 reveal by removing white class
        const target = document.querySelector(
          `[data-slot-id="${slotId}"]`
        ) as SVGGElement | null;

        target?.classList.remove("sticker-white");

        dragState.dragging = null;

        if (slotId === dragState.dragging) {
  const target = document.querySelector(
    `[data-slot-id="${slotId}"]`
  ) as SVGGElement | null;

  target?.classList.remove("butterfly"); // remove white css
  dragState.dragging = null;
}

      }
    };

    const onUp = () => (dragState.dragging = null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* CSS INSIDE COMPONENT */}
      <style>
{`
/* make butterfly slot white */
.butterfly path,
.butterfly circle,
.butterfly ellipse,
.butterfly rect,
.butterfly polygon {
  fill: white !important;
  stroke: white !important;
}
`}
</style>


      <Layout width={500} />
    </div>
  );
}
