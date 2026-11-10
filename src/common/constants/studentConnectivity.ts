export const STUDENT_CONNECTIVITY_OPTIONS = [
  { value: 'keypad_phone', label: 'KEYPAD PHONE' },
  { value: 'no_phone', label: 'NO PHONE' },
  { value: 'parents_outside', label: 'PARENTS OUTSIDE' },
  { value: 'jio_phone', label: 'JIO PHONE' },
  { value: 'otp_not_coming', label: 'OTP NOT COMING' },
  { value: 'classcode_incorrect', label: 'CLASSCODE INCORRECT' },
  {
    value: 'phone_not_working',
    label: 'PHONE NOT WORKING / PHONE BROKEN',
  },
  { value: 'blank_screen_issue', label: 'BLANK SCREEN ISSUE' },
  { value: 'app_uninstalled', label: 'APP UNINSTALLED' },
  { value: 'no_recharge', label: 'NO RECHARGE' },
  { value: 'no_internet_recharge', label: 'NO INTERNET RECHARGE' },
] as const;

export type StudentConnectivity =
  (typeof STUDENT_CONNECTIVITY_OPTIONS)[number]['value'];

export const STUDENT_CONNECTIVITY_LABELS: Record<StudentConnectivity, string> =
  Object.fromEntries(
    STUDENT_CONNECTIVITY_OPTIONS.map(({ value, label }) => [value, label]),
  ) as Record<StudentConnectivity, string>;
