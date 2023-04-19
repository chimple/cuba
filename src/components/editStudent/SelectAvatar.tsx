import { FC } from "react";
import { AVATARS } from "../../common/constants";
import "./SelectAvatar.css";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { t } from "i18next";

const SelectAvatar: FC<{ avatar: string; onAvatarChange: (avatar: string) => void }> = ({
  avatar,
  onAvatarChange,
}) => {
  return (
    <div>
      <div className="avatar-header">
        <div className="avatar-title">{t("Select Kid Avatar:")}</div>
        <div className="avatar-container">
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
                    color="green"
                    className="avatar-check"
                    size="4vh"
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
