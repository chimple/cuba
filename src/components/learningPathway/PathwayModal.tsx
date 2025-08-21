import React, { useEffect, useRef, useState } from "react";
import "./PathwayModal.css";
import { t } from "i18next";

interface PathwayModalProps {
  text: string;
  onClose: () => void;
  animate?: boolean;
  onConfirm: () => void;
}

const PathwayModal: React.FC<PathwayModalProps> = ({
  text,
  onClose,
  animate = false,
  onConfirm,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // const [isClosing, setIsClosing] = useState(false);

  // const handleOutsideClick = (event: MouseEvent) => {
  //   // clicked outside the modal
  //   if (ref.current && !ref.current.contains(event.target as Node)) {
  //     if (animate) {
  //       // reward popup => slide out first
  //       setIsClosing(true);
  //     } else {
  //       // inactive popup => close immediately
  //       onClose();
  //     }
  //   }
  // };

  // always attach the listener
  // useEffect(() => {
  //   document.addEventListener("mousedown", handleOutsideClick);
  //   return () => {
  //     document.removeEventListener("mousedown", handleOutsideClick);
  //   };
  // }, []);

  // when slide-out animation ends, finally close
  // useEffect(() => {
  //   if (!isClosing) return;
  //   const node = ref.current!;
  //   const onEnd = () => onClose();
  //   node.addEventListener("animationend", onEnd);
  //   return () => {
  //     node.removeEventListener("animationend", onEnd);
  //   };
  // }, [isClosing, onClose, onConfirm]);

  // const cls =
  //   "PathwayModal-content" +
  //   (animate && !isClosing ? " slide-in" : "") +
  //   (isClosing ? " slide-out" : "");

  // const modalHeight = animate ? "19.5vh" : "32vh";

  return (
    <div className="PathwayModal-overlay">
      <div className='PathwayModal-content' ref={ref}>
          <button className="PathwayModal-close" onClick={onClose}>
            <img src='pathwayAssets/menuCross.svg' alt="close-icon" />
          </button>
          
          <div>
            <p className="PathwayModal-text">{text}</p>
            <button
              className="learning-pathway-OK-button"
              onClick={onConfirm}
            >
              <span className="learning-pathway-ok-text">{t("OK")}</span>
            </button>
          </div>
      </div>
       
    </div>
  );
};

export default PathwayModal;
