// MenuItems.tsx
import React from "react";
import "./FloatingMenuItems.css"; // Import CSS file for styling

interface FloatingMenuItemsProps {
  isOpen: boolean;
}

const FloatingMenuItems: React.FC<FloatingMenuItemsProps> = ({ isOpen }) => {
  return isOpen ? (
    <div className="menu-items">
      <button className="menu-item">Item 1</button>
      <button className="menu-item">Item 2</button>
    </div>
  ) : null;
};

export default FloatingMenuItems;
