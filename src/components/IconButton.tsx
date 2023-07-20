import React from "react";
import "./IconButton.css";
const IconButton: React.FC<{
  iconSrc: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}> = ({ iconSrc, name, onClick }) => {
  return (
    <div className="icon-button" onClick={onClick}>
      <div>
        <img className="img" alt={iconSrc} src={iconSrc} />
      </div>
      <p className="child-Name">{name}</p>
    </div>
  );
};
export default IconButton;
