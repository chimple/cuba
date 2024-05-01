import { FC } from "react";
import SelectIconImage from "../../displaySubjects/SelectIconImage";
import "./DisplayLesson.css";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { t } from "i18next";
interface LessonIconProps {
  id: string;
  cocosSubjectCode: string;
  thumbnail: string;
  selected: boolean;
  title: string;
}
const LessonIcon: FC<LessonIconProps> = ({
  id,
  cocosSubjectCode,
  thumbnail,
  selected,
  title,
}) => {
  return (
    <>
      <div className="lesson-icon">
        {selected ? (
          <div className="lesson-select-icon">
            <BsFillCheckCircleFill color={"grey"} size="2vh" />
          </div>
        ) : null}
        <SelectIconImage
          localSrc={"courses/" + cocosSubjectCode + "/icons/" + id + ".webp"}
          defaultSrc={
            "https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/2023-05-17%2009%3A19%3A10.323?alt=media&token=1eb327b1-95f4-46c3-99d3-23cf8c8a62f9"
          }
          webSrc={thumbnail}
        />
      </div>
      <div className="lesson-title">{t(title)}</div>
    </>
  );
};

export default LessonIcon;
