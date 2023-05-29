const LeaderBoardButton: React.FC<{
  buttonWidth: number;
  buttonHeight: number;
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
      id=""
      style={{
        width: "auto",
        height: 12 + "vh",
        marginBottom: 100 + "vh",
      }}
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
