import { PopupConfig } from "./GenericPopUpType";
import { LANGUAGE ,GENERIC_POPUP_TRIGGER_CONDITION, SHOW_GENERIC_POPUP} from "../../common/constants"; 
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Util } from "../../utility/util";
class PopupManager {
  private static instance: PopupManager;
  private isPopupActive = false;
  private sessionGamesPlayed = 0;


  static getInstance() {
    if (!PopupManager.instance) {
      PopupManager.instance = new PopupManager();
    }
    return PopupManager.instance;
  }

  /** -------- Trigger Entry Points -------- */

  onAppOpen(config: PopupConfig) {
      console.log("onAppOpen Triggered for Popup1:", config.id);

    if (config.triggers.type === GENERIC_POPUP_TRIGGER_CONDITION.APP_OPEN) {
      console.log("onAppOpen Triggered for Popup:", config.id);
      this.tryShowPopup(config);
    }
  }

  onGameComplete(config: PopupConfig) {
    console.log("onGameComplete Triggered for Popup:", config.id ?? "unknown");
    if (!config?.triggers || config.triggers.type !== GENERIC_POPUP_TRIGGER_CONDITION.GAME_COMPLETE) return;

    this.sessionGamesPlayed++;
    if (this.sessionGamesPlayed === config.triggers.value) {
      this.tryShowPopup(config);
    }
  }

  onTimeElapsed(config: PopupConfig) {
    console.log("onTimeElapsed Triggered for Popup:", config.id);
    if (config.triggers.type !== GENERIC_POPUP_TRIGGER_CONDITION.TIME_ELAPSED) return;
    if (this.isPopupActive) return; 
    setTimeout(() => {
      this.tryShowPopup(config);
    }, config.triggers.value * 1000);
  }

  /** -------- Validation Logic -------- */

  private tryShowPopup(config: PopupConfig) {
    console.log("tryShowPopup called for Popup:", config);
    if (!config.isActive) return;

    if (this.isPopupActive || (window as any).isAnyPopupOpen?.()) {
      console.log("Popup blocked: another popup active");
      return;
    }

    if (!this.isWithinSchedule(config)) return;
    if (!this.canShowToday(config)) return;

    this.showPopup(config);
  }

  private isWithinSchedule(config: PopupConfig): boolean {
    const today = new Date();
    const day = today.getDay();

    if (!config.schedule.daysOfWeek.includes(day)) return false;

    const now = today.getTime();
    if (now < new Date(config.schedule.startDate).getTime()) return false;
    if (now > new Date(config.schedule.endDate).getTime()) return false;

    return true;
  }

  private canShowToday(config: PopupConfig): boolean {
    
    const currentStudent = Util.getCurrentStudent();
    const studentId = currentStudent?.id;
    if (!studentId) return false;
    const today = new Date().toISOString().split("T")[0];
    const key = `GB_POPUP_${studentId}_${config.id}_${today}`;

    const count = Number(localStorage.getItem(key) || 0);
    return count < config.schedule.maxViewsPerDay;
  }

  

  private incrementCount(config: PopupConfig) {
     const currentStudent = Util.getCurrentStudent();
    const studentId = currentStudent?.id;
    if (!studentId) return false;
    const today = new Date().toISOString().split("T")[0];
    const key = `GB_POPUP_${studentId}_${config.id}_${today}`;

    const count = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(count + 1));
  }

  /** -------- Render + Analytics -------- */

  private showPopup(config: PopupConfig) {
    console.log("SHOW POPUP CALLED:", config.id);
    this.isPopupActive = true;
    this.incrementCount(config);

    const lang =
    localStorage.getItem(LANGUAGE) ||
    navigator.language?.split("-")[0] ||
    "en";
    const localized =
      config.content[lang] ||
      config.content["en"] ||
      Object.values(config.content)[0];

    window.dispatchEvent(
      new CustomEvent(SHOW_GENERIC_POPUP, {
        detail: { config, localized },
      })
    );

    // Analytics
    (window as any).analytics?.track("popup_shown", {
      popup_id: config.id,
      trigger_type: config.triggers.type,
      screen_name: config.screen_name || "unknown",
    });
  }

  onDismiss(config: PopupConfig) {
    this.isPopupActive = false;

    (window as any).analytics?.track("popup_dismissed", {
      popup_id: config.id,
    });
  }

  onAction(config: PopupConfig) {
  (window as any).analytics?.track("popup_action", {
    popup_id: config.id,
    action_type: "CLICK_BUTTON",
    target: config.action?.target,
  });


if (config.action?.type === "DEEP_LINK") {
  const rawTarget = config.action.target;          // e.g. "SUBJECTS", "LEADERBOARD"
  const normalizedTarget = rawTarget.toLowerCase();

  // 🔹 HOME / LEADERBOARD TAB NAVIGATION
  if (/^[a-z0-9_-]+$/i.test(rawTarget)) {
    // 1️⃣ Decide base route
    const baseRoute =
      normalizedTarget === "rewards" || normalizedTarget === "leaderboard"
        ? "/leaderboard"
        : "/home";


    console.log("✅ Navigating to:", baseRoute, rawTarget);
    window.location.replace(`${baseRoute}?tab=${rawTarget}`);
    return;
  }

  if (rawTarget.startsWith("/")) {

    window.location.replace(rawTarget);
    return;
  }

  // 🌍 External
  if (Capacitor.isNativePlatform()) {
    Browser.open({ url: rawTarget });
  } else {
    window.open(rawTarget, "_blank", "noopener,noreferrer");
  }
}

  this.isPopupActive = false;
}

}

export default PopupManager.getInstance();
