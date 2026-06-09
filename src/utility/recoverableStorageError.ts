export const getErrorMessage = (error: unknown): string =>
  String((error as { message?: string })?.message ?? error ?? '').toLowerCase();

export const isRecoverableStorageError = (error: unknown): boolean => {
  const message = getErrorMessage(error);

  return (
    message.includes('database is locked') ||
    message.includes('connection pool') ||
    message.includes('not opened') ||
    message.includes('open: error in creating the database') ||
    message.includes('pragma journal_mode')
  );
};
