import { useState } from "react";
import AudioComponent from "./AudioButtonComponent";
import { t } from "i18next";

export default function TextBoxWithAudioButton({
  message,
  audioSrc,
  fontSize,
}) {
  console.log("TextBoxWithAudioButton message", message);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2vw",
        borderRadius: "2vh",
        // backgroundColor: "white",
        // outline: "auto",
        padding: "1vw 1vw 1vw 1vw",
        color: "black",
        // flexWrap: "wrap",
        width: "100%",
        // maxWidth: "38vw", // Set a maximum width for the container
        lineHeight: "4vh",
        // fontSize: "1vw",
      }}
    >
      <AudioComponent
        style={{
          fontSize: "4vw",
          padding: "1%",
          color: "#BDBDBD",
          backgroundColor: "white",
          borderRadius: "100%",
          border: "2px solid #BDBDBD",
          borderBottom: "4.5px solid #BDBDBD",
        }}
        message={message}
        audioSrc={audioSrc}
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
