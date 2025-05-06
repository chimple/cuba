import React, { useEffect, useRef } from "react";
import "./PathwayModal.css";

interface PathwayModalProps {
  text: string;
  onClose: () => void;
}

const PathwayModal: React.FC<PathwayModalProps> = ({ text, onClose }) => {
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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="PathwayModal-overlay">
      <div className="PathwayModal-content" ref={PathwayModalRef}>
        <button className="PathwayModal-close" onClick={onClose}>
          ✖
        </button>
        <p className="PathwayModal-text">{text}</p>
      </div>
    </div>
  );
};

export default PathwayModal;
