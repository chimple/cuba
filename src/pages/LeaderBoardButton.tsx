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
    <img
      id="leader-board-image"
      alt={iconSrc}
      src={iconSrc}
      onClick={onHeaderIconClick}
    />
    //   {/* <p>{name}</p>
    //  </div>
  );
};
export default LeaderBoardButton;
