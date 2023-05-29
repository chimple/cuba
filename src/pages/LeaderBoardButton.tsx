import "./LeaderBoardButton.css";
const LeaderBoardButton: React.FC<{
  iconSrc: string;
  // rectangularIcon: any;
  name: string;
  isButtonEnable: boolean;
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
    //   {rectangularIcon} *
    //  </div>
  );
};
export default LeaderBoardButton;
