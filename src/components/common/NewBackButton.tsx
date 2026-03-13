import React from "react";
import { t } from "i18next";

type Props = {
  onClick: () => void;
};

// Simple back button image with keyboard accessibility.
const NewBackButton: React.FC<Props> = ({ onClick }) => {
  return (
    <img
      className="new-back-btn"
      onClick={onClick}
      aria-label={String(t("Back"))}
      role="button"
      tabIndex={0}
      // Trigger click behavior on Enter/Space for accessibility.
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      src="/assets/icons/BackButtonIcon.svg"
      alt=""
    />
  );
};

export default NewBackButton;
