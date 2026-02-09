import { useState } from "react";
import { dragState, StickerId } from "./dragState";

import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";

function Item({
  id,
  Comp,
  hidden,
}: {
  id: StickerId;
  Comp: any;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <div
      onMouseDown={(e) => {
        dragState.dragging = id;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        dragState.offsetX = e.clientX - rect.left;
        dragState.offsetY = e.clientY - rect.top;
      }}
      style={{ cursor: "grab" }}
    >
      <Comp width={80} />
    </div>
  );
}

export default function StickerTray({
  placed,
}: {
  placed: Record<StickerId, boolean>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Item id="snail" Comp={Snail} hidden={placed.snail} />
      <Item id="butterfly" Comp={Butterfly} hidden={placed.butterfly} />
    </div>
  );
}
