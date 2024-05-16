import { FC } from "react";
import "./LiveQuizStudentAvatar.css";
import User from "../../models/user";
import { AVATARS, TableTypes } from "../../common/constants";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import { Util } from "../../utility/util";
import { t } from "i18next";

const LiveQuizStudentAvatar: FC<{
  student: TableTypes<"user">;
  score: number;
  percentage?: number;
  isCorrect?: boolean;
}> = ({ student, score, percentage, isCorrect }) => {
  return (
    <div className="live-quiz-student-avatar">
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
            style={{ width: "89%", height: "100%" }}
          />
        )}
      </div>
      {student && student.id === Util.getCurrentStudent()?.id ? (
        <p className="live-quiz-student-Name">{t("Me")}</p>
      ) : (
        <p className="live-quiz-student-Name">{student.name}</p>
      )}

      <p className="live-quiz-student-score">{Math.round(score)}</p>
    </div>
  );
};
export default LiveQuizStudentAvatar;
