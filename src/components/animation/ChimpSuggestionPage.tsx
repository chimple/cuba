import { useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";
import RiveCharacter from "./RiveCharacter";
import AudioComponent from "./AudioComponent";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";

export default function ChimpSuggestionPage({ style }) {
  return (
    <div style={style}>
      <RiveCharacter
        style={{
          height: "50vh",
          width: "25vw",
        }}
      ></RiveCharacter>
      <TextBoxWithAudioButton
        message={"Hi! welcome to Chimple"}
      ></TextBoxWithAudioButton>
    </div>
  );
}
