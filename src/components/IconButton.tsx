import "./IconButton.css";
const IconButton: React.FC<{
  iconSrc: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}> = ({ iconSrc, name, onClick }) => {
  return (
    <div className="icon-button" onClick={onClick}>
      <div>
        <img className="img" alt={iconSrc} src={iconSrc} />
      </div>
      <p className="student-name">{name}</p>
    </div>
  );
};
export default IconButton;
