import { SocialLogin } from '@capgo/capacitor-social-login';

let initPromise: Promise<void> | null = null;

export function ensureSocialLoginInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = SocialLogin.initialize({
      google: {
        webClientId: process.env.REACT_APP_CLIENT_ID,
      },
    }).catch((error) => {
      // Reset promise on failure to allow retries on subsequent calls.
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
