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
          gap: "2vw",
          borderRadius: "2vh",
          // backgroundColor: "white",
          // outline: "auto",
          padding: "1vw 1vw",
          color:"black",
          // flexWrap: "wrap", 
          width:"100%",
          maxWidth: "38vw", // Set a maximum width for the container
          lineHeight: "4vh",
          // fontSize: "1vw",
        }}
      >
        <AudioComponent
          style={{
            fontsize: "10vh",
          }}
          audioSrc={"assets/audios/my_name_is_chimple.mp3"}
          // audioSrc={"https://samplelib.com/lib/preview/mp3/sample-6s.mp3"}
        ></AudioComponent>
        <p
        style={{
            fontSize: "var(--text-size)",

        }}
        >{message}</p>
      </div>
    </div>
  );
}
