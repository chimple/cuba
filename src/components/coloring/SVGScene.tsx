import React, { useEffect, useRef } from "react";
import {
  applyColorMode,
  applyDragMode,
  applyLockedBackground,
  applyLockedStickerOutline,
  applyStickerVisibilityStrict,
  extractStickerSvg,
} from "../common/SvgHelpers";

export type Mode = "drag" | "color";

type Props = {
  mode: Mode;
  svgRefExternal?: React.RefObject<SVGSVGElement | null>;
  children: React.ReactElement<any>;

  collectedStickers?: string[];
  nextStickerId?: string;
  isDragEnabled?: boolean;
  stickerVisibilityMode?: "legacy" | "strict";
  colorModeUncolouredColor?: string;
  colorModeUncolouredStyle?: "fill" | "outline";
  lockedStickerOutline?: boolean;
  lockedBackgroundColor?: string;
  showUncollectedStickers?: boolean;
};

export function SVGScene({
  mode,
  svgRefExternal,
  children,
  collectedStickers = [],
  nextStickerId,
  isDragEnabled = true,
  stickerVisibilityMode = "legacy",
  colorModeUncolouredColor = "#202020",
  colorModeUncolouredStyle = "fill",
  lockedStickerOutline = false,
  lockedBackgroundColor,
  showUncollectedStickers = true,
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
      applyColorMode(svg, colorModeUncolouredColor, colorModeUncolouredStyle);
    }

    if (mode === "drag" && isDragEnabled) {
      applyDragMode(svg);
    }

    // ---- Show collected stickers ----
    collectedStickers.forEach((id) => {
      const el = svg.querySelector(`[data-slot-id="${id}"]`);
      if (el) (el as SVGElement).style.opacity = "1";
    });

    if (stickerVisibilityMode === "strict") {
      applyStickerVisibilityStrict(
        svg,
        collectedStickers,
        nextStickerId,
        showUncollectedStickers,
      );
    }

    if (lockedStickerOutline) {
      applyLockedStickerOutline(svg);
    }

    if (lockedBackgroundColor) {
      applyLockedBackground(svg, lockedBackgroundColor);
    }
  }, [
    mode,
    collectedStickers,
    nextStickerId,
    isDragEnabled,
    stickerVisibilityMode,
    colorModeUncolouredColor,
    colorModeUncolouredStyle,
    lockedStickerOutline,
    lockedBackgroundColor,
    showUncollectedStickers,
  ]);

  return React.cloneElement(children as React.ReactElement<any>, {
    ref: svgRef,
    width: 560,
  });
}
