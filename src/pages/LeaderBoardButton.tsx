import { t } from "i18next";
import "./LeaderBoardButton.css";
const LeaderBoardButton: React.FC<{
  iconSrc: string;
  // name: string;
  onHeaderIconClick: React.MouseEventHandler<HTMLDivElement>;
}> = ({
  iconSrc,
  // name,
  onHeaderIconClick,
}) => {
    return (
      <div className="leader-board-head">
        <img
          id="leader-board-image"
          alt={iconSrc}
          src={iconSrc}
          onClick={onHeaderIconClick}
        />
        <p className="leader-board-image-class">{t("Leaderboard")}</p>
      </div>

      //   {/* <p>{name}</p>
      //  </div>
    );
  };
export default LeaderBoardButton;
