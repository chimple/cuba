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
