
import { useEffect, useState } from "react";
import { dragState } from "./dragState";
import { STICKERS } from "../../../generated/stickers";

export default function DragPreview() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(dragState.dragging);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragState.dragging) return;

      setPos({ x: e.clientX, y: e.clientY });
      setDragging(dragState.dragging);
    };

    const up = () => setDragging(null);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  if (!dragging) return null;

  const svg = STICKERS[dragging];

return (
  <div
    style={{
      position: "fixed",
      left: pos.x - dragState.offsetX,
      top: pos.y - dragState.offsetY,
      pointerEvents: "none",
      zIndex: 9999,
      width: 140,
      height: 140,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    dangerouslySetInnerHTML={{
      __html: svg.replace(
        "<svg",
        '<svg width="110" height="110" viewBox="0 0 560 320"'
      ),
    }}
  />
);
}

