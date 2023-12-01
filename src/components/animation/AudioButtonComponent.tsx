import React from "react";
import { useAudioPlayer, useTtsAudioPlayer } from "./animationUtils";
import { PiSpeakerHighBold } from "react-icons/pi";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";
interface AudioButtonProps {
  style: React.CSSProperties;
  onClick?: () => void;
}
function AudioButtonComponent({ style, onClick }: AudioButtonProps) {
  return (
    <div>
      <PiSpeakerHighBold style={style} onClick={onClick} />
    </div>
  );
}
export default AudioButtonComponent;
