import "./RewardBox.css";
import { useState, useEffect } from "react";
import RewardRive from "./RewardRive";
import { RewardBoxState } from "../../common/constants";

interface RewardBoxProps {
  onRewardClick?: () => void;
}

const RewardBox: React.FC<RewardBoxProps> = ({
  onRewardClick,
}) => {
  const [currentState, setCurrentState] = useState<RewardBoxState.IDLE | RewardBoxState.SHAKING>(RewardBoxState.SHAKING);

  useEffect(() => {
    const startAnimation = () => {
      // Start with idle for 5 seconds
      setCurrentState(RewardBoxState.IDLE);
      
      // After 5 seconds, switch to shaking for 15 seconds
      const shakeTimeout = setTimeout(() => {
        setCurrentState(RewardBoxState.SHAKING);
        
        // After 15 seconds of shaking, restart the cycle
        const restartTimeout = setTimeout(startAnimation, 5000);
        
        return () => clearTimeout(restartTimeout);
      }, 15000);
      
      return () => clearTimeout(shakeTimeout);
    };

    startAnimation();
  }, []);

  return (
    <div className="rewardBox-box-container" onClick={onRewardClick}>
      <div className="rewardBox-box-wrapper">
        <RewardRive rewardRiveState={currentState} />
      </div>
    </div>
  );
};

export default RewardBox;
