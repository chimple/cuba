import React, { useEffect, useRef, useState } from 'react';
import './CampaignsOverviewInfoTooltip.css';

const INFO_ICON_SRC = '/assets/ops-info-icon.svg';
const TOOLTIP_BOUNDARY_SELECTOR = 'article';
const TOOLTIP_MAX_WIDTH_PROPERTY = '--ops-campaigns-info-tooltip-max-width';
const TOOLTIP_SHIFT_PROPERTY = '--ops-campaigns-info-tooltip-shift';

export interface CampaignsOverviewInfoTooltipProps {
  alignment?: 'left' | 'center' | 'right';
  color: string;
  isOpen?: boolean;
  label: string;
  message: string;
  onToggle?: () => void;
}

const CampaignsOverviewInfoTooltip: React.FC<
  CampaignsOverviewInfoTooltipProps
> = ({ alignment = 'center', color, isOpen, label, message, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLButtonElement | null>(null);
  const messageRef = useRef<HTMLSpanElement | null>(null);
  const positionFrameRef = useRef<number | null>(null);
  const isControlled = typeof isOpen === 'boolean';
  const resolvedIsOpen = isControlled ? isOpen : internalIsOpen;

  const keepTooltipWithinParent = (): void => {
    if (positionFrameRef.current !== null) {
      window.cancelAnimationFrame(positionFrameRef.current);
    }

    positionFrameRef.current = window.requestAnimationFrame(() => {
      positionFrameRef.current = null;
      const messageElement = messageRef.current;
      const parentElement = tooltipRef.current?.closest(
        TOOLTIP_BOUNDARY_SELECTOR,
      );
      if (!messageElement || !parentElement) return;

      const parentBounds = parentElement.getBoundingClientRect();
      messageElement.style.setProperty(
        TOOLTIP_MAX_WIDTH_PROPERTY,
        `${parentBounds.width}px`,
      );
      messageElement.style.setProperty(TOOLTIP_SHIFT_PROPERTY, '0px');
      const messageBounds = messageElement.getBoundingClientRect();
      const horizontalShift =
        messageBounds.left < parentBounds.left
          ? parentBounds.left - messageBounds.left
          : messageBounds.right > parentBounds.right
            ? parentBounds.right - messageBounds.right
            : 0;

      messageElement.style.setProperty(
        TOOLTIP_SHIFT_PROPERTY,
        `${horizontalShift}px`,
      );
    });
  };

  useEffect(() => {
    if (isControlled) return;

    const handleDocumentPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) {
        setInternalIsOpen(false);
        return;
      }

      if (!tooltipRef.current?.contains(event.target)) {
        setInternalIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [isControlled]);

  useEffect(
    () => () => {
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
      }
    },
    [],
  );

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
      keepTooltipWithinParent();
      return;
    }

    setInternalIsOpen((current) => !current);
    keepTooltipWithinParent();
  };

  return (
    <button
      ref={tooltipRef}
      id={`ops-campaigns-info-tooltip ops-campaigns-info-tooltip-${alignment}${
        resolvedIsOpen ? ' ops-campaigns-info-tooltip-open' : ''
      }`}
      className={`ops-campaigns-info-tooltip ops-campaigns-info-tooltip-${alignment}${
        resolvedIsOpen ? ' ops-campaigns-info-tooltip-open' : ''
      }`}
      type="button"
      aria-label={`${label} info`}
      aria-expanded={resolvedIsOpen}
      onClick={handleToggle}
      onFocus={keepTooltipWithinParent}
      onMouseEnter={keepTooltipWithinParent}
    >
      <img
        id="ops-campaigns-info-tooltip-icon"
        className="ops-campaigns-info-tooltip-icon"
        src={INFO_ICON_SRC}
        alt=""
        aria-hidden="true"
      />
      <span
        ref={messageRef}
        id="ops-campaigns-info-tooltip-message"
        className="ops-campaigns-info-tooltip-message"
        style={
          {
            '--ops-campaigns-info-tooltip-color': color,
          } as React.CSSProperties
        }
        role="tooltip"
      >
        {message}
      </span>
    </button>
  );
};

export default CampaignsOverviewInfoTooltip;
