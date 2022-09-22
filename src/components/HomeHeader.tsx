import { HEADERLIST } from "../common/constants";
import "./HomeHeader.css";

const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  return (
    <div id="home-header">
      <div
        id="home-header-home-icon"
        onClick={() => {
          if (currentHeader != HEADERLIST.HOME) {
            onHeaderIconClick(HEADERLIST.HOME);
            console.log("Home button clicked", HEADERLIST.HOME);
          }
        }}
      >
        <img alt="HomeIcon" src="/assets/icons/HomeIcon.svg" />
        <p>Home</p>
      </div>
      <div id="home-header-middle-icons">
        <div
          onClick={() => {
            if (currentHeader != HEADERLIST.ENGLISH) {
              onHeaderIconClick(HEADERLIST.ENGLISH);
              console.log("English button clicked", currentHeader);
            }
          }}
        >
          <img alt="EnglishIcon" src="/assets/icons/EnglishIcon.svg" />
          <p>English</p>
        </div>
        <div
          onClick={() => {
            if (currentHeader != HEADERLIST.MATHS) {
              onHeaderIconClick(HEADERLIST.MATHS);
              console.log("Maths button clicked", currentHeader);
            }
          }}
        >
          <img alt="MathsIcon" src="/assets/icons/MathsIcon.svg" />
          <p>Maths</p>
        </div>
        <div
          onClick={() => {
            if (currentHeader != HEADERLIST.PUZZLE) {
              onHeaderIconClick(HEADERLIST.PUZZLE);
              console.log("Puzzle button clicked", currentHeader);
            }
          }}
        >
          <img
            alt="DigitalSkillsIcon"
            src="/assets/icons/DigitalSkillsIcon.svg"
          />
          <p>Digital Skills</p>
        </div>
      </div>
      <div
        id="home-header-profile-icon"
        onClick={() => {
          if (currentHeader != HEADERLIST.PROFILE) {
            onHeaderIconClick(HEADERLIST.PROFILE);
            console.log("Profile button clicked", HEADERLIST.PROFILE);
          }
        }}
      >
        <img alt="HomeIcon" src="/assets/icons/profile.png" />
        <p>Profile</p>
      </div>
    </div>
  );
};

export default HomeHeader;
