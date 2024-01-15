import { FC } from "react";
import "./LiveQuizStudentAvatar.css";
import User from "../../models/user";
import { AVATARS } from "../../common/constants";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";

const LiveQuizStudentAvatar: FC<{
  student: User;
  score: number;
  percentage?: number;
  isCorrect?: boolean;
}> = ({ student, score, percentage, isCorrect }) => {
  return (
    <div className="live-quiz-student-avatar">
      <p className="live-quiz-student-Name">{student.name}</p>
      <div>
        {percentage || isCorrect != null ? (
          <CircularProgressbarWithChildren
            value={isCorrect == null ? percentage ?? 0 : 100}
            strokeWidth={5}
            styles={buildStyles({
              pathColor:
                isCorrect == null ? undefined : isCorrect ? "green" : "red",
            })}
          >
            <img
              className="live-quiz-student-image"
              src={"assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"}
              alt=""
            />
          </CircularProgressbarWithChildren>
        ) : (
          <img
            className="live-quiz-student-image"
            src={"assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"}
            alt=""
          />
        )}
      </div>

      <p className="live-quiz-student-score">{Math.round(score)}</p>
    </div>
  );
};
export default LiveQuizStudentAvatar;
