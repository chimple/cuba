import { useState } from "react";
import AudioComponent from "./AudioButtonComponent";

export default function TextBoxWithAudioButton({ message, fontSize }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2vw",
        borderRadius: "2vh",
        // backgroundColor: "white",
        // outline: "auto",
        padding: "0vw 1vw 1vw 1vw",
        color: "black",
        // flexWrap: "wrap",
        width: "100%",
        // maxWidth: "38vw", // Set a maximum width for the container
        // lineHeight: "4vh",
        // fontSize: "1vw",
      }}
    >
      <AudioComponent
        style={{
          fontSize: "5vw",
          padding: "1%",
          color: "white",
          backgroundColor: "lightgray",
          borderRadius: "100%",
        }}
        audioSrc={"assets/audios/my_name_is_chimple.mp3"}
        // audioSrc={"https://samplelib.com/lib/preview/mp3/sample-6s.mp3"}
      ></AudioComponent>
      <p
        style={{
          fontSize: fontSize,
        }}
      >
        {message}
      </p>
    </div>
  );
}
