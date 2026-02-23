
import { useEffect, useRef } from "react";
import { ReactComponent as Scene } from "../../../assets/images/newWhole_layout.svg";
export type Mode = "drag" | "color";

type Props = {
  mode: Mode;
  svgRefExternal?: React.RefObject<SVGSVGElement>;
};

export function SVGScene({ mode, svgRefExternal }: Props) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const svgRef = svgRefExternal ?? internalRef;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    initSvg(svg);

    if (mode === "drag") {
      setupDragMode(svg);
    }

    if (mode === "color") {
      setupColorMode(svg);
    }
  }, [mode]);

  return <Scene ref={svgRef} width={560} />;
}

//
// ───────────────── INIT
//
function initSvg(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    "path,circle,ellipse,rect,polygon,polyline"
  );

  shapes.forEach((el: any) => {
    if (!el.dataset.fill) {
      el.dataset.fill = el.getAttribute("fill") || "";
    }

    if (!el.dataset.stroke) {
      el.dataset.stroke = el.getAttribute("stroke") || "";
    }
  });
}

//
// ───────────────── DRAG MODE
//
function setupDragMode(svg: SVGSVGElement) {
  const bg = svg.querySelector('[data-slot-id="background"]');
  if (bg) {
    const shapes = bg.querySelectorAll("path,rect");
    shapes.forEach((s: any) => {
      s.setAttribute("fill", "#A8D5C2");
      s.setAttribute("stroke", "none");
      s.removeAttribute("fill-opacity");
    });
  }
  const modeShapes = svg.querySelectorAll('[mode]');
modeShapes.forEach((el: any) => {
  el.setAttribute("stroke-width", "0");
  el.setAttribute("stroke", "none");
});

  const slots = svg.querySelectorAll("[data-slot-id]");
  slots.forEach((slot: any) => {
    const id = slot.getAttribute("data-slot-id");
    if (id === "background") return;

    const shapes = slot.querySelectorAll(
      "path,circle,ellipse,polygon,rect,polyline"
    );

    shapes.forEach((s: any) => {
      s.setAttribute("fill", "white");
      s.setAttribute("stroke", "none");
      s.removeAttribute("fill-opacity");
    });
  });

  // Remove fill-opacity from all shapes with mode="color"
  const colorModeShapes = svg.querySelectorAll('[mode="color"]');
  colorModeShapes.forEach((el: any) => {
    el.removeAttribute("fill-opacity");
  });
  
}

//
// ───────────────── COLOR MODE
//
function setupColorMode(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    "path,circle,ellipse,rect,polygon,polyline"
  );

  shapes.forEach((el: any) => {
    const originalFill = el.dataset.fill;
    const originalStroke = el.dataset.stroke;

    if (originalFill && originalFill !== "none") {
      el.setAttribute("fill", originalFill);
    } else {
      el.setAttribute("fill", "white");
    }

    if (originalStroke && originalStroke !== "none") {
      el.setAttribute("stroke", originalStroke);
    } else {
      el.setAttribute("stroke", "#202020");
    }
  });

  // Set fill-opacity=0.3 for all shapes with mode="color"
  const colorModeShapes = svg.querySelectorAll('[mode="color"]');
  colorModeShapes.forEach((el: any) => {
    el.setAttribute("fill-opacity", "0.3");
  });
}

