import { useEffect, useState } from "react";
import { dragState } from "./dragState";
import { ReactComponent as Snail } from "../../assets/images/stickers/Snail_thick.svg";
import { ReactComponent as Butterfly } from "../../assets/images/stickers/butterfly_thick.svg";
import { ReactComponent as Ant } from "../../assets/images/stickers/Ant.svg";
import { ReactComponent as Beetle } from "../../assets/images/stickers/beetle.svg";
import { ReactComponent as Fly } from "../../assets/images/stickers/fly.svg";
import { ReactComponent as Flea } from "../../assets/images/stickers/Flea.svg";


const MAP = {
  snail: Snail,
  butterfly: Butterfly,
  ant: Ant,
  beetle: Beetle,
  fly: Fly,
  flea: Flea,
};

export default function DragPreview() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(dragState.dragging);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!dragState.dragging) return;
            setPos({ x: e.clientX, y: e.clientY });
            setDragging(dragState.dragging);
        };

        const up = () => {
            setDragging(null);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, []);

    if (!dragging) return null;

    const Comp = MAP[dragging];

    return (
        <div
            style={{
                position: "fixed",
                left: pos.x - dragState.offsetX,
                top: pos.y - dragState.offsetY,

                pointerEvents: "none",
                zIndex: 9999,
                transform: "scale(1.1)",
            }}
        >
            <Comp width={80} />
        </div>
    );
}
