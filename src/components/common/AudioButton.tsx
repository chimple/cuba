import React from 'react';
import './AudioButton.css';

type AudioButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  backgroundColor?: string;
  size?: number | string;
  type?: 'button' | 'submit' | 'reset';
};

const AudioButton: React.FC<AudioButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  ariaLabel = 'Play audio',
  backgroundColor = 'transparent',
  size = 44,
  type = 'button',
}) => {
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <button
      type={type}
      id={'common-audio-button'}
      className={`audio-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        background: 'transparent',
      }}
    >
      <img
        id={'common-audio-button-icon'}
        className="audio-button__icon"
        src="/assets/icons/SpeakerIcon.svg"
        alt=""
        aria-hidden="true"
        style={{
          backgroundColor: backgroundColor,
          width: resolvedSize,
          height: resolvedSize,
        }}
      />
    </button>
  );
};

export default AudioButton;
