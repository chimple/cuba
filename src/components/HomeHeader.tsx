import { HEADERLIST } from "../common/constants";
import "./HomeHeader.css";
import IconButton from "./IconButton";

const HomeHeader: React.FC<{
  currentHeader: string;
  onHeaderIconClick: Function;
}> = ({ currentHeader, onHeaderIconClick }) => {
  return (
    <div id="home-header-icons">
      <IconButton
        name="Home"
        iconSrc="/assets/icons/HomeIcon.svg"
        onClick={() => {
          if (currentHeader != HEADERLIST.HOME) {
            onHeaderIconClick(HEADERLIST.HOME);
            console.log("Home button clicked", HEADERLIST.HOME);
          }
        }}
      ></IconButton>

      <div id="home-header-middle-icons">
        <IconButton
          name="English"
          iconSrc="/assets/icons/EnglishIcon.svg"
          onClick={() => {
            if (currentHeader != HEADERLIST.ENGLISH) {
              onHeaderIconClick(HEADERLIST.ENGLISH);
              console.log("English button clicked", currentHeader);
            }
          }}
        ></IconButton>
        <IconButton
          name="Maths"
          iconSrc="/assets/icons/MathsIcon.svg"
          onClick={() => {
            if (currentHeader != HEADERLIST.MATHS) {
              onHeaderIconClick(HEADERLIST.MATHS);
              console.log("Maths button clicked", currentHeader);
            }
          }}
        ></IconButton>
        <div id="home-header-puzzle-icon">
          <IconButton
            name="Digital Skills"
            iconSrc="/assets/icons/DigitalSkillsIcon.svg"
            onClick={() => {
              if (currentHeader != HEADERLIST.PUZZLE) {
                onHeaderIconClick(HEADERLIST.PUZZLE);
                console.log("PUZZLE button clicked", HEADERLIST.PROFILE);
              }
            }}
          ></IconButton>
        </div>
      </div>
      <IconButton
        name="Profile"
        iconSrc="/assets/icons/profile.png"
        onClick={() => {
          if (currentHeader != HEADERLIST.PROFILE) {
            onHeaderIconClick(HEADERLIST.PROFILE);
            console.log("Profile button clicked", HEADERLIST.PROFILE);
          }
        }}
      ></IconButton>
    </div>
  );
};

export default HomeHeader;
