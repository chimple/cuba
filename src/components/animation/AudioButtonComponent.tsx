import React from "react";
import { useAudioPlayer, useTtsAudioPlayer } from "./animationUtils";
import { PiSpeakerHighBold } from "react-icons/pi";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";

interface AudioButtonProps {
  style: React.CSSProperties;
  message: string;
  audioSrc: string | undefined;
}

function AudioButtonComponent({ style, message, audioSrc }: AudioButtonProps) {
  const {
    speak,
    stop,
    isTtsPlaying,
    getSupportedLanguages,
    getSupportedVoices,
    isLanguageSupported,
  } = useTtsAudioPlayer(message);

  const { playAudio, isAudioPlaying, pauseAudio } = useAudioPlayer(
    audioSrc || ""
  );

  return (
    <div>
      <PiSpeakerHighBold
        style={style}
        onClick={async () => {
          console.log("if (audioSrc) {", audioSrc);

          if (audioSrc) {
            console.log("normal audio is playing", !isAudioPlaying);

            if (!isAudioPlaying) {
              await playAudio();
            }
          } else {
            if (!isTtsPlaying) {
              await speak();
            }
          }
        }}
      />
    </div>
  );
}

export default AudioButtonComponent;
