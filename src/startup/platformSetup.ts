import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { defineCustomElements, JSX as LocalJSX } from 'lido-standalone/loader';
import {
  SpeechSynthesis,
  SpeechSynthesisUtterance,
} from '../utility/WindowsSpeech';
import { initializeFireBase } from '../services/Firebase';
import { isNativePlatform } from './nativeRuntime';

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

type WindowWithSpeechPolyfills = Window & {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
};

declare global {
  namespace JSX {
    interface IntrinsicElements extends LocalJSX.IntrinsicElements {}
  }
}

export const initializePlatformSetup = () => {
  applyMobileWebBrowserClass();
  defineCustomElements(window);
  initializeFireBase();
  initializeSpeechPolyfills();
  jeepSqlite(window);
};

const applyMobileWebBrowserClass = () => {
  const userAgent = navigator.userAgent || '';
  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;
  const isMobileBrowser =
    userAgentData?.mobile === true || /\bMobile\b/i.test(userAgent);

  document.body.classList.toggle(
    'mobile-web-browser',
    !isNativePlatform && isMobileBrowser,
  );
};

const initializeSpeechPolyfills = () => {
  if (typeof window === 'undefined') return;

  const windowWithSpeechPolyfills = window as WindowWithSpeechPolyfills;

  if (!windowWithSpeechPolyfills.speechSynthesis) {
    windowWithSpeechPolyfills.speechSynthesis = new SpeechSynthesis();
  }
  if (!windowWithSpeechPolyfills.SpeechSynthesisUtterance) {
    windowWithSpeechPolyfills.SpeechSynthesisUtterance =
      SpeechSynthesisUtterance;
  }
};
