import { FC, useState } from "react";
import AssignButton from "./AssignButton";
import RecommendedAssignment from "./RecommendedAssignment";
import Lesson from "../../../models/lesson";

const RecommendedTab: FC<{
  lessons: Lesson[];
}> = ({ lessons }) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingLeft: "2px",
        paddingRight: "2px",
      }}
    >
      {stage === STAGES.SUBJECTS && lessons && (
        <div>
          <RecommendedAssignment infoText="These are the recommended assignments based on the previous assignments" />
        </div>
      )}

      <AssignButton disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default RecommendedTab;
