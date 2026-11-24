import { t } from 'i18next';
import { FC, MouseEventHandler } from 'react';
import './SelectModeButton.css';
import { IconType } from 'react-icons/lib';
import React from 'react';
import { getTrackableProps } from '../../analytics/trackable';

const SelectModeButton: FC<{
  text: string;
  icon: IconType;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  id: string;
  className: string;
  trackableId: string;
}> = ({
  icon: Icon,
  onClick,
  text,
  disabled = false,
  id,
  className,
  trackableId,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`select-mode-btn ${id} ${className} ${
        disabled ? 'select-mode-btn-disabled' : ''
      }`}
      {...getTrackableProps(trackableId)}
      disabled={disabled}
    >
      <Icon size={'4vh'} />
      <div className="select-mode-btn-text">{t(text)}</div>
    </button>
  );
};

export default SelectModeButton;
