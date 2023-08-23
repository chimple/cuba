import { useEffect, useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";

export default function AudioComponenet({ style, audioSrc }) {
  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, []);

  const [audio, setAudio] = useState<HTMLAudioElement>(new Audio(audioSrc));

  const [playing, setPlaying] = useState(false);

  const loadAudio = (audioSrc) => {
    return new Audio(audioSrc); // Audio can pick from network and locale
  };

  return (
    <HiSpeakerWave
      style={style}
      onClick={() => {
        console.log("Play Audio File", audioSrc);
        setAudio(loadAudio(audioSrc));
        setPlaying(true);
        if (!playing) {
          audio.play();
          console.log("Audio is playing ", audioSrc);
        }
      }}
    ></HiSpeakerWave>
  );
}
