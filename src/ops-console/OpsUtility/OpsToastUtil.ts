export type OpsToastPresenter = (options: {
  message: string;
  duration: number;
  position: 'bottom';
  color: 'success' | 'danger';
}) => Promise<void>;

export const presentOpsSuccessToast = async (
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

export const presentOpsFailureToast = async (
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
