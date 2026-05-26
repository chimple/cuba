import React from 'react';
import './CampaignPlaceholder.css';

const selectedCountLabel = (count: number, placeholder: string) =>
  count > 0 ? `${count} Selected` : placeholder;

export const CampaignCountPlaceholder = (
  selected: unknown[],
  placeholder: string,
) => (
  <span className={selected.length ? undefined : 'campaign-count-placeholder'}>
    {selectedCountLabel(selected.length, placeholder)}
  </span>
);

export const CampaignSelectPlaceholder = (
  value: string,
  placeholder: string,
  selectedLabel?: string,
) =>
  value ? (
    selectedLabel
  ) : (
    <span className="campaign-select-placeholder">{placeholder}</span>
  );
