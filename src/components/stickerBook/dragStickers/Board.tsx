
import { useEffect } from "react";
import { dragState, StickerId } from "./dragState";
import {SVGScene} from "./SVGScene";

export default function Board({
  onPlaced,
}: {
  onPlaced: (id: StickerId) => void;
}) {
  useEffect(() => {
    const onPointerUp = (e: PointerEvent) => {
      if (!dragState.dragging) return;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const slot = el?.closest("[data-slot-id]") as HTMLElement | null;

      if (!slot) {
        dragState.dragging = null;
        return;
      }

      const slotId = slot.getAttribute("data-slot-id") as StickerId;

      if (slotId === dragState.dragging) {
        revealSticker(slot);
        onPlaced(slotId);
      }

      dragState.dragging = null;
    };

    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, [onPlaced]);

  return (
    <div>
      <SVGScene mode="drag" />
    </div>
  );
}

function revealSticker(slot: HTMLElement) {
  const shapes = slot.querySelectorAll(
    "path,circle,ellipse,rect,polygon"
  );

  shapes.forEach((s: any) => {
    s.setAttribute("fill", s.dataset.fill || "");
    s.setAttribute("stroke", s.dataset.stroke || "#202020");
  });
}
