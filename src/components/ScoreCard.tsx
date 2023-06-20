import "./ScoreCard.css";
const ScoreCard: React.FC<{
  score: number;
}> = ({ score }) => {
  return (
    <div>
      <div className="star-background-shadow"></div>
      <div className="lesson-card-score-card">
        <div>
          {score > 25 ? (
            <img
              className="lesson-card-score-card-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="lesson-card-score-card-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 50 ? (
            <img
              className="lesson-card-score-card-middle-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="lesson-card-score-card-middle-star"
              src="assets/icons/greystar2.svg"
            />
          )}
          {score > 75 ? (
            <img
              className="lesson-card-score-card-star"
              src="assets/icons/star2.svg"
            />
          ) : (
            <img
              className="lesson-card-score-card-star"
              src="assets/icons/greystar2.svg"
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default ScoreCard;


