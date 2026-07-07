import React, { useEffect, useRef, useState } from 'react';
import './CampaignsOverviewInfoTooltip.css';

const INFO_ICON_SRC = '/assets/ops-info-icon.svg';

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
  const isControlled = typeof isOpen === 'boolean';
  const resolvedIsOpen = isControlled ? isOpen : internalIsOpen;

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

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
      return;
    }

    setInternalIsOpen((current) => !current);
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
    >
      <img
        id="ops-campaigns-info-tooltip-icon"
        className="ops-campaigns-info-tooltip-icon"
        src={INFO_ICON_SRC}
        alt=""
        aria-hidden="true"
      />
      <span
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
