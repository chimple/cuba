import "./ScoreCard.css";
const ScoreCard: React.FC<{
  score: number;
}> = ({ score }) => {
  return (
    <div className="lesson-card-score-card">
      <div>
        {score > 25 ? (
          <img
            className="lesson-card-score-card-star"
            src="assets/icons/StarActive.svg"
          />
        ) : (
          <img
            className="lesson-card-score-card-star"
            src="assets/icons/StarGrey.svg"
          />
        )}
        {score > 50 ? (
          <img
            className="lesson-card-score-card-middle-star"
            src="assets/icons/StarActive.svg"
          />
        ) : (
          <img
            className="lesson-card-score-card-middle-star"
            src="assets/icons/StarGrey.svg"
          />
        )}
        {score > 75 ? (
          <img
            className="lesson-card-score-card-star"
            src="assets/icons/StarActive.svg"
          />
        ) : (
          <img
            className="lesson-card-score-card-star"
            src="assets/icons/StarGrey.svg"
          />
        )}
      </div>
    </div>
  );
};
export default ScoreCard;
