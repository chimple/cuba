import { useState, useEffect } from "react";
import { useIonToast } from "@ionic/react";
import { t } from "i18next";

type ToastPosition = "bottom" | "top" | "middle" | undefined;

interface ToastOptions {
  message: string;
  color: string;
  duration: number;
  position: ToastPosition;
  buttons: {
    text: string;
    role: string;
  }[];
}

interface OnlineOfflineHandlerResult {
  online: boolean;
  presentToast: (options: ToastOptions) => Promise<void>;
}

export function useOnlineOfflineErrorMessageHandler(): OnlineOfflineHandlerResult {
  const [online, setOnline] = useState(navigator.onLine);
  const [present] = useIonToast();

  const handleOnlineEvent = () => {
    setOnline(true);
  };

  const handleOfflineEvent = () => {
    setOnline(false);
  };

  const presentToast = async (options: ToastOptions) => {
    await present({
      ...options,
      message: t(options.message),
      position: options.position || "bottom",
      buttons: options.buttons.map((button) => ({
        ...button,
        text: t(button.text),
      })),
    });
  };

  useEffect(() => {
    window.addEventListener("online", handleOnlineEvent);
    window.addEventListener("offline", handleOfflineEvent);

    return () => {
      window.removeEventListener("online", handleOnlineEvent);
      window.removeEventListener("offline", handleOfflineEvent);
    };
  }, []);

  return { online, presentToast };
}
