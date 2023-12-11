import { useState } from "react";
import AudioComponent from "./AudioButtonComponent";
import { t } from "i18next";

interface TextBoxWithAudioButtonProps {
  fontSize: string;
  onClick?: () => void; // Define the prop for the callback function
  message: string;
}
export default function TextBoxWithAudioButton({ message, fontSize, onClick }) {
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
          color: "#474747",
          backgroundColor: "white",
          borderRadius: "100%",
          border: "2px solid #474747",
          borderBottom: "4.5px solid #474747",
        }}
        onClick={onClick}
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
