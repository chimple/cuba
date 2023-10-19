import { AiTwotoneHeart } from "react-icons/ai";
import "./LovedIcon.css";

const LovedIcon: React.FC<{
  isLoved: boolean | undefined;
  hasChapterTitle: boolean;
}> = ({ isLoved, hasChapterTitle }) => {
  return (
    <div className="lovedicon">
      {isLoved && (
        <div className={`fav-icon ${hasChapterTitle ? 'with-chapter-title' : ''}`}>
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
