import "./ScoreCardStarIcons.css";

const ScoreCardStarIcons: React.FC<{
  score: number;
}> = ({ score }) => {
  return (
    <div>
      <div className="stars-icon">
        <div className="star-icon-image">
          {score > 25 ? (
            <img
              className="score-card-first-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="score-card-first-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 50 ? (
            <img
              className="score-card-middle-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="score-card-middle-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 75 ? (
            <img
              className="score-card-first-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="score-card-first-star"
              src="assets/icons/greystar2.svg"
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default ScoreCardStarIcons;
