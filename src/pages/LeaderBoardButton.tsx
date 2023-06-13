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
    <div>
    <img
      id="leader-board-image"
      alt={iconSrc}
      src={iconSrc}
      onClick={onHeaderIconClick}
    />
    <p className="leader-board-image-class">Lederboard</p>
    </div>
 
    //   {/* <p>{name}</p>
    //  </div>
  );
};
export default LeaderBoardButton;
