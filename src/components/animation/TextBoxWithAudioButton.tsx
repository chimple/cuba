import { useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";
import AudioComponent from "./AudioButtonComponent";

export default function TextBoxWithAudioButton({ message }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5vw",
          borderRadius: "2vh",
          backgroundColor: "white",
          outline: "auto",
          padding: "1vw 3vw",
        }}
      >
        <AudioComponent
          style={{
            fontsize: "10vh",
          }}
          audioSrc={"assets/audios/my_name_is_chimple.mp3"}
          // audioSrc={"https://samplelib.com/lib/preview/mp3/sample-6s.mp3"}
        ></AudioComponent>
        <p>{message}</p>
      </div>
    </div>
  );
}
