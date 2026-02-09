import Board from "../components/stickers/Board";
import StickerTray from "../components/stickers/StickerTray";
import { useState } from "react";
import { StickerId } from "../components/stickers/dragState";
import DragPreview from "../components/stickers/DragPreview";

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
