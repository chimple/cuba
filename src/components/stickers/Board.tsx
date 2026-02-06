import { useEffect, useState } from "react";
import { dragState, StickerId } from "./dragState";

import { ReactComponent as BlankBoard } from "../../assets/images/stickers/Blank_space_layout.svg";
import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";

export default function Board() {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const [placed, setPlaced] = useState<{
    snail: boolean;
    butterfly: boolean;
  }>({
    snail: false,
    butterfly: false,
  });

  // preview tracking
  useEffect(() => {
    const move = () => {
      if (dragState.dragging && dragState.pos) {
        setDragPos(dragState.pos);
      }
    };
    window.addEventListener("dragging", move);
    return () => window.removeEventListener("dragging", move);
  }, []);

  // drop handling
  useEffect(() => {
  const handleDrop = (e: PointerEvent) => {
    if (!dragState.dragging) return;

    const current = dragState.dragging; // ⭐ store locally

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el?.closest(`[data-slot-id="${current}"]`);

    if (slot) {
      setPlaced((p) => ({ ...p, [current]: true }));
    }

    setDragPos(null);
    dragState.dragging = null;
    dragState.pos = null;
  };

  window.addEventListener("pointerup", handleDrop);
  return () => window.removeEventListener("pointerup", handleDrop);
}, []);


  const renderPreview = () => {
    if (!dragPos || !dragState.dragging || !dragState.size) return null;

    const style = {
      position: "fixed" as const,
      left: dragPos.x - dragState.size.w / 2,
      top: dragPos.y - dragState.size.h / 2,
      width: dragState.size.w,
      height: dragState.size.h,
      pointerEvents: "none" as const,
      zIndex: 9999,
    };

    if (dragState.dragging === "snail") return <Snail style={style} />;
    if (dragState.dragging === "butterfly") return <Butterfly style={style} />;

    return null;
  };

  const renderPlaced = (id: StickerId, Comp: any) => {
    if (!placed[id] || !dragState.size) return null;

    return (
      <div
        ref={(el) => {
          const slot = document.querySelector(`[data-slot-id="${id}"]`);
          if (!slot || !el || !dragState.size) return;

          const rect = (slot as HTMLElement).getBoundingClientRect();

          el.style.position = "fixed";

const stickerW = dragState.size.w;
const stickerH = dragState.size.h;

// const stickerW = rect.width;
// const stickerH = rect.height;

// ⭐ center inside slot
el.style.left = rect.left + rect.width / 2 - stickerW / 2 + "px";
el.style.top = rect.top + rect.height / 2 - stickerH / 2 + "px";

el.style.width = stickerW + "px";
el.style.height = stickerH + "px";

        }}
      >
        <Comp width="100%" height="100%" />
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <BlankBoard width={700} />

      {renderPreview()}

      {renderPlaced("snail", Snail)}
      {renderPlaced("butterfly", Butterfly)}
    </div>
  );
}
