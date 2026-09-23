export type OpsToastPresenter = (options: {
  message: string;
  duration: number;
  position: 'bottom';
  color: 'success' | 'warning' | 'danger';
}) => Promise<void>;

export const showOpsSuccessToast = async (
  presentToast: OpsToastPresenter,
  message: string,
): Promise<void> => {
  await presentToast({
    message,
    duration: 2500,
    position: 'bottom',
    color: 'success',
  });
};

export const showOpsFailureToast = async (
  presentToast: OpsToastPresenter,
  message: string,
): Promise<void> => {
  await presentToast({
    message,
    duration: 3000,
    position: 'bottom',
    color: 'danger',
  });
};

export const showOpsWarningToast = async (
  presentToast: OpsToastPresenter,
  message: string,
): Promise<void> => {
  await presentToast({
    message,
    duration: 3000,
    position: 'bottom',
    color: 'warning',
  });
};

export const getOpsErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};
