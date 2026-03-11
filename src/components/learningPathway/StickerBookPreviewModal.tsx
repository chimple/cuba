import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "i18next";
import fallbackStickerBookLayout from "../../assets/images/newWhole_layout.svg";
import { SVGScene } from "../coloring/SVGScene";
import { ParsedSvg, parseSvg } from "../common/SvgHelpers";
import "./StickerBookPreviewModal.css";

export interface StickerBookPreviewData {
  source: "learning_pathway" | "homework_pathway";
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  nextStickerId: string;
  nextStickerName: string;
  nextStickerImage?: string;
}

interface StickerBookPreviewModalProps {
  data: StickerBookPreviewData;
  onClose: (reason: "close_button" | "backdrop" | "acknowledge_button") => void;
}

const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string }
>(({ svg, className }, ref) => {
  const localRef = useRef<SVGSVGElement | null>(null);

  React.useImperativeHandle(ref, () => localRef.current as SVGSVGElement, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (className) el.setAttribute("class", className);
    Object.entries(svg.attrs).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
    // Keep popup rendering stable across sources: always fit frame.
    el.setAttribute("width", "100%");
    el.setAttribute("height", "100%");
    el.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [svg, className]);

  return <svg ref={localRef} dangerouslySetInnerHTML={{ __html: svg.inner }} />;
});

InlineSvg.displayName = "InlineSvg";

const StickerBookPreviewModal: React.FC<StickerBookPreviewModalProps> = ({
  data,
  onClose,
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const bookSvgRef = useRef<SVGSVGElement | null>(null);
  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);

  useEffect(() => {
    let mounted = true;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(data.stickerBookSvgUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch sticker book SVG: ${response.status}`,
          );
        }
        const text = await response.text();
        if (mounted) {
          setSvgMarkup(text);
        }
      } catch (error) {
        console.warn("Failed to load sticker book SVG. Falling back.", error);
        const fallbackResponse = await fetch(fallbackStickerBookLayout);
        const fallbackText = await fallbackResponse.text();
        if (mounted) {
          setSvgMarkup(fallbackText);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSvg();

    return () => {
      mounted = false;
    };
  }, [data.stickerBookSvgUrl]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose("backdrop");
    }
  };

  return (
    <div
      className="StickerBookPreviewModal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
      data-testid="StickerBookPreviewModal-overlay"
    >
      <div
        className="StickerBookPreviewModal-modal"
        role="dialog"
        aria-modal="true"
        data-testid="StickerBookPreviewModal-modal"
      >
        <button
          className="StickerBookPreviewModal-close"
          onClick={() => onClose("close_button")}
          aria-label="close-sticker-book-preview"
          data-testid="StickerBookPreviewModal-close"
        >
          <img
            src="pathwayAssets/menuCross.svg"
            alt="close-icon"
            data-testid="StickerBookPreviewModal-close-icon"
          />
        </button>

        <div
          className="StickerBookPreviewModal-book-frame"
          data-testid="StickerBookPreviewModal-book-frame"
        >
          {isLoading ? (
            <div
              className="StickerBookPreviewModal-loading"
              data-testid="StickerBookPreviewModal-loading"
            >
              {t("Loading...")}
            </div>
          ) : (
            <div
              className="StickerBookPreviewModal-book"
              data-testid="StickerBookPreviewModal-book"
            >
              {parsedSvg && (
                <SVGScene
                  mode="preview"
                  sceneWidth="100%"
                  svgRefExternal={bookSvgRef}
                  collectedStickers={data.collectedStickerIds}
                  nextStickerId={data.nextStickerId}
                  isDragEnabled={false}
                  stickerVisibilityMode="strict"
                  showUncollectedStickers={true}
                >
                  <InlineSvg svg={parsedSvg} />
                </SVGScene>
              )}
            </div>
          )}
        </div>

        <div
          className="StickerBookPreviewModal-bottom-strip"
          data-testid="StickerBookPreviewModal-bottom-strip"
        >
          <p
            className="StickerBookPreviewModal-helper-text"
            data-testid="StickerBookPreviewModal-helper-text"
          >
            {t("Finish the pathway & collect this")}
          </p>
          <img
            src={data.nextStickerImage || "assets/icons/DefaultIcon.png"}
            alt={data.nextStickerName}
            className="StickerBookPreviewModal-next-image"
            data-testid="StickerBookPreviewModal-next-image"
          />
          <p
            className="StickerBookPreviewModal-next-name"
            data-testid="StickerBookPreviewModal-next-name"
          >
            {t("sticker")}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickerBookPreviewModal;
