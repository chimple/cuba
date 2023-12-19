import { FC } from "react";
import "./LiveQuizStudentAvatar.css";
import User from "../../models/user";
import { AVATARS } from "../../common/constants";

const LiveQuizStudentAvatar: FC<{ student: User; score: number }> = ({
  student,
  score,
}) => {
  return (
    <div className="live-quiz-student-avatar">
      <p className="live-quiz-student-Name">{student.name}</p>
      <img
        className="live-quiz-student-image"
        src={"assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"}
        alt=""
      />
      <p className="live-quiz-student-score">{score}</p>
    </div>
  );
};
export default LiveQuizStudentAvatar;
