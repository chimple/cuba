// FloatingButton.tsx
import React from "react";
import "./FloatingButton.css"; // Import CSS file for styling

interface FloatingButtonProps {
  onClick: () => void; // onClick prop function
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-button" onClick={onClick}>
      +
    </button>
  );
};

export default FloatingButton;
