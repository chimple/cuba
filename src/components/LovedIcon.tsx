
import "./LovedIcon.css";
import { Favorite } from "@mui/icons-material";

const LovedIcon: React.FC<{
  isLoved: boolean | undefined;
  hasChapterTitle: boolean;
}> = ({ isLoved, hasChapterTitle }) => {
  return (
    <div className="lovedicon">
      {isLoved && (
        <div className={`fav-icon ${hasChapterTitle ? 'with-chapter-title' : ''}`}>
          <Favorite className="fav-icon-image"
            id="fav-icon-image" />
        </div>
      )}
    </div>
  );
};
export default LovedIcon;
