import React from "react";
import QRCode from "qrcode.react";
import SelectIconImage from "../../displaySubjects/SelectIconImage";

interface ChapterIconProps {}

const ChapterIcon: React.FC<ChapterIconProps> = ({}) => {
  return (
    <div onClick={() => {}} className="chapter-button">
      <div className="chapter-icon-container">
        <div className="library-chapter-icon">
          <SelectIconImage
            localSrc={`courses/en/icons/en00.webp`}
            defaultSrc={"assets/icons/DefaultIcon.png"}
            webSrc={"assets/icons/DefaultIcon.png"}
          />
        </div>
        <div>{"jahsj"}</div>
        <div>{"jJJSkaj"}</div>
      </div>
    </div>
  );
};

export default ChapterIcon;
