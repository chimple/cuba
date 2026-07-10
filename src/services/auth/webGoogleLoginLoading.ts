const WEB_GOOGLE_LOGIN_PENDING_KEY = 'web_google_login_pending_at';

export const markWebGoogleLoginPending = () => {
  try {
    sessionStorage.setItem(WEB_GOOGLE_LOGIN_PENDING_KEY, 'true');
  } catch {
    // Continue OAuth even if sessionStorage is unavailable.
  }
};

export const clearWebGoogleLoginPending = () => {
  try {
    sessionStorage.removeItem(WEB_GOOGLE_LOGIN_PENDING_KEY);
  } catch {
    // This marker only controls the web Google login loader.
  }
};

export const isWebGoogleLoginPending = () => {
  try {
    return sessionStorage.getItem(WEB_GOOGLE_LOGIN_PENDING_KEY) === 'true';
  } catch {
    return false;
  }
};
