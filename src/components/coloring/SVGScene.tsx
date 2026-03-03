import React, { useEffect, useRef } from "react";

export type Mode = "drag" | "color";

type Props = {
  mode: Mode;
  svgRefExternal?: React.RefObject<SVGSVGElement | null>;
  children: React.ReactElement<any>;
};

export function SVGScene({ mode, svgRefExternal, children }: Props) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const svgRef = svgRefExternal ?? internalRef;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (mode === "color") {
      applyColorMode(svg);
    }

    if (mode === "drag") {
      applyDragMode(svg);
    }
  }, [mode]);

  return React.cloneElement(children as React.ReactElement<any>, {
    ref: svgRef,
    width: 560,
  });
}

//
// ───────── COLOR MODE
//
function applyColorMode(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    "path,circle,ellipse,rect,polygon,polyline"
  );

  shapes.forEach((el) => {
    const isUncoloured = el.getAttribute("uncoloured") === "true";
    const isSpecial = el.getAttribute("special") === "true";
    const hasColorId = el.hasAttribute("color-id");
    const hasMarkId = el.hasAttribute("mark-id");
    const isHighlight = el.getAttribute("mode") === "color";

    // 1️⃣ Fixed black elements
    if (isUncoloured) {
      el.setAttribute("fill", "#202020");
      el.setAttribute("stroke", "#202020");
      el.removeAttribute("fill-opacity");
      el.removeAttribute("stroke-opacity");
      return;
    }

    // 2️⃣ Mark overlays (follow region, but faded)
    if (hasMarkId) {
      el.setAttribute("fill", "#FFFFFF");
      el.setAttribute("fill-opacity", "0.3");

      if (el.hasAttribute("stroke")) {
        el.setAttribute("stroke", "#FFFFFF");
        el.setAttribute("stroke-opacity", "0.3");
      }
      return;
    }

    // 3️⃣ Decorative strokes
    if (isSpecial) {
      el.setAttribute("stroke", "#FFFFFF");

      if (isHighlight) {
        el.setAttribute("stroke-opacity", "0.3");
      } else {
        el.removeAttribute("stroke-opacity");
      }

      return;
    }

    // 4️⃣ Normal colorable regions
    if (hasColorId) {
      el.setAttribute("fill", "#FFFFFF");
      el.removeAttribute("fill-opacity");
      return;
    }

    // 5️⃣ Normal highlight shapes (fill-based)
    if (isHighlight) {
      el.setAttribute("fill", "#FFFFFF");
      el.setAttribute("fill-opacity", "0.3");
    }
  });
}

//
// ───────── DRAG MODE
//
function applyDragMode(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    "path,circle,ellipse,rect,polygon,polyline"
  );

  shapes.forEach((el) => {
    const isUncoloured = el.getAttribute("uncoloured") === "true";
    const isSpecial = el.getAttribute("special") === "true";
    const hasColorId = el.hasAttribute("color-id");
    const hasMarkId = el.hasAttribute("mark-id");

    // 1️⃣ Fixed black elements
    if (isUncoloured) {
      el.setAttribute("fill", "#202020");
      el.setAttribute("stroke", "#202020");
      return;
    }

    // 2️⃣ Remove decorative strokes
    if (isSpecial) {
      el.setAttribute("stroke", "none");
      el.setAttribute("stroke-width", "0");
      return;
    }

    // 3️⃣ Hide mark overlays in drag
    if (hasMarkId) {
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", "none");
      return;
    }

    // 4️⃣ Normal regions become white silhouettes
    if (hasColorId) {
      el.setAttribute("fill", "#FFFFFF");
      el.setAttribute("stroke", "none");
    }
  });

  // 5️⃣ Hide all highlight visuals
  const highlights = svg.querySelectorAll('[mode="color"]');
  highlights.forEach((el) => {
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "none");
  });
}