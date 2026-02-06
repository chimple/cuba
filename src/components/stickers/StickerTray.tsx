import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";
import { dragState, StickerId } from "./dragState";

export default function StickerTray() {

  const startDrag = (id: StickerId) => (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    dragState.dragging = id;        // ⭐ THIS is key
    dragState.size = { w: rect.width, h: rect.height };

    const move = (ev: PointerEvent) => {
      dragState.pos = { x: ev.clientX, y: ev.clientY };
      window.dispatchEvent(new Event("dragging"));
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div style={{ width: 200 }}>
      <h3>Stickers</h3>

      <div onPointerDown={startDrag("snail")} style={box}>
        <Snail width={80} />
      </div>

      <div onPointerDown={startDrag("butterfly")} style={box}>
        <Butterfly width={80} />
      </div>
    </div>
  );
}

const box = {
  border: "1px solid #ccc",
  padding: 10,
  cursor: "grab",
  marginBottom: 12,
};
