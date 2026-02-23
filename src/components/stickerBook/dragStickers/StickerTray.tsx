

import { dragState, StickerId } from "./dragState";
import { STICKERS } from "../../../generated/stickers";

type Props = {
  placed: Record<StickerId, boolean>;
};

export default function StickerTray({ placed }: Props) {
  return (
    <div
      style={{
        width: 340,
        background: "#e9e9e9",
        borderRadius: 24,
        padding: 30,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 40,
          justifyItems: "center",
          alignItems: "center",
        }}
      >
        {Object.entries(STICKERS as Record<string, string>).map(([id, svg]) => {
          if (placed[id as StickerId]) return null;

          return (
            <div
              key={id}
              onPointerDown={(e) => {
                dragState.dragging = id as StickerId;

                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();

                dragState.offsetX = e.clientX - rect.left;
                dragState.offsetY = e.clientY - rect.top;
              }}
              style={{
                width: 140,
                height: 140,
                cursor: "grab",
                touchAction: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* SCALE FIX */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                dangerouslySetInnerHTML={{
                  __html: svg.replace(
                    "<svg",
                    '<svg width="110" height="110" viewBox="0 0 560 320"'
                  ),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
