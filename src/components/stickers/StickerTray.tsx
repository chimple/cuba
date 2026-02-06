import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { dragState } from "./dragState";

export default function StickerTray() {
//   const startDrag = (e: React.PointerEvent) => {
//     dragState.dragging = "snail";

//     const move = (ev: PointerEvent) => {
//       dragState.pos = { x: ev.clientX, y: ev.clientY };
//       window.dispatchEvent(new Event("dragging"));
//     };

//     const up = () => {
//       dragState.dragging = null;
//       window.dispatchEvent(new Event("drag-end"));
//       window.removeEventListener("pointermove", move);
//       window.removeEventListener("pointerup", up);
//     };

//     window.addEventListener("pointermove", move);
//     window.addEventListener("pointerup", up);
//   };

    const startDrag = (e: React.PointerEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

  dragState.dragging = "snail";
  dragState.size = { w: rect.width, h: rect.height };

  const move = (ev: PointerEvent) => {
    dragState.pos = { x: ev.clientX, y: ev.clientY };
    window.dispatchEvent(new Event("dragging"));
  };

  const up = () => {
    dragState.dragging = null;
    window.dispatchEvent(new Event("drag-end"));
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
};

  return (
    <div style={{ width: 200 }}>
      <h3>Stickers</h3>

      <div
        onPointerDown={startDrag}
        style={{
          border: "1px solid #ccc",
          padding: 10,
          cursor: "grab",
        }}
      >
        <Snail width={80} />
      </div>
    </div>
  );
}
