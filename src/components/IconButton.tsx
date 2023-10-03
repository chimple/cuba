import "./IconButton.css";
import { Util } from "../utility/util";

const IconButton: React.FC<{
  iconSrc: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isGrayscale: boolean;
}> = ({ iconSrc, name, onClick, isGrayscale }) => {
  const student = Util.getCurrentStudent();
  const iconButtonClass = `icon-button${iconSrc === student?.image ? ' circular-icon' : ''}${isGrayscale ? ' grayscale' : ''}`;

  return (
    <div className={iconButtonClass} onClick={onClick}>
      <div>
        <img className="img" alt={iconSrc} src={iconSrc} />
      </div>
      <p className="child-Name">{name}</p>
    </div>
  );
};

export default IconButton;
