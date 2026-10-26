import { useEffect, useMemo, useRef, useState } from 'react';

const DIGIT_REGEX = /\d/g;
const DEFAULT_EXPECTED_ANSWER = '';
const DEFAULT_ANSWER_LENGTH = 2;
const KEY_BACKSPACE = 'BACKSPACE';
const MAX_SUPPORTED_DIGITS = 6;

export type TeacherAuthenticationKey = string;

export interface UseTeacherAuthenticationParams {
  expectedAnswer?: string;
  answerLength?: number;
  resetKey?: number;
  authenticationDelayMs?: number;
  onAuthenticated: () => void;
}

export interface UseTeacherAuthenticationResult {
  enteredDigits: string[];
  keypadKeys: TeacherAuthenticationKey[];
  expectedDigitCount: number;
  canSubmit: boolean;
  showError: boolean;
  handleKeyPress: (key: TeacherAuthenticationKey) => void;
  handleSubmit: () => boolean;
  handleReset: () => void;
  backspaceKey: TeacherAuthenticationKey;
}

const sanitizeAnswer = (value: string): string => {
  const digits = value.match(DIGIT_REGEX);
  return digits ? digits.join('') : '';
};

const getSafeAnswerLength = (
  answerLength: number | undefined,
  normalizedAnswer: string,
): number => {
  if (typeof answerLength === 'number' && answerLength > 0) {
    return Math.min(answerLength, MAX_SUPPORTED_DIGITS);
  }
  if (normalizedAnswer.length > 0) {
    return Math.min(normalizedAnswer.length, MAX_SUPPORTED_DIGITS);
  }
  return DEFAULT_ANSWER_LENGTH;
};

export const useTeacherAuthentication = ({
  expectedAnswer = DEFAULT_EXPECTED_ANSWER,
  answerLength,
  resetKey,
  authenticationDelayMs = 0,
  onAuthenticated,
}: UseTeacherAuthenticationParams): UseTeacherAuthenticationResult => {
  const normalizedAnswer = sanitizeAnswer(expectedAnswer);
  const expectedDigitCount = getSafeAnswerLength(
    answerLength,
    normalizedAnswer,
  );
  const targetAnswer = normalizedAnswer.slice(0, expectedDigitCount);

  const keypadKeys = useMemo<TeacherAuthenticationKey[]>(
    () => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', KEY_BACKSPACE],
    [],
  );

  const [enteredDigits, setEnteredDigits] = useState<string[]>([]);
  const [showError, setShowError] = useState<boolean>(false);
  const authenticationTimerRef = useRef<number | undefined>(undefined);

  const clearAuthenticationTimer = (): void => {
    if (authenticationTimerRef.current === undefined) {
      return;
    }

    window.clearTimeout(authenticationTimerRef.current);
    authenticationTimerRef.current = undefined;
  };

  useEffect(() => {
    setEnteredDigits([]);
    setShowError(false);
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (authenticationTimerRef.current !== undefined) {
        window.clearTimeout(authenticationTimerRef.current);
      }
    };
  }, []);

  const canSubmit = enteredDigits.length === expectedDigitCount;

  const handleKeyPress = (key: TeacherAuthenticationKey): void => {
    if (key === KEY_BACKSPACE) {
      setEnteredDigits((previousDigits) => {
        if (previousDigits.length === 0) {
          return previousDigits;
        }
        return previousDigits.slice(0, previousDigits.length - 1);
      });
      setShowError(false);
      return;
    }

    if (!/^\d$/.test(key)) {
      return;
    }

    setEnteredDigits((previousDigits) => {
      if (previousDigits.length >= expectedDigitCount) {
        return previousDigits;
      }
      return [...previousDigits, key];
    });
    setShowError(false);
  };

  const handleSubmit = (): boolean => {
    if (!canSubmit || targetAnswer.length !== expectedDigitCount) {
      return false;
    }

    const userAnswer = enteredDigits.join('');
    if (userAnswer === targetAnswer) {
      setEnteredDigits([]);
      setShowError(false);
      clearAuthenticationTimer();
      if (authenticationDelayMs > 0) {
        authenticationTimerRef.current = window.setTimeout(() => {
          authenticationTimerRef.current = undefined;
          onAuthenticated();
        }, authenticationDelayMs);
      } else {
        onAuthenticated();
      }
      return true;
    }

    setShowError(true);
    setEnteredDigits([]);
    return false;
  };

  const handleReset = (): void => {
    clearAuthenticationTimer();
    setEnteredDigits([]);
    setShowError(false);
  };

  return {
    enteredDigits,
    keypadKeys,
    expectedDigitCount,
    canSubmit,
    showError,
    handleKeyPress,
    handleSubmit,
    handleReset,
    backspaceKey: KEY_BACKSPACE,
  };
};
