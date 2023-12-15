import { FC } from "react";
import "./LiveQuizNavigationDots.css";

const LiveQuizNavigationDots: FC<{
  totalDots: number;
  currentDot: number;
}> = ({ totalDots, currentDot }) => {
  return (
    <div>
      {[...Array(totalDots).keys()].map((i) => {
        return (
          <div
            key={i}
            className={i >= currentDot + 1 ? "dot" : "dot active"}
          ></div>
        );
      })}
    </div>
  );
};

export default LiveQuizNavigationDots;
