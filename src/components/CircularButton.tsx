import { t } from "i18next";
import React from "react";
import { IoIosAddCircle, IoIosRemoveCircle } from "react-icons/io";

interface CircularButtonProps {
  onClick: () => void;
  isAddAction: boolean;
}

const CircularButton: React.FC<CircularButtonProps> = ({
  onClick,
  isAddAction,
}) => {
  return (
    <div>
      {isAddAction ? (
        <IoIosAddCircle
          id="common-back-button"
          aria-label={String(t("Back"))}
          onClick={onClick}
        />
      ) : (
        <IoIosRemoveCircle
          id="common-back-button"
          aria-label={String(t("Back"))}
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default CircularButton;
