import { useState } from "react";
import Board from "../components/stickerBook/dragStickers/Board";
import StickerTray from "../components/stickerBook/dragStickers/StickerTray";
import DragPreview from "../components/stickerBook/dragStickers/DragPreview";
import { StickerId } from "../components/stickerBook/dragStickers/dragState";

export default function StickersPOC() {
  const [placed, setPlaced] = useState<Record<StickerId, boolean>>({
    butterfly: false,
    snail: false,
    ant: false,
    beetle: false,
    fly: false,
    flea: false,
  });

  const handlePlaced = (id: StickerId) => {
    setPlaced((p) => ({ ...p, [id]: true }));
  };

  return (
    <div style={{ display: "flex", gap: 40, padding: 40 }}>
      <Board onPlaced={handlePlaced} />
      <StickerTray placed={placed} />
      <DragPreview />
    </div>
  );
}