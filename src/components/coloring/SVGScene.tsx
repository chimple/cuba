import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
// Changes: coordinated SVG mode/visibility helpers and locked-state styling.
import {
  applyColorMode,
  applyDragMode,
  applyLockedBackground,
  applyLockedStickerOutline,
  applyStickerVisibilityStrict,
} from '../common/SvgHelpers';

export type Mode = 'drag' | 'color' | 'preview';

type Props = {
  mode: Mode;
  svgRefExternal?: React.RefObject<SVGSVGElement | null>;
  children: React.ReactElement<any>;
  collectedStickers?: string[];
  nextStickerId?: string;
  isDragEnabled?: boolean;
  stickerVisibilityMode?: 'legacy' | 'strict';
  colorModeUncolouredColor?: string;
  colorModeUncolouredStyle?: 'fill' | 'outline';
  lockedStickerOutline?: boolean;
  lockedBackgroundColor?: string;
  showUncollectedStickers?: boolean;
  stickerVisibilityUseFilters?: boolean;
  sceneWidth?: number | string;
};

export function SVGScene({
  mode,
  svgRefExternal,
  children,
  collectedStickers = [],
  nextStickerId,
  isDragEnabled = true,
  stickerVisibilityMode = 'legacy',
  colorModeUncolouredColor = '#202020',
  colorModeUncolouredStyle = 'fill',
  lockedStickerOutline = false,
  lockedBackgroundColor,
  showUncollectedStickers = true,
  stickerVisibilityUseFilters = true,
  sceneWidth = 560,
}: Props) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const svgRef = svgRefExternal ?? internalRef;

  const colorModeApplied = useRef(false);
  const [svgReadyToken, setSvgReadyToken] = useState(0);
  const [isStyled, setIsStyled] = useState(false);

  // If SVG content is injected or replaced async, wait until slots exist before styling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const observer = new MutationObserver(() => {
      const ready = svg.querySelectorAll('[data-slot-id]').length > 0;
      if (ready) {
        setSvgReadyToken((token) => token + 1);
      }
    });

    observer.observe(svg, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [svgRef]);

  const shouldHideUntilStyled =
    stickerVisibilityMode === 'strict' && !lockedStickerOutline;

  useEffect(() => {
    colorModeApplied.current = false;
    setIsStyled(false);
  }, [mode, svgReadyToken, stickerVisibilityMode, lockedStickerOutline]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // IMPORTANT: wait until SVG slots exist
    const slots = svg.querySelectorAll('[data-slot-id]');
    if (!slots.length) {
      if (shouldHideUntilStyled) {
        svg.style.visibility = 'hidden';
      }
      return;
    }

    if (!isStyled && shouldHideUntilStyled) {
      svg.style.visibility = 'hidden';
    }

    /* ---------------- COLOR MODE ---------------- */
    if (mode === 'color' && !colorModeApplied.current) {
      applyColorMode(svg, colorModeUncolouredColor, colorModeUncolouredStyle);

      // Ensure already painted shapes stay colored
      const painted = svg.querySelectorAll("[data-colored='true']");
      painted.forEach((el) => {
        const shape = el as SVGElement;
        const fill = shape.getAttribute('fill');
        if (fill) {
          shape.style.setProperty('fill', fill, 'important');
        }
      });

      colorModeApplied.current = true;
    }

    /* ---------------- DRAG MODE ---------------- */
    if (mode === 'drag' && isDragEnabled) {
      applyDragMode(svg);
    }

    /* ---------------- STICKER VISIBILITY ---------------- */
    collectedStickers.forEach((id) => {
      const el = svg.querySelector(`[data-slot-id="${id}"]`);
      if (el) (el as SVGElement).style.opacity = '1';
    });

    if (stickerVisibilityMode === 'strict') {
      applyStickerVisibilityStrict(
        svg,
        collectedStickers,
        nextStickerId,
        showUncollectedStickers,
        stickerVisibilityUseFilters,
      );
    }

    /* ---------------- LOCKED ELEMENTS ---------------- */
    if (lockedStickerOutline) {
      applyLockedStickerOutline(svg);
    }

    if (lockedBackgroundColor) {
      applyLockedBackground(svg, lockedBackgroundColor);
    }

    if (!isStyled) {
      setIsStyled(true);
      if (shouldHideUntilStyled) {
        svg.style.visibility = '';
      }
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
    stickerVisibilityUseFilters,
    svgReadyToken,
    isStyled,
    shouldHideUntilStyled,
  ]);

  return React.cloneElement(children as React.ReactElement<any>, {
    ref: svgRef,
    width: sceneWidth,
  });
}
