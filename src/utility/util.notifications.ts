import { Capacitor } from '@capacitor/core';
import {
  CURRENT_STUDENT,
  FCM_TOKENS,
  LANG,
  LANGUAGE,
  TableTypes,
  PAGES,
  MODES,
  CONTINUE,
  CURRENT_STUDENT_CHANGED_EVENT,
} from '../common/constants';
import { APIMode, ServiceConfig } from '../services/ServiceConfig';
import i18n from '../i18n';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Keyboard } from '@capacitor/keyboard';
import { schoolUtil } from './schoolUtil';
import { store } from '../redux/store';
import { setIsOpsUser } from '../redux/slices/auth/authSlice';
import { getAppSearchParams } from './routerLocation';
import { UtilLessonProgress } from './util.lessonProgress';

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}

export interface HotUpdateState {
  status: string;
  progress: number;
  channel: string;
  lastChecked: string;
  lastUpdated: string;
  error: string;
  isAuto: boolean;
}
export class UtilNotifications extends UtilLessonProgress {
  static [key: string]: any;
  public static setPathToBackButton(path: string, history: any) {
    const url = getAppSearchParams();
    if (url.get(CONTINUE)) {
      history.replace(`${path}?${CONTINUE}=true`);
    } else {
      history.replace(path);
    }
  }

  public static switchToOpsUser(history: any): void {
    store.dispatch(setIsOpsUser(true));
    ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
    schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
    history.replace(PAGES.SIDEBAR_PAGE);
  }

  public static setCurrentStudent = async (
    student: TableTypes<'user'> | null,
    languageCode?: string,
    langFlag: boolean = true,
    isStudent: boolean = true,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentStudent = student !== null ? student : undefined;

    localStorage.setItem(CURRENT_STUDENT, JSON.stringify(student));
    window.dispatchEvent(
      new CustomEvent(CURRENT_STUDENT_CHANGED_EVENT, { detail: student }),
    );

    if (!languageCode && !!student?.language_id) {
      const langDoc = await api.getLanguageWithId(student.language_id);
      if (langDoc) {
        languageCode = langDoc.code ?? undefined;
      }
    }
    const tempLangCode = languageCode ?? LANG.ENGLISH;
    if (!!langFlag) localStorage.setItem(LANGUAGE, tempLangCode);
    if (!!isStudent) await i18n.changeLanguage(tempLangCode);
  };

  public static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public static isEmail(username: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(username);
    return isValid;
  }

  public static async subscribeToClassTopic(
    classId: string,
    schoolId: string,
  ): Promise<void> {
    const classToken = `${classId}-assignments`;
    const schoolToken = `${schoolId}-assignments`;
    if (!Capacitor.isNativePlatform()) return;
    await FirebaseMessaging.subscribeToTopic({
      topic: classToken,
    });
    await FirebaseMessaging.subscribeToTopic({
      topic: schoolToken,
    });
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens: string[] = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    tokens.push(classToken, schoolToken);
    localStorage.setItem(FCM_TOKENS, JSON.stringify(tokens));
  }

  public static async unSubscribeToTopic(token: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens: string[] = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    await FirebaseMessaging.unsubscribeFromTopic({
      topic: token,
    });
    const newSubscribedTokens = tokens.filter((x) => x !== token);
    localStorage.setItem(FCM_TOKENS, JSON.stringify(newSubscribedTokens));
  }

  public static async subscribeToClassTopicForAllStudents(
    currentUser: TableTypes<'user'>,
  ): Promise<void> {}

  public static isClassTokenSubscribed(classId: string): boolean {
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    const foundToken = tokens.find((token: string) =>
      token.startsWith(classId),
    );
    return !!foundToken;
  }

  public static async unSubscribeToClassTopicForAllStudents() {
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    for (let token of tokens) {
      this.unSubscribeToTopic(token);
    }
  }

  public static async getToken(): Promise<string | undefined> {
    if (!Capacitor.isNativePlatform()) return;
    const result = await FirebaseMessaging.getToken();
    return result.token;
  }

  public static isTextFieldFocus(
    scollToRef: {
      current?: { scrollIntoView: (options: ScrollIntoViewOptions) => void };
    },
    setIsInputFocus: (isFocused: boolean) => void,
  ) {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        setIsInputFocus(true);

        setTimeout(() => {
          scollToRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }, 50);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setIsInputFocus(false);
      });
    }
  }
}
