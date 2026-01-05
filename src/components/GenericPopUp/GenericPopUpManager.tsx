import { PopupConfig } from "./GenericPopUpType";
import { LANGUAGE , APP_OPEN , GAME_COMPLETE ,TIME_ELAPSED } from "../../common/constants"; 
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
    if (config.triggers.type === APP_OPEN) {
      console.log("onAppOpen Triggered for Popup:", config.id);
      this.tryShowPopup(config);
    }
  }

  onGameComplete(config: PopupConfig) {
    console.log("onGameComplete Triggered for Popup:", config.id);
    if (config.triggers.type !== GAME_COMPLETE) return;

    this.sessionGamesPlayed++;
    if (this.sessionGamesPlayed === config.triggers.value) {
      this.tryShowPopup(config);
    }
  }

  onTimeElapsed(config: PopupConfig) {
    console.log("onTimeElapsed Triggered for Popup:", config.id);
    if (config.triggers.type !== TIME_ELAPSED) return;
    if (this.isPopupActive) return; 
    setTimeout(() => {
      this.tryShowPopup(config);
    }, config.triggers.value * 1000);
  }

  /** -------- Validation Logic -------- */

  private tryShowPopup(config: PopupConfig) {
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
    const today = new Date().toISOString().split("T")[0];
    const key = `GB_POPUP_${config.id}_${today}`;

    const count = Number(localStorage.getItem(key) || 0);
    return count < config.schedule.maxViewsPerDay;
  }

  private incrementCount(config: PopupConfig) {
    const today = new Date().toISOString().split("T")[0];
    const key = `GB_POPUP_${config.id}_${today}`;

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
      new CustomEvent("SHOW_GENERIC_POPUP", {
        detail: { config, localized },
      })
    );

    // Analytics
    (window as any).analytics?.track("popup_shown", {
      popup_id: config.id,
      trigger_type: config.triggers.type,
      screen_name: "HomeScene",
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
    const target = config.action.target;

    // ✅ Internal app route
    if (target.startsWith("/")) {
      window.dispatchEvent(
        new CustomEvent("POPUP_INTERNAL_NAVIGATION", {
          detail: { path: target },
        })
      );
    } else {
      // 🌍 External / scheme / https / chimple://
      window.location.href = target;
    }
  }

  this.isPopupActive = false;
}

}

export default PopupManager.getInstance();
