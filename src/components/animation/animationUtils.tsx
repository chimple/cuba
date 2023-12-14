import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { useState, useEffect } from "react";
import { Util } from "../../utility/util";
import { LANGUAGE } from "../../common/constants";

export function useAudioPlayer(audioSrc: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (audio) {
      audio.addEventListener("ended", () => setIsAudioPlaying(false));
      return () => {
        audio.removeEventListener("ended", () => setIsAudioPlaying(false));
      };
    }
  }, [audio]);

  const playAudio = () => {
    const newAudio = new Audio(audioSrc);
    newAudio.onloadedmetadata = () => {
      console.log("Audio duration: ", newAudio.duration);
      setIsAudioPlaying(true);
      if (!isAudioPlaying) {
        newAudio.play();
        console.log("Audio is playing: ", audioSrc);
      }
    };

    newAudio.load();
    setAudio(newAudio);
  };
  const pauseAudio = () => {
    if (audio && !isAudioPlaying) {
      audio.pause();
    }
  };

  return { playAudio, isAudioPlaying, pauseAudio };
}

export function useTtsAudioPlayer(
  audioText: string,
  audioLang: string = "en-IN"
) {
  const language = localStorage.getItem(LANGUAGE) || "en";
  audioLang = language + "-IN";
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);

  const speak = async () => {
    try {
      console.log("speak method called ", isTtsPlaying, !isTtsPlaying);

      setIsTtsPlaying(true);
      if (!isTtsPlaying) {
        const isSupported = await isLanguageSupported(audioLang);
        console.log(
          "text: audioText,lang: audioLang, //",
          audioText,
          audioLang,
          isSupported
        );
        if (!isSupported) {
          alert(audioLang + " Language is not supported for you device");
        }

        await TextToSpeech.speak({
          text: audioText, //"नमस्ते चिम्पल, आप सभी का स्वागत है",
          lang: audioLang, //"hi-IN",
          rate: 0.8,
          pitch: 1.0,
          volume: 1.0,
          category: "ambient",
        }).then(() => {
          setIsTtsPlaying(false);
        });
        console.log("Audio is playing: ", audioText);
      }
    } catch (error) {
      console.log("TTS speech failed ", isTtsPlaying, error);
    }
  };

  const stop = async () => {
    if (!isTtsPlaying) {
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
    isTtsPlaying,
    getSupportedLanguages,
    getSupportedVoices,
    isLanguageSupported,
  };
}
