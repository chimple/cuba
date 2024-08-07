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
          defaultSrc={"assets/icons/DefaultIcon.png"}
          webSrc={thumbnail || "assets/icons/DefaultIcon.png"}
          imageWidth={"100%"}
          imageHeight={"80%"}
        />
      </div>
      <div className="lesson-title">{t(title)}</div>
    </>
  );
};

export default LessonIcon;
