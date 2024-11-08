import { t } from "i18next";
import { FC, MouseEventHandler } from "react";
import "./SelectModeButton.css";
import { IconType } from "react-icons/lib";
import React from "react";

const SelectModeButton: FC<{
  text: string;
  icon: IconType;
  onClick: MouseEventHandler<HTMLDivElement>;
}> = ({ icon: Icon, onClick, text }) => {
  return (
    <div
      tabIndex={1}
      aria-label={`${t(text)}`}
      onClick={onClick}
      className="select-mode-btn"
    >
      <Icon size={"4vh"} />
      <div aria-hidden={true} className="select-mode-btn-text">{t(text)}</div>
    </div>
  );
};

export default SelectModeButton;
