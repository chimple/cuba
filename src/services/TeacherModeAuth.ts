import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Toast } from '@capacitor/toast';
import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';

const MIN_SUPPORTED_ANDROID_SDK = 24;

export enum TeacherModeAuthResult {
  success = 'success',
  popupFallbackRequired = 'popupFallbackRequired',
  cancelledOrFailed = 'cancelledOrFailed',
}

async function showTeacherModeAuthMessage(text: string): Promise<void> {
  try {
    await Toast.show({ text });
  } catch {
    // Toast is best-effort; auth result should not depend on UI feedback.
  }
}

function getTeacherModeAuthMessage(error: unknown): string {
  if (error instanceof BiometryError) {
    switch (error.code) {
      case BiometryErrorType.userCancel:
      case BiometryErrorType.systemCancel:
      case BiometryErrorType.appCancel:
        return 'Authentication cancelled.';
      case BiometryErrorType.biometryLockout:
        return 'Too many attempts. Please try again later.';
      case BiometryErrorType.biometryNotEnrolled:
        return 'Please set up fingerprint, face unlock, or device lock first.';
      case BiometryErrorType.biometryNotAvailable:
        return 'Biometric authentication is not available on this device.';
      case BiometryErrorType.noDeviceCredential:
      case BiometryErrorType.passcodeNotSet:
        return 'Please set a device PIN, pattern, or password first.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  return 'Authentication failed. Please try again.';
}

function shouldUsePopupFallback(error: unknown): boolean {
  if (!(error instanceof BiometryError)) {
    return false;
  }

  return [
    BiometryErrorType.biometryNotAvailable,
    BiometryErrorType.biometryNotEnrolled,
    BiometryErrorType.noDeviceCredential,
    BiometryErrorType.passcodeNotSet,
  ].includes(error.code);
}

export async function requireTeacherModeAuth(): Promise<TeacherModeAuthResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return TeacherModeAuthResult.popupFallbackRequired;
  }

  try {
    const deviceInfo = await Device.getInfo();
    if (
      deviceInfo.androidSDKVersion !== undefined &&
      deviceInfo.androidSDKVersion < MIN_SUPPORTED_ANDROID_SDK
    ) {
      return TeacherModeAuthResult.popupFallbackRequired;
    }

    const biometry = await BiometricAuth.checkBiometry();

    if (!biometry.isAvailable && !biometry.deviceIsSecure) {
      return TeacherModeAuthResult.popupFallbackRequired;
    }

    await BiometricAuth.authenticate({
      reason: 'Authenticate to switch to Teacher Mode',
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      androidTitle: 'Teacher Mode',
      androidSubtitle: 'Authenticate to continue',
      androidConfirmationRequired: false,
      androidBiometryStrength: AndroidBiometryStrength.weak,
    });

    return TeacherModeAuthResult.success;
  } catch (error) {
    if (shouldUsePopupFallback(error)) {
      return TeacherModeAuthResult.popupFallbackRequired;
    }

    await showTeacherModeAuthMessage(getTeacherModeAuthMessage(error));
    return TeacherModeAuthResult.cancelledOrFailed;
  }
}
