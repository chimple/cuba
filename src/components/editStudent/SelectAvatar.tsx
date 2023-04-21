import { FC } from "react";
import { AVATARS } from "../../common/constants";
import "./SelectAvatar.css";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { t } from "i18next";

const SelectAvatar: FC<{ avatar: string|undefined; onAvatarChange: (avatar: string) => void }> = ({
  avatar,
  onAvatarChange,
}) => {
  return (
    <div>
      <div className="avatar-header">
        <div className="avatar-title">{t("Select Child Avatar:")}</div>
        <div className="avatar-container1">
          {AVATARS.map((_avatar: string) => {
            return (
              <div
                onClick={() => onAvatarChange(_avatar)}
                className="avatar-button"
                key={_avatar}
              >
                <img
                  className="avatar-img"
                  src={"assets/avatars/" + _avatar + ".png"}
                  alt=""
                />
                {avatar === _avatar && (
                  <BsFillCheckCircleFill
                    className="avatar-check"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default SelectAvatar;
