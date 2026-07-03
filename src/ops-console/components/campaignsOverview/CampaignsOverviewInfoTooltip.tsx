import React from 'react';
import './CampaignsOverviewInfoTooltip.css';

const INFO_ICON_SRC = '/assets/ops-info-icon.svg';

export interface CampaignsOverviewInfoTooltipProps {
  alignment?: 'left' | 'center' | 'right';
  color: string;
  isOpen: boolean;
  label: string;
  message: string;
  onToggle: () => void;
}

const CampaignsOverviewInfoTooltip: React.FC<
  CampaignsOverviewInfoTooltipProps
> = ({ alignment = 'center', color, isOpen, label, message, onToggle }) => (
  <button
    id={`ops-campaigns-info-tooltip ops-campaigns-info-tooltip-${alignment}${
      isOpen ? ' ops-campaigns-info-tooltip-open' : ''
    }`}
    className={`ops-campaigns-info-tooltip ops-campaigns-info-tooltip-${alignment}${
      isOpen ? ' ops-campaigns-info-tooltip-open' : ''
    }`}
    type="button"
    aria-label={`${label} info`}
    aria-expanded={isOpen}
    onClick={onToggle}
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

export default CampaignsOverviewInfoTooltip;
