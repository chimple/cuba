// import { ReactComponent as LayoutSvg } from "../../assets/images/stickers/WholeCompletelayout.svg";
import { ReactComponent as LayoutSvg } from "../../assets/images/stickers/BWUnfilled.svg";

import ColorTray from "./ColorTray";
import { useSvgColoring } from "./useSvgColoring";

// export default function ColoringBoard() {
//   const { selectedColor, setSelectedColor } = useSvgColoring();

//   return (
//     <div style={wrapper}>
//       <LayoutSvg id="coloring-svg" style={{ width: 600 }} />

//       <ColorTray
//         selected={selectedColor}
//         onSelect={setSelectedColor}
//       />
//     </div>
//   );
// }

// const wrapper: React.CSSProperties = {
//   position: "relative",
//   width: "fit-content",
// };

export default function ColoringBoard() {
  const { selectedColor, setSelectedColor } = useSvgColoring();

  return (
    <div style={container}>
      <LayoutSvg id="coloring-svg" style={{ width: 600 }} />

      <ColorTray
        selected={selectedColor}
        onSelect={setSelectedColor}
      />
    </div>
  );
}

const container: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 20,          // space between svg and tray
};
