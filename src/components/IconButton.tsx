import "./IconButton.css";
import { Util } from "../utility/util";

const IconButton: React.FC<{
  iconSrc: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isProfile?: boolean;
}> = ({ iconSrc, name, onClick, isProfile }) => {
  const student = Util.getCurrentStudent();
  const iconButtonClass = `icon-button${isProfile ? ' circular-icon' : ''}`;

  return (
    <div className={iconButtonClass} onClick={onClick}>
      <div>
        <img className={`${isProfile ? 'iconButton-profile-img' : 'img'}`} alt={iconSrc} src={iconSrc} />
      </div>
      <p className="child-Name">{name}</p>
    </div>
  );
};

export default IconButton;
