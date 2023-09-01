import { useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";
import ChimpleAvatarCharacterComponent from "./ChimpleAvatarCharacterComponent";
import AudioComponent from "./AudioButtonComponent";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";

export default function ChimpleAvatarPage({ style }) {
  return (
    <div style={style}>
      <ChimpleAvatarCharacterComponent
        style={{
          height: "50vh",
          width: "25vw",
        }}
      ></ChimpleAvatarCharacterComponent>
      <div
        style={{
          height: "50vh",
          width: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <TextBoxWithAudioButton
          message={"Hi! welcome to Chimple"}
        ></TextBoxWithAudioButton>
        <AvatarImageOption
          imageWidth={80}
          imageSrc={
            "https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"
          }
        ></AvatarImageOption>
        <RectangularTextButton
          buttonWidth={20}
          buttonHeight={5}
          text={"button"}
          fontSize={3}
          onHeaderIconClick={() => {
            console.log("Text Button clicked ");
          }}
        ></RectangularTextButton>
      </div>
    </div>
  );
}
