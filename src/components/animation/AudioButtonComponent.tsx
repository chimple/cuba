import React from "react";
import { useAudioPlayer, useTtsAudioPlayer } from "./animationUtils";
import { PiSpeakerHighBold } from "react-icons/pi";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";

interface AudioButtonProps {
  style: React.CSSProperties;
  audioSrc: string;
}

function AudioButtonComponent({ style, audioSrc }: AudioButtonProps) {
  // const { playAudio, playing } = useAudioPlayer(audioSrc);
  const audioText = "नमस्ते! चिम्पल में आपका स्वागत है";
  // const audioText = "Hi! welcome to Chimple";
  const {
    speak,
    stop,
    playing,
    getSupportedLanguages,
    getSupportedVoices,
    isLanguageSupported,
  } = useTtsAudioPlayer(audioText, "hi-IN");

  return (
    <div>
      <PiSpeakerHighBold
        style={style}
        onClick={async () => {
          if (!playing) {
            if (Capacitor.isNativePlatform()) {
              const inst = await TextToSpeech.openInstall();
              console.log("await TextToSpeech.openInstall(); =", inst);
              alert(
                "await TextToSpeech.openInstall(); =" + JSON.stringify(inst)
              );
            }
            const languages = await getSupportedLanguages();
            console.log("await getSupportedLanguages() =", languages);
            const voices = await getSupportedVoices();
            console.log("const voices = await getSupportedVoices();", voices);
            const isSupported = await isLanguageSupported("kn-IN");
            console.log(
              "const isSupported = await isLanguageSupported(kn-IN);",
              isSupported
            );
            // alert("const languages =" + JSON.stringify(languages));
            // alert(
            //   "const languages.languages =" + JSON.stringify(languages.languages)
            // );
            await speak();
          }
        }}
      />
    </div>
  );
}

export default AudioButtonComponent;
