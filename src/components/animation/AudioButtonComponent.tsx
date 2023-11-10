import React from 'react';
import { useAudioPlayer } from './animationUtils';
import { PiSpeakerHighBold } from 'react-icons/pi';

interface AudioButtonProps {
  style: React.CSSProperties;
  audioSrc: string;
}

function AudioButtonComponent({ style, audioSrc }: AudioButtonProps) {
  const { playAudio, playing } = useAudioPlayer(audioSrc);

  return (
    <div>
      <PiSpeakerHighBold style={style} onClick={playAudio} />
    </div>
  );
}

export default AudioButtonComponent;
