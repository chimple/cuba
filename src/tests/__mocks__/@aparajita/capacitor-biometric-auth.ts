export enum AndroidBiometryStrength {
  weak = 0,
  strong = 1,
}

export enum BiometryErrorType {
  none = '',
  appCancel = 'appCancel',
  authenticationFailed = 'authenticationFailed',
  invalidContext = 'invalidContext',
  notInteractive = 'notInteractive',
  passcodeNotSet = 'passcodeNotSet',
  systemCancel = 'systemCancel',
  userCancel = 'userCancel',
  userFallback = 'userFallback',
  biometryLockout = 'biometryLockout',
  biometryNotAvailable = 'biometryNotAvailable',
  biometryNotEnrolled = 'biometryNotEnrolled',
  noDeviceCredential = 'noDeviceCredential',
}

export class BiometryError extends Error {
  code: BiometryErrorType;

  constructor(message: string, code: BiometryErrorType) {
    super(message);
    this.code = code;
  }
}

export const BiometricAuth = {
  checkBiometry: jest.fn().mockResolvedValue({
    isAvailable: true,
    strongBiometryIsAvailable: true,
    deviceIsSecure: true,
    reason: '',
    code: BiometryErrorType.none,
  }),
  authenticate: jest.fn().mockResolvedValue(undefined),
};
