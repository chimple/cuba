// WindowsSpeech.ts

import { TextToSpeech } from "@capacitor-community/text-to-speech";

export class SpeechSynthesisUtterance {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;

  // Event handlers (optional, matching the usual Web Speech pattern)
  onstart?: () => void;
  onend?: () => void;
  onerror?: (err: any) => void;

  constructor(text: string) {
    this.text = text;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
  }
}

export class SpeechSynthesis {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // SPEAK
  speak(utterance: SpeechSynthesisUtterance): void {
    if (this.isSpeaking) {
      // Optionally queue the utterance or just cancel the current one
      this.cancel();
    }

    this.isSpeaking = true;
    this.currentUtterance = utterance;

    // Fire onstart if available
    utterance.onstart?.();

    // Call the Capacitor TTS plugin
    TextToSpeech.speak({
      text: utterance.text,
      lang: utterance.lang ?? "en-US",
      rate: utterance.rate ?? 1.0,    // 0.0 ~ 1.0 in most TTS engines, see docs
      pitch: utterance.pitch ?? 1.0,  // 0.0 ~ 1.0
      volume: utterance.volume ?? 1.0 // 0.0 ~ 1.0
      // 'category' or other options are also possible 
    })
      .then(() => {
        // Once TTS finishes successfully:
        this.isSpeaking = false;
        utterance.onend?.();
      })
      .catch((err) => {
        // If TTS fails or is interrupted:
        this.isSpeaking = false;
        utterance.onerror?.(err);
      });
  }

  // CANCEL / STOP
  cancel(): void {
    if (this.isSpeaking) {
      TextToSpeech.stop()
        .then(() => {
          this.isSpeaking = false;
          // Optionally call utterance.onend or onerror
        })
        .catch((err) => {
          this.isSpeaking = false;
          // Fire onerror if you want to handle stop() errors
        });
    }
  }
}
