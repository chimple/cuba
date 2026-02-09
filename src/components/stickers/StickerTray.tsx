import { useState } from "react";
import { dragState, StickerId } from "./dragState";
import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";
import { ReactComponent as Ant } from "../../assets/images/stickers/Ant.svg";
import { ReactComponent as Beetle } from "../../assets/images/stickers/beetle.svg";
import { ReactComponent as Fly } from "../../assets/images/stickers/fly.svg";
import { ReactComponent as Flea } from "../../assets/images/stickers/Flea.svg";


const STICKERS = {
  snail: Snail,
  butterfly: Butterfly,
  ant: Ant,
  beetle: Beetle,
  fly: Fly,
  flea: Flea,
} as const;

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
      {Object.entries(STICKERS).map(([id, Comp]) => {
        if (placed[id as StickerId]) return null;

        return (
          <div
            key={id}
            onMouseDown={(e) => {
              dragState.dragging = id as StickerId;

              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              dragState.offsetX = e.clientX - rect.left;
              dragState.offsetY = e.clientY - rect.top;
            }}
            style={{ cursor: "grab" }}
          >
            <Comp width={80} />
          </div>
        );
      })}
    </div>
  );
}

