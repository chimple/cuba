import { useHistory } from "react-router-dom";
import {
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

export type BackButtonHandler = () => boolean | void | Promise<boolean | void>;

type BackButtonScope = "path" | "global";

type BackButtonRecord = {
  handler: BackButtonHandler;
  path: string;
  scope: BackButtonScope;
};

const handlers: BackButtonRecord[] = [];
const HARDWARE_BACK_BUTTON_REINIT_EVENT =
  "hardwareBackButtonRegistry:reinitialize";

const normalizePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed || "/";
};

const getCurrentPath = () => {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location?.pathname || "/");
};

const isActiveForPath = (record: BackButtonRecord, path: string) => {
  if (record.scope === "global") return true;
  return record.path === path;
};

const runBackButtonHandlers = async (path: string) => {
  for (let i = handlers.length - 1; i >= 0; i--) {
    const record = handlers[i];
    if (!isActiveForPath(record, path)) continue;

    const handled = await record.handler();
    if (handled !== false) {
      return true;
    }
  }
  return false;
};

export const registerBackButtonHandler = (
  handler: BackButtonHandler,
  options?: { path?: string; scope?: BackButtonScope },
) => {
  const scope = options?.scope ?? "path";
  const path = normalizePath(options?.path ?? getCurrentPath());
  const record: BackButtonRecord = { handler, path, scope };
  handlers.push(record);

  return () => {
    const index = handlers.lastIndexOf(record);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  };
};

export const getBackButtonHandler = (
  path: string = getCurrentPath(),
): BackButtonHandler | null => {
  const normalized = normalizePath(path);
  for (let i = handlers.length - 1; i >= 0; i--) {
    const record = handlers[i];
    if (isActiveForPath(record, normalized)) return record.handler;
  }
  return null;
};

export const resetBackButtonHandlers = () => {
  handlers.length = 0;
};

export const reinitializeHardwareBackButton = () => {
  resetBackButtonHandlers();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HARDWARE_BACK_BUTTON_REINIT_EVENT));
  }
};

type PopupManagerLike = {
  onDismiss: (config: any) => void;
};

type HardwareBackButtonHandlerProps = {
  popupDataRef: RefObject<any>;
  setPopupData: Dispatch<SetStateAction<any>>;
  popupManager: PopupManagerLike;
  showModalRef?: RefObject<boolean>;
  setShowModal?: Dispatch<SetStateAction<boolean>>;
};

export const HardwareBackButtonHandler = ({
  popupDataRef,
  setPopupData,
  popupManager,
  showModalRef,
  setShowModal,
}: HardwareBackButtonHandlerProps) => {
  const history = useHistory();
  const isHandlingRef = useRef(false);
  const popupDataRefRef = useRef(popupDataRef);
  const historyRef = useRef(history);
  const setPopupDataRef = useRef(setPopupData);
  const popupManagerRef = useRef(popupManager);
  const showModalRefRef = useRef(showModalRef);
  const setShowModalRef = useRef(setShowModal);

  useEffect(() => {
    popupDataRefRef.current = popupDataRef;
  }, [popupDataRef]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    setPopupDataRef.current = setPopupData;
  }, [setPopupData]);

  useEffect(() => {
    popupManagerRef.current = popupManager;
  }, [popupManager]);

  useEffect(() => {
    showModalRefRef.current = showModalRef;
  }, [showModalRef]);

  useEffect(() => {
    setShowModalRef.current = setShowModal;
  }, [setShowModal]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const dismissActiveOverlay = async () => {
      const selectors =
        "ion-modal, ion-alert, ion-popover, ion-action-sheet, ion-loading, ion-picker, ion-toast";
      const overlays = Array.from(
        document.querySelectorAll(selectors),
      ) as Array<{
        dismiss?: (data?: any, role?: string) => Promise<boolean>;
        classList?: DOMTokenList;
        getAttribute?: (name: string) => string | null;
      }>;

      const activeOverlay = overlays
        .slice()
        .reverse()
        .find((overlay) => {
          const isHidden =
            overlay?.classList?.contains("overlay-hidden") ||
            overlay?.getAttribute?.("aria-hidden") === "true";
          return !isHidden;
        });

      if (activeOverlay?.dismiss) {
        await activeOverlay.dismiss();
        return true;
      }
      return false;
    };

    const handler = async ({ canGoBack }: { canGoBack: boolean }) => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;
      try {
        const popupData = popupDataRefRef.current.current;
        if (popupData) {
          popupManagerRef.current.onDismiss(popupData.config);
          setPopupDataRef.current(null);
          return;
        }

        if (showModalRefRef.current?.current && setShowModalRef.current) {
          setShowModalRef.current(false);
          return;
        }

        const dismissed = await dismissActiveOverlay();
        if (dismissed) {
          return;
        }

        const handled = await runBackButtonHandlers(getCurrentPath());
        if (handled) {
          return;
        }

        const canNavigateBack =
          typeof canGoBack === "boolean"
            ? canGoBack
            : historyRef.current.length > 1;

        if (canNavigateBack) {
          historyRef.current.goBack();
        } else {
        }
      } finally {
        isHandlingRef.current = false;
      }
    };

    let listener: { remove: () => void } | null = null;
    let disposed = false;
    let listenerVersion = 0;

    const addListener = async () => {
      const currentVersion = ++listenerVersion;
      const created = await CapApp.addListener("backButton", handler);
      if (disposed || currentVersion !== listenerVersion) {
        created.remove();
        return;
      }
      listener = created;
    };

    const reinitializeListener = () => {
      listener?.remove();
      listener = null;
      addListener();
    };

    addListener();
    window.addEventListener(
      HARDWARE_BACK_BUTTON_REINIT_EVENT,
      reinitializeListener,
    );

    return () => {
      disposed = true;
      window.removeEventListener(
        HARDWARE_BACK_BUTTON_REINIT_EVENT,
        reinitializeListener,
      );
      listener?.remove();
    };
  }, []);

  return null;
};
