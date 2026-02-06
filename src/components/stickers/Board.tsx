import { useEffect, useState } from "react";
import { dragState } from "./dragState";

import { ReactComponent as BlankBoard } from "../../assets/images/stickers/Blank_space_layout.svg";
import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";

export default function Board() {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [placed, setPlaced] = useState(false);

  // track drag preview
  useEffect(() => {
    const move = () => {
      if (dragState.dragging && dragState.pos) {
        setDragPos(dragState.pos);
      }
    };

    window.addEventListener("dragging", move);
    return () => window.removeEventListener("dragging", move);
  }, []);

  // handle drop
  useEffect(() => {
    const handleDrop = (e: PointerEvent) => {
      if (!dragState.dragging) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slot = el?.closest('[data-slot-id="snail"]');

      if (slot) {
        setPlaced(true);
      }

      setDragPos(null);
      dragState.dragging = null;
      dragState.pos = null;
    };

    window.addEventListener("pointerup", handleDrop);
    return () => window.removeEventListener("pointerup", handleDrop);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <BlankBoard width={700} />

      {/* DRAG PREVIEW */}
      {dragPos && !placed && (
        <Snail
          style={{
            position: "fixed",
            left: dragPos.x - 60,
            top: dragPos.y - 60,
            width: 120,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}

      {/* MOUNT INSIDE SLOT */}
      {placed && (
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 700,
            height: "auto",
            pointerEvents: "none",
          }}
        >
          <g
            dangerouslySetInnerHTML={{
              __html: document
                .querySelector('[data-slot-id="snail"]')
                ?.innerHTML || "",
            }}
          />
        </svg>
      )}

      {/* REAL sticker overlay inside slot */}
      {placed && (
        <div
          ref={(el) => {
            const slot = document.querySelector('[data-slot-id="snail"]');
            if (slot && el) {
              const rect = (slot as HTMLElement).getBoundingClientRect();
              el.style.position = "fixed";
              el.style.left = rect.left + "px";
              el.style.top = rect.top + "px";
              el.style.width = rect.width + "px";
              el.style.height = rect.height + "px";
            }
          }}
        >
          <Snail width="100%" height="100%" />
        </div>
      )}
    </div>
  );
}
