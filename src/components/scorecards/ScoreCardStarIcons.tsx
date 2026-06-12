import './ScoreCardStarIcons.css';

const ScoreCardStarIcons: React.FC<{
  score: number;
}> = ({ score }) => {
  return (
    <div>
      <div id="stars-icon" className="stars-icon">
        <div id="star-icon-image" className="star-icon-image">
          {score > 25 ? (
            <img
              alt=""
              className="score-card-first-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              alt=""
              className="score-card-first-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 50 ? (
            <img
              alt=""
              className="score-card-middle-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              alt=""
              className="score-card-middle-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 75 ? (
            <img
              alt=""
              className="score-card-first-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              alt=""
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
