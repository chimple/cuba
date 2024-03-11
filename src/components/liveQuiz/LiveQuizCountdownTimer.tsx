import { FC, useEffect, useState } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Timestamp } from "firebase/firestore";
import "./LiveQuizCountdownTimer.css";
import RadialSeparators from "./RadialSeparators";
import i18n from "../../i18n";

const LiveQuizCountdownTimer: FC<{
  startsAt: Timestamp;
  onTimeOut: Function;
}> = ({ startsAt, onTimeOut }) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number>(0);

  useEffect(() => {
    const newMaxValue = Math.ceil(
      (startsAt.toDate().getTime() - new Date().getTime()) / 1000
    );
    setMaxValue(newMaxValue < 0 ? 0 : newMaxValue);

    const getRemainingTiming = () => {
      const currentTime = new Date().getTime();
      const startsAtDate = startsAt.toDate();
      const remainingMillis = Math.max(0, startsAtDate.getTime() - currentTime);
      const newRemainingTime = Math.ceil(remainingMillis / 1000);
      return newRemainingTime;
    };

    const interval = setInterval(() => {
      const newRemainingTime = getRemainingTiming();

      if (newRemainingTime === 0) {
        onTimeOut();
        clearInterval(interval);
      }
      setRemainingTime(newRemainingTime);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startsAt]);

  return (
    <div className="live-quiz-countdown-container">
      {remainingTime !== null && remainingTime >= 0 ? (
        <>
          <p className="live-quiz-countdown-header">
            {i18n.t("Please wait. Quiz will be starting soon")}
          </p>
          <div className="dashed-progress-container">
            <div className="dashed-progressbar">
              <CircularProgressbarWithChildren
                value={Math.max(0, (1 - remainingTime / maxValue) * 100) ?? 0}
                strokeWidth={10}
                styles={buildStyles({
                  strokeLinecap: "butt",
                })}
              >
                <RadialSeparators count={maxValue > 60 ? 60 : maxValue} />
                <div className="live-quiz-countdown-text">
                  <p>{remainingTime}</p>
                  <p>{i18n.t("sec").toUpperCase()}</p>
                </div>
              </CircularProgressbarWithChildren>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default LiveQuizCountdownTimer;
