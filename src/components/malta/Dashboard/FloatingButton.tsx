import React from "react";
import "./FloatingButton.css";

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-button" onClick={onClick}>
      +
    </button>
  );
};

export default FloatingButton;
