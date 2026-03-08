import React, { useEffect, useRef } from "react";

export type Mode = "drag" | "color";

type Props = {
  mode: Mode;
  svgRefExternal?: React.RefObject<SVGSVGElement | null>;
  children: React.ReactElement<any>;

  collectedStickers?: string[];
  nextStickerId?: string;
  isDragEnabled?: boolean;
};

export function SVGScene({
  mode,
  svgRefExternal,
  children,
  collectedStickers = [],
  nextStickerId,
  isDragEnabled = true,
}: Props) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const svgRef = svgRefExternal ?? internalRef;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // 🔵 CLONE ORIGINAL SVG BEFORE ANY MODIFICATION
    const originalSvg = svg.cloneNode(true) as SVGSVGElement;

    // ---- Sticker extraction (from original clone) ----
    // if (nextStickerId) {
      const stickerSvg = extractStickerSvg(originalSvg, "turtle");

      if (stickerSvg) {
        console.log("🎉 Extracted Sticker SVG:");
        console.log(stickerSvg);
      } else {
        console.log("❌ Sticker not found:", nextStickerId);
      }
    // }

    // ---- Apply scene modes AFTER extraction ----
    if (mode === "color") {
      applyColorMode(svg);
    }

    if (mode === "drag" && isDragEnabled) {
      applyDragMode(svg);
    }

    // ---- Show collected stickers ----
    collectedStickers.forEach((id) => {
      const el = svg.querySelector(`[data-slot-id="${id}"]`);
      if (el) (el as SVGElement).style.opacity = "1";
    });
  }, [mode, collectedStickers, nextStickerId, isDragEnabled]);

  return React.cloneElement(children as React.ReactElement<any>, {
    ref: svgRef,
    width: 560,
  });
}

/* ============================================================
   STICKER EXTRACTION
============================================================ */

export function extractStickerSvg(
  svg: SVGSVGElement | SVGGElement,
  stickerId: string
): string | null {
  const sticker = svg.querySelector(
    `[data-slot-id="${stickerId}"]`
  ) as SVGGElement | null;

  if (!sticker) return null;

  const clonedSticker = sticker.cloneNode(true) as SVGGElement;

  const wrapper = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  wrapper.appendChild(clonedSticker);

  // Temporarily append to DOM to calculate its precise bounds
  wrapper.style.position = "absolute";
  wrapper.style.visibility = "hidden";
  document.body.appendChild(wrapper);

  let bbox = { x: 0, y: 0, width: 500, height: 282 };
  try {
    bbox = clonedSticker.getBBox();
  } catch (e) {
    console.error("Failed to getBBox", e);
  }
  document.body.removeChild(wrapper);

  const pad = 2;
  const vx = (bbox.x || 0) - pad;
  const vy = (bbox.y || 0) - pad;
  const vw = (bbox.width || 500) + pad * 2;
  const vh = (bbox.height || 282) + pad * 2;

  wrapper.removeAttribute("style");
  wrapper.setAttribute("width", "100%");
  wrapper.setAttribute("height", "100%");
  wrapper.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
  wrapper.setAttribute("fill", "none");
  wrapper.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  return wrapper.outerHTML;
}

/* ============================================================
   COLOR MODE
============================================================ */

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

    if (isUncoloured) {
      el.setAttribute("fill", "#202020");
      el.setAttribute("stroke", "#202020");
      el.removeAttribute("fill-opacity");
      el.removeAttribute("stroke-opacity");
      return;
    }

    if (hasMarkId) {
      const hasFill =
        el.hasAttribute("fill") && el.getAttribute("fill") !== "none";
      const hasStroke = el.hasAttribute("stroke");

      if (hasStroke) {
        el.setAttribute("stroke", "#FFFFFF");
        el.setAttribute("stroke-opacity", "0.3");
      }

      if (hasFill) {
        el.setAttribute("fill", "#FFFFFF");
        el.setAttribute("fill-opacity", "0.3");
      }
      return;
    }

    if (isSpecial) {
      el.setAttribute("stroke", "#FFFFFF");

      if (isHighlight) {
        el.setAttribute("stroke-opacity", "0.3");
      } else {
        el.removeAttribute("stroke-opacity");
      }
      return;
    }

    if (hasColorId) {
      el.setAttribute("fill", "#FFFFFF");
      el.removeAttribute("fill-opacity");
      return;
    }

    if (isHighlight) {
      el.setAttribute("fill", "#FFFFFF");
      el.setAttribute("fill-opacity", "0.3");
    }
  });
}

/* ============================================================
   DRAG MODE
============================================================ */

function applyDragMode(svg: SVGSVGElement) {
  const shapes = svg.querySelectorAll(
    "path,circle,ellipse,rect,polygon,polyline"
  );

  shapes.forEach((el) => {
    const isUncoloured = el.getAttribute("uncoloured") === "true";
    const isSpecial = el.getAttribute("special") === "true";
    const hasColorId = el.hasAttribute("color-id");
    const hasMarkId = el.hasAttribute("mark-id");

    if (isUncoloured) {
      el.setAttribute("fill", "#202020");
      el.setAttribute("stroke", "#202020");
      return;
    }

    if (isSpecial) {
      el.setAttribute("stroke", "none");
      el.setAttribute("stroke-width", "0");
      return;
    }

    if (hasMarkId) {
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", "none");
      return;
    }

    if (hasColorId) {
      el.setAttribute("fill", "#FFFFFF");
      el.setAttribute("stroke", "none");
    }
  });

  const highlights = svg.querySelectorAll('[mode="color"]');

  highlights.forEach((el) => {
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "none");
  });
}