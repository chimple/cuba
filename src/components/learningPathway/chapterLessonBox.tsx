import React from "react";

interface ChapterLessonBoxProps {
  text: string;
  containerStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  text,
  containerStyle,
  textStyle,
}) => {
  return (
    <div style={containerStyle}>
      <div style={textStyle}>{text}</div>
    </div>
  );
};

export default ChapterLessonBox;
