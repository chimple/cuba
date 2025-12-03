import { useRef } from "react";
import "./DailyRewardModal.css";
import { t } from "i18next";
import RewardRive from "./RewardRive";
import { RewardBoxState } from "../../common/constants";

interface RewardModalProps {
  text: string;
  onClose: () => void;
  onPlay: () => void;
}

const DailyRewardModal: React.FC<RewardModalProps> = ({
  text,
  onClose,
  onPlay,
}) => {

  const ref = useRef<HTMLDivElement>(null);

  // Close modal when clicking on overlay (outside modal content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && (e.target as HTMLElement).classList.contains('RewardModal-overlay')) {
      e.stopPropagation();
      onClose();
    }
  };
  
  return (
    <div className="RewardModal-overlay" onClick={handleOverlayClick}>
      <div className="RewardModal-content" ref={ref} >
        <button className="RewardModal-close" onClick={onClose}>
          <img src="pathwayAssets/menuCross.svg" alt="close-icon" />
        </button>

        <div>
          <div className="RewardModal-reward-box-container">
            <RewardRive rewardRiveState={RewardBoxState.SHAKING} />
          </div>
          <p className="RewardModal-text">{text}</p>
          <button className="RewardModal-OK-button" onClick={onPlay}>
            <span className="RewardModal-ok-text">{t("Let's Play")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyRewardModal;
