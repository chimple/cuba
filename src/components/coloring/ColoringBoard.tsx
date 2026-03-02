import "./coloring.css";
import ColoringCanvas from "./ColoringCanvas";
import ColorTray from "./ColorTray";
import PaintTopBar from "./PaintTopBar";
import { useSvgColoring } from "./useSvgColoring";
import pathwayBg from "../../assets/images/pathwayBackground1.svg";

export default function ColoringBoard() {
  const coloring = useSvgColoring("coloring-svg");

  return (
    <div className="paint-root">

      {/* Background */}
      <div className="paint-background"
      style={{
    backgroundImage: `url(${pathwayBg})`,
  }} />

      {/* Top Buttons */}
      <PaintTopBar
        onExit={() => console.log("exit")}
        onSave={() => console.log("save")}
      />

      {/* Center Layout */}
      <div className="paint-layout">
        <ColoringCanvas svgId="coloring-svg" />
        <ColorTray
          selected={coloring.selectedColor}
          onSelect={coloring.setSelectedColor}
        />
      </div>

    </div>
  );
}