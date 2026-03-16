import './coloring.css';
import { useRef } from 'react';
import { useSvgColoring } from './useSvgColoring';
import { SVGScene } from './SVGScene';
import ColorTray from './ColorTray';
import PaintTopBar from './PaintTopBar';
import pathwayBg from '../../assets/images/pathwayBackground1.svg';
import cameraIcon from '../../assets/images/camera.svg';
// import { ReactComponent as SceneSvg } from "../../assets/images/tinyfriends_original.svg";
import { ReactComponent as SceneSvg } from '../../assets/images/Sea.svg';

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

      {/* Exit Button */}
      <PaintTopBar onExit={() => console.log('exit')} />

      {/* Main Layout */}
      <div className="paint-layout">
        {/* SVG Area */}
        <div className="svg-frame">
          <SVGScene mode="color" svgRefExternal={svgRef}>
            <SceneSvg />
          </SVGScene>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <button className="save-btn" onClick={() => console.log('save')}>
            <img src={cameraIcon} alt="save" />
            <span>Save</span>
          </button>

          <ColorTray
            selected={coloring.selectedColor}
            onSelect={coloring.setSelectedColor}
          />
        </div>
      </div>
    </div>
  );
}
