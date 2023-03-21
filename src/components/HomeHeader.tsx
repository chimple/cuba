import { useTranslation } from "react-i18next";
import { HEADERLIST } from "../common/constants";
import "./HomeHeader.css";
import IconButton from "./IconButton";

const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  const { t } = useTranslation();

  return (
    <div id="home-header-icons">
      <div>
        {currentHeader == HEADERLIST.HOME ? (
          <p className="home-header-indicator">&#9679;</p>
        ) : (
          <p className="home-header-indicator">&nbsp;</p>
        )}
        <IconButton
          name={t("home")}
          iconSrc="assets/icons/HomeIcon.svg"
          onClick={() => {
            if (currentHeader != HEADERLIST.HOME) {
              onHeaderIconClick(HEADERLIST.HOME);
            }
          }}
        ></IconButton>
      </div>

      <div id="home-header-middle-icons">
        <div>
          {currentHeader == HEADERLIST.ENGLISH ? (
            <p className="home-header-indicator">&#9679;</p>
          ) : (
            <p className="home-header-indicator">&nbsp;</p>
          )}
          <IconButton
            name="English"
            iconSrc="assets/icons/EnglishIcon.svg"
            onClick={() => {
              if (currentHeader != HEADERLIST.ENGLISH) {
                onHeaderIconClick(HEADERLIST.ENGLISH);
              }
            }}
          ></IconButton>
        </div>

        <div>
          {currentHeader == HEADERLIST.MATHS ? (
            <p className="home-header-indicator">&#9679;</p>
          ) : (
            <p className="home-header-indicator">&nbsp;</p>
          )}
          <IconButton
            name="Maths"
            iconSrc="assets/icons/MathsIcon.svg"
            onClick={() => {
              if (currentHeader != HEADERLIST.MATHS) {
                onHeaderIconClick(HEADERLIST.MATHS);
              }
            }}
          ></IconButton>
        </div>
        <div id="home-header-puzzle-icon">
          <div>
            {currentHeader == HEADERLIST.PUZZLE ? (
              <p className="home-header-indicator">&#9679;</p>
            ) : (
              <p className="home-header-indicator">&nbsp;</p>
            )}
            <IconButton
              name="Digital Skills"
              iconSrc="assets/icons/DigitalSkillsIcon.svg"
              onClick={() => {
                if (currentHeader != HEADERLIST.PUZZLE) {
                  onHeaderIconClick(HEADERLIST.PUZZLE);
                }
              }}
            ></IconButton>
          </div>
        </div>
      </div>
      <div>
        <p className="home-header-indicator">&nbsp;</p>
        <IconButton
          name={t("profile")}
          iconSrc="assets/icons/Profile.svg"
          onClick={() => {
            if (currentHeader != HEADERLIST.PROFILE) {
              onHeaderIconClick(HEADERLIST.PROFILE);
            }
          }}
        ></IconButton>
      </div>
    </div>
  );
};

export default HomeHeader;
