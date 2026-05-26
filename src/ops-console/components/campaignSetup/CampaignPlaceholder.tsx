import React from 'react';
import './CampaignPlaceholder.css';

const selectedCountLabel = (count: number, placeholder: string) =>
  count > 0 ? `${count} Selected` : placeholder;

export const renderSelectionCount = (
  selected: unknown[],
  placeholder: string,
) => (
  <span className={selected.length ? undefined : 'campaign-setup-placeholder'}>
    {selectedCountLabel(selected.length, placeholder)}
  </span>
);

export const renderSelectPlaceholder = (
  value: string,
  placeholder: string,
  selectedLabel?: string,
) =>
  value ? (
    selectedLabel
  ) : (
    <span className="campaign-setup-placeholder">{placeholder}</span>
  );
