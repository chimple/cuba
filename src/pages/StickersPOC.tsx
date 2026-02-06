import Board from "../components/stickers/Board";
import StickerTray from "../components/stickers/StickerTray";

export default function StickersPOC() {
  return (
    <div style={{ display: "flex", gap: 40, padding: 40 }}>
      <Board />
      <StickerTray />
    </div>
  );
}
