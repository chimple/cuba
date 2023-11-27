import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { useState, useEffect } from "react";

export function useAudioPlayer(audioSrc: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (audio) {
      audio.addEventListener("ended", () => setPlaying(false));
      return () => {
        audio.removeEventListener("ended", () => setPlaying(false));
      };
    }
  }, [audio]);

  const playAudio = () => {
    const newAudio = new Audio(audioSrc);
    newAudio.onloadedmetadata = () => {
      console.log("Audio duration: ", newAudio.duration);
      setPlaying(true);
      if (!playing) {
        newAudio.play();
        console.log("Audio is playing: ", audioSrc);
      }
    };

    newAudio.load();
    setAudio(newAudio);
  };
  const pauseAudio = () => {
    if (audio && !playing) {
      audio.pause();
    }
  };

  return { playAudio, playing, pauseAudio };
}

export function useTtsAudioPlayer(audioText: string, audioLang: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  const speak = async () => {
    try {
      console.log("speak method called ", playing, !playing);

      setPlaying(true);
      if (!playing) {
        await TextToSpeech.speak({
          text: audioText, //"नमस्ते चिम्पल, आप सभी का स्वागत है",
          lang: audioLang, //"hi-IN",
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: "ambient",
        }).then(() => {
          setPlaying(false);
        });
        console.log("Audio is playing: ", audioText);
      }
    } catch (error) {
      console.log("TTS speech failed ", playing, error);
    }
  };

  const stop = async () => {
    if (!playing) {
      await TextToSpeech.stop();
    }
  };

  const getSupportedLanguages = async () => {
    const lang = await TextToSpeech.getSupportedLanguages();
    return lang.languages;
  };

  const getSupportedVoices = async () => {
    const voices = await TextToSpeech.getSupportedVoices();
    return voices.voices;
  };

  const isLanguageSupported = async (lang: string) => {
    const isSupported = await TextToSpeech.isLanguageSupported({ lang });
    return isSupported.supported;
  };

  return {
    speak,
    stop,
    playing,
    getSupportedLanguages,
    getSupportedVoices,
    isLanguageSupported,
  };
}
