import { t } from 'i18next';
import { FC, MouseEventHandler } from 'react';
import './SelectModeButton.css';
import { IconType } from 'react-icons/lib';
import React from 'react';

const SelectModeButton: FC<{
  text: string;
  icon: IconType;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  id?: string;
}> = ({ icon: Icon, onClick, text, disabled = false, id }) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`select-mode-btn ${disabled ? 'select-mode-btn-disabled' : ''}`}
      disabled={disabled}
    >
      <Icon size={'4vh'} />
      <div className="select-mode-btn-text">{t(text)}</div>
    </button>
  );
};

export default SelectModeButton;
