import React, { useEffect, useRef, useState } from "react";
import "./TressureBox.css";

interface TressureBoxProps {
  startNumber: number;
  endNumber: number;
}

const TressureBox: React.FC<TressureBoxProps> = ({
  startNumber,
  endNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentNumber, setCurrentNumber] = useState<number>(startNumber);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfettiVisible, setIsConfettiVisible] = useState(false);

  useEffect(() => {
    setCurrentNumber(startNumber);
  }, [startNumber]);

  useEffect(() => {
    if (startNumber === endNumber) return;

    setIsUpdating(true);
    setIsConfettiVisible(true);

    let current = startNumber;
    const direction = endNumber > startNumber ? 1 : -1;
    const interval = setInterval(() => {
      current += direction;
      setCurrentNumber(current);

      if (current === endNumber) {
        clearInterval(interval);
        setIsConfettiVisible(false);
        setIsUpdating(false);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [startNumber, endNumber]);
  useEffect(() => {
    const itemHeight = 50;
    const container = containerRef.current;
    if (!container) return;

    const targetScrollTop =
      (currentNumber - minNum) * itemHeight -
      container.clientHeight / 2 +
      itemHeight / 2;

    const start = container.scrollTop;
    const distance = targetScrollTop - start;
    const duration = 500;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + distance * progress;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [currentNumber]);

  const minNum = Math.min(startNumber, endNumber);
  const maxNum = Math.max(startNumber, endNumber);
  const items = Array.from({ length: maxNum - minNum + 1 }, (_, i) => {
    const number = minNum + i;
    return (
      <div
        key={number}
        className={`scroll-item ${number === currentNumber ? "highlight" : ""}`}
      >
        {number}
      </div>
    );
  });

  return (
    <div className="treasure-box-container">
      <div className="treasure-box-wrapper">
        {isConfettiVisible ? (
          <img
            src={"pathwayAssets/Treasure box animation.gif"}
            alt="Confetti Treasure Box"
            className="treasure-box-gif"
          />
        ) : (
          <img
            src={"pathwayAssets/Treasure Box.svg"}
            alt="Treasure Box"
            className="treasure-box-svg"
          />
        )}

        {isUpdating ? (
          <div className="scroll-container" ref={containerRef}>
            {items}
          </div>
        ) : (
          <div className="number-inside-box">{currentNumber}</div>
        )}
      </div>
    </div>
  );
};

export default TressureBox;
