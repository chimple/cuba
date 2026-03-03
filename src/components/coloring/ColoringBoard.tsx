import "./coloring.css";
import { useRef } from "react";
import { useSvgColoring } from "./useSvgColoring";
import { SVGScene } from "./SVGScene";
import ColorTray from "./ColorTray";
import PaintTopBar from "./PaintTopBar";
import pathwayBg from "../../assets/images/pathwayBackground1.svg";
import { ReactComponent as SceneSvg } from "../../assets/images/tinyfriends_original.svg";

export default function ColoringBoard() {
  const svgRef = useRef<SVGSVGElement>(null);
  const coloring = useSvgColoring(svgRef);

  return (
    <div className="paint-root">
      {/* Background */}
      <div
        className="paint-background"
        style={{ backgroundImage: `url(${pathwayBg})` }}
      />

      {/* Top Buttons */}
      <PaintTopBar
        onExit={() => console.log("exit")}
        onSave={() => console.log("save")}
      />

      {/* Center Layout */}
      <div className="paint-layout">
        <div className="svg-frame">
          <SVGScene mode="color" svgRefExternal={svgRef}>
            <SceneSvg />
          </SVGScene>
        </div>

        <ColorTray
          selected={coloring.selectedColor}
          onSelect={coloring.setSelectedColor}
        />
      </div>
    </div>
  );
}