import { dragState, StickerId } from "./dragState";
import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";

function Item({ id, Comp }: { id: StickerId; Comp: any }) {
  return (
    <div
      onMouseDown={() => (dragState.dragging = id)}
      onMouseUp={() => (dragState.dragging = null)}
      style={{ cursor: "grab" }}
    >
      <Comp width={80} />
    </div>
  );
}

export default function StickerTray() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Item id="snail" Comp={Snail} />
      <Item id="butterfly" Comp={Butterfly} />
    </div>
  );
}
