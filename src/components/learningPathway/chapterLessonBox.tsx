import React from "react";

interface ChapterLessonBoxProps {
  text: string;
  containerStyle?: React.CSSProperties;
}



const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  text,
  containerStyle,
}) => {
  return (
    <div style={{
      ...containerStyle,
      position: 'fixed',
      bottom: '2vh',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: "url('/pathwayAssets/chapterLessonBox.svg')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '100% 100%'
    }}>
      <div style={{
        margin: 0,
        color: 'var(--text-color)',
        textAlign: 'center',
        fontSize: 'var(--text-sizeL)'
      }}>{text}</div>
    </div>
  );
};

export default ChapterLessonBox;
