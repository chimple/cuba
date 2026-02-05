import { useHistory } from "react-router-dom";
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

export type BackButtonHandler = () => void;

const handlers: BackButtonHandler[] = [];

export const registerBackButtonHandler = (handler: BackButtonHandler) => {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  };
};

export const getBackButtonHandler = (): BackButtonHandler | null => {
  return handlers.length > 0 ? handlers[handlers.length - 1] : null;
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const dismissActiveOverlay = async () => {
      const selectors =
        "ion-modal, ion-alert, ion-popover, ion-action-sheet, ion-loading, ion-picker, ion-toast";
      const overlays = Array.from(
        document.querySelectorAll(selectors)
      ) as Array<{ dismiss?: (data?: any, role?: string) => Promise<boolean>; classList?: DOMTokenList; getAttribute?: (name: string) => string | null }>;

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
        const popupData = popupDataRef.current;
        if (popupData) {
          popupManager.onDismiss(popupData.config);
          setPopupData(null);
          return;
        }

        if (showModalRef?.current && setShowModal) {
          setShowModal(false);
          return;
        }

        const dismissed = await dismissActiveOverlay();
        if (dismissed) return;

        const registeredHandler = getBackButtonHandler();
        if (registeredHandler) {
          registeredHandler();
          return;
        }

        const canNavigateBack =
          typeof canGoBack === "boolean" ? canGoBack : history.length > 1;

        if (canNavigateBack) {
          history.goBack();
        }
      } finally {
        isHandlingRef.current = false;
      }
    };

    let listener: { remove: () => void } | null = null;
    const addListener = async () => {
      listener = await CapApp.addListener("backButton", handler);
    };
    addListener();
    return () => {
      listener?.remove();
    };
  }, [
    history,
    popupDataRef,
    setPopupData,
    popupManager,
    showModalRef,
    setShowModal,
  ]);

  return null;
};
