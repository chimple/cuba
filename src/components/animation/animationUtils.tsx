import { useState, useEffect } from 'react';

export function useAudioPlayer(audioSrc: string) {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState<boolean>(false);

    useEffect(() => {
        if (audio) {
            audio.addEventListener('ended', () => setPlaying(false));
            return () => {
                audio.removeEventListener('ended', () => setPlaying(false));
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
    }

    return { playAudio, playing , pauseAudio};
}
