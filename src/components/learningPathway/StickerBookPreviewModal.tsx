import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "i18next";
import fallbackStickerBookLayout from "../../assets/images/newWhole_layout.svg";
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

const SLOT_SELECTORS = "path,circle,ellipse,rect,polygon,polyline";
const UPCOMING_STICKER_COLOR = "#FFFFFF";
const CURRENT_WINNABLE_STICKER_COLOR = "#B8B8B8";

const updateStickerSlotStyle = (
  slot: Element,
  status: "collected" | "next" | "locked",
) => {
  const shapes = slot.querySelectorAll(SLOT_SELECTORS);

  if (status === "collected") {
    (slot as HTMLElement).style.opacity = "1";
    shapes.forEach((shape) => {
      shape.removeAttribute("filter");
      shape.removeAttribute("stroke-opacity");
      shape.removeAttribute("fill-opacity");
    });
    return;
  }

  if (status === "next") {
    (slot as HTMLElement).style.opacity = "1";
    shapes.forEach((shape) => {
      const fill = shape.getAttribute("fill");
      if (fill && fill !== "none") {
        shape.setAttribute("fill", CURRENT_WINNABLE_STICKER_COLOR);
      }

      const stroke = shape.getAttribute("stroke");
      if (stroke && stroke !== "none") {
        shape.setAttribute("stroke", CURRENT_WINNABLE_STICKER_COLOR);
      }

      shape.setAttribute("fill-opacity", "1");
      shape.setAttribute("stroke-opacity", "1");
    });
    return;
  }

  (slot as HTMLElement).style.opacity = "1";
  shapes.forEach((shape) => {
    const fill = shape.getAttribute("fill");
    if (fill && fill !== "none") {
      shape.setAttribute("fill", UPCOMING_STICKER_COLOR);
    }

    const stroke = shape.getAttribute("stroke");
    if (stroke && stroke !== "none") {
      shape.setAttribute("stroke", UPCOMING_STICKER_COLOR);
    }

    shape.setAttribute("fill-opacity", "1");
    shape.setAttribute("stroke-opacity", "1");
  });
};

const StickerBookPreviewModal: React.FC<StickerBookPreviewModalProps> = ({
  data,
  onClose,
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const bookContainerRef = useRef<HTMLDivElement>(null);

  const collectedStickerSet = useMemo(
    () => new Set(data.collectedStickerIds),
    [data.collectedStickerIds],
  );

  useEffect(() => {
    let mounted = true;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(data.stickerBookSvgUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch sticker book SVG: ${response.status}`);
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

  useEffect(() => {
    if (!svgMarkup || !bookContainerRef.current) return;

    const svgNode = bookContainerRef.current.querySelector("svg");
    if (!svgNode) return;

    svgNode.setAttribute("width", "100%");
    svgNode.setAttribute("height", "100%");
    svgNode.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const allSlots = svgNode.querySelectorAll("[data-slot-id]");

    allSlots.forEach((slot) => {
      const slotId = slot.getAttribute("data-slot-id") ?? "";
      if (collectedStickerSet.has(slotId)) {
        updateStickerSlotStyle(slot, "collected");
      } else if (slotId === data.nextStickerId) {
        updateStickerSlotStyle(slot, "next");
      } else {
        updateStickerSlotStyle(slot, "locked");
      }
    });
  }, [svgMarkup, data.nextStickerId, collectedStickerSet]);

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
              ref={bookContainerRef}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
              data-testid="StickerBookPreviewModal-book"
            />
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
