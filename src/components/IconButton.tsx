import './IconButton.css';
import { Util } from '../utility/util';
import { AVATARS } from '../common/constants';

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
        <img
          className={`${isProfile ? 'iconButton-profile-img' : 'img'}`}
          data-profile-avatar-anchor={isProfile ? 'true' : undefined}
          alt={name}
          src={iconSrc}
          onError={(e) => {
            if (isProfile) {
              const target = e.target as HTMLImageElement;
              const fallback = `assets/avatars/${student?.avatar ?? AVATARS[0]}.png`;
              if (
                target.src !== window.location.origin + '/' + fallback &&
                target.src !== fallback
              ) {
                target.src = fallback;
              }
            }
          }}
        />
      </div>
      <p className="child-Name">{name}</p>
    </div>
  );
};

export default IconButton;
