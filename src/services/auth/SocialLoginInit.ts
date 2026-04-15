import { SocialLogin } from '@capgo/capacitor-social-login';

let initPromise: Promise<void> | null = null;

export function ensureSocialLoginInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = SocialLogin.initialize({
      google: {
        webClientId: process.env.REACT_APP_CLIENT_ID,
      },
    });
  }
  return initPromise;
}
