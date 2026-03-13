import { FC } from "react";
import "./LiveQuizNavigationDots.css";

const LiveQuizNavigationDots: FC<{
  totalDots: number;
  currentDot: number;
  correctAnswers: number[];
  selectedAnswers: number[];
}> = ({ totalDots, currentDot, correctAnswers, selectedAnswers }) => {
  return (
    <div className="live-quiz-navigation-dots">
      {[...Array(totalDots).keys()].map((i) => {
        let dotClass = "dot";
        if (i < currentDot) {
          if (correctAnswers[i] === selectedAnswers[i]) {
            dotClass += " correct";
          } else {
            dotClass += " incorrect";
          }
        } else if (i === currentDot) {
          dotClass += " actived";
        }
        return <div key={i} className={dotClass}></div>;
      })}
    </div>
  );
};

export default LiveQuizNavigationDots;
