import './IconButton.css';
import { Util } from '../utility/util';
import { AVATARS } from '../common/constants';
import { getTrackableProps, type TrackableId } from '../analytics/trackable';

const IconButton: React.FC<{
  iconSrc: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isProfile?: boolean;
  trackableId?: TrackableId;
}> = ({ iconSrc, name, onClick, isProfile, trackableId }) => {
  const student = Util.getCurrentStudent();
  const iconButtonClass = `icon-button${isProfile ? ' circular-icon' : ''}`;

  return (
    <div
      className={iconButtonClass}
      onClick={onClick}
      {...(trackableId ? getTrackableProps(trackableId) : {})}
    >
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
