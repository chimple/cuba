import React, { useEffect, useRef } from "react";
import {
  applyColorMode,
  applyDragMode,
  applyLockedBackground,
  applyLockedStickerOutline,
  applyStickerVisibilityStrict,
} from "../common/SvgHelpers";

export type Mode = "drag" | "color" | "preview";

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
  sceneWidth?: number | string;
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
  sceneWidth = 560,
}: Props) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const svgRef = svgRefExternal ?? internalRef;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

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
    width: sceneWidth,
  });
}
