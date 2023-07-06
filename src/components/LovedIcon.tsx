import { AiTwotoneHeart } from "react-icons/ai";
import "./LovedIcon.css";

const LovedIcon: React.FC<{
  isLoved: boolean | undefined;
}> = ({ isLoved }) => {
  return (
    <div>
      {isLoved && (
        <div className="fav-icon">
          <AiTwotoneHeart
            className="fav-icon-image"
            id="fav-icon-image"
          />
        </div>
      )}
    </div>
  );
};
export default LovedIcon;
