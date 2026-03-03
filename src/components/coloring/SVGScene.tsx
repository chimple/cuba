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
  const colorable = svg.querySelectorAll("[color-id]");

  colorable.forEach((el: Element) => {
    const isSpecial = el.getAttribute("special") === "true";

    if (isSpecial) {
      el.setAttribute("stroke", "#FFFFFF");
      return;
    }

    el.setAttribute("fill", "#FFFFFF");
  });

  const highlights = svg.querySelectorAll('[mode="color"]');
  highlights.forEach((el: Element) => {
    el.removeAttribute("fill-opacity");
  });
}

//
// ───────── DRAG MODE
//
function applyDragMode(svg: SVGSVGElement) {
  const colorable = svg.querySelectorAll("[color-id]");

  colorable.forEach((el: Element) => {
    const isSpecial = el.getAttribute("special") === "true";

    if (isSpecial) {
      el.setAttribute("stroke", "none");
      el.setAttribute("stroke-width", "0");
      return;
    }

    el.setAttribute("fill", "#FFFFFF");
    el.setAttribute("stroke", "none");
  });

  const highlights = svg.querySelectorAll('[mode="color"]');
  highlights.forEach((el: Element) => {
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "none");
  });
}