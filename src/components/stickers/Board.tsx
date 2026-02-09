import { useEffect, useState } from "react";
import { dragState, StickerId } from "./dragState";
import { ReactComponent as Layout } from "../../assets/images/stickers/Whole_layout.svg";

export default function Board({
  onPlaced,
}: {
  onPlaced: (id: StickerId) => void;
}) {
  const [ready, setReady] = useState(false);

  // make slots white initially
  useEffect(() => {
    setTimeout(() => {
      ["butterfly", "snail"].forEach((id) => {
        const el = document.querySelector(`[data-slot-id="${id}"]`);
        if (!el) return;

        const shapes = el.querySelectorAll("path,circle,ellipse,rect,polygon");
        shapes.forEach((s: any) => {
          s.dataset.fill = s.getAttribute("fill") || "";
          s.dataset.stroke = s.getAttribute("stroke") || "";
          s.setAttribute("fill", "white");
          s.setAttribute("stroke", "white");
        });
      });

      setReady(true);
    }, 50);
  }, []);

  // drag detection
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.dragging) return;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const slot = el?.closest("[data-slot-id]") as HTMLElement | null;
      if (!slot) return;

      const slotId = slot.getAttribute("data-slot-id") as StickerId;

      if (slotId === dragState.dragging) {
        // restore color
        const shapes = slot.querySelectorAll(
          "path,circle,ellipse,rect,polygon"
        );

        shapes.forEach((s: any) => {
          s.setAttribute("fill", s.dataset.fill || "");
          s.setAttribute("stroke", s.dataset.stroke || "");
        });

        onPlaced(slotId);
        dragState.dragging = null;
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", () => (dragState.dragging = null));

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", () => (dragState.dragging = null));
    };
  }, [onPlaced]);

  return (
    <div style={{ position: "relative" }}>
      <Layout width={500} />
    </div>
  );
}
