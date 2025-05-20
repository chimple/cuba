import React, { useEffect, useRef } from "react";
import "./PathwayModal.css";

interface PathwayModalProps {
  text: string;
  onClose: () => void;
  animate?: boolean; 
}

const PathwayModal: React.FC<PathwayModalProps> = ({ text, onClose, animate = false }) => {
  const PathwayModalRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      PathwayModalRef.current &&
      !PathwayModalRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  useEffect(() => {
    if (!animate) return;

    const listener = (e: MouseEvent) => handleOutsideClick(e);
    document.addEventListener("mousedown", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [animate]);

  return (
    <div className="PathwayModal-overlay">
      <div className={"PathwayModal-content" + (animate ? " slide-in" : "")} ref={PathwayModalRef}>
        {/* only show ✖ when NOT animating (i.e. inactiveText) */}
        {!animate && (
          <button className="PathwayModal-close" onClick={onClose}>
            ✖
          </button>
        )}
        <p className="PathwayModal-text">{text}</p>
      </div>
    </div>
  );
};

export default PathwayModal;
