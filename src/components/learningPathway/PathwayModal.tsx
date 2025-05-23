import React, { useEffect, useRef, useState } from "react";
import "./PathwayModal.css";

interface PathwayModalProps {
  text: string;
  onClose: () => void;
  animate?: boolean;
}

const PathwayModal: React.FC<PathwayModalProps> = ({
  text,
  onClose,
  animate = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleOutsideClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      if (animate) {
        setIsClosing(true);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!isClosing) return;
    const node = ref.current!;
    const onEnd = () => onClose();
    node.addEventListener("animationend", onEnd);
    return () => {
      node.removeEventListener("animationend", onEnd);
    };
  }, [isClosing, onClose]);

  const cls =
    "PathwayModal-content" +
    (animate && !isClosing ? " slide-in" : "") +
    (isClosing ? " slide-out" : "");

  const modalStyles = {
    width: "40vw",
    height: animate ? "19.5vh" : "32vh",
  };

  return (
    <div className="PathwayModal-overlay">
      <div className={cls} ref={ref} style={modalStyles}>
        {!animate && (
          <button className="PathwayModal-close" onClick={onClose}>
            <img src='pathwayAssets/menuCross.svg' alt="close-icon" />
          </button>
        )}
        <p className="PathwayModal-text">{text}</p>
      </div>
    </div>
  );
};

export default PathwayModal;
