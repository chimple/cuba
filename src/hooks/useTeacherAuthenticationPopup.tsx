import React, { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import {
  TeacherAuthenticationKey,
  useTeacherAuthentication,
} from './useTeacherAuthentication';
import {
  TeacherAuthenticationChallenge,
  generateTeacherAuthenticationChallenge,
} from '../components/parent/teacherAuthenticationChallenge';
import {
  EVENTS,
  TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS,
  TeacherAuthGateSourceEntryPoint,
} from '../common/constants';
import { Util } from '../utility/util';

const KEY_ZERO = '0';
const SUBMIT_SUCCESS_FEEDBACK_MS = 160;
const QUESTION_NUMBER_REGEX = /(\d+)\s*\+\s*(\d+)/;

export interface TeacherAuthenticationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  expectedAnswer?: string;
  answerLength?: number;
  questionText?: string;
  sourceEntryPoint?: TeacherAuthGateSourceEntryPoint;
}

const getKeyLabel = (
  key: TeacherAuthenticationKey,
  backspaceKey: string,
): React.ReactNode => {
  if (key === backspaceKey) {
    return (
      <img
        id="teacher-authentication-popup-backspace-icon"
        className="teacher-authentication-popup-backspace-icon"
        src="/assets/teacher-authentication-key-backspace.svg"
        alt={String(t('Backspace') ?? '')}
        aria-hidden="true"
      />
    );
  }
  return key;
};

const getKeyClassName = (
  key: TeacherAuthenticationKey,
  backspaceKey: string,
): string => {
  if (key === backspaceKey) {
    return 'teacher-authentication-popup-key teacher-authentication-popup-key-backspace';
  }

  if (key === KEY_ZERO) {
    return 'teacher-authentication-popup-key teacher-authentication-popup-key-zero';
  }

  return 'teacher-authentication-popup-key';
};

const getGeneratedProblem = (
  challenge?: TeacherAuthenticationChallenge,
  questionText?: string,
): string => {
  const questionNumbers = questionText?.match(QUESTION_NUMBER_REGEX);
  if (questionNumbers) {
    return `${questionNumbers[1]}+${questionNumbers[2]}`;
  }

  if (!challenge) {
    return '';
  }

  return `${challenge.firstNumber}+${challenge.secondNumber}`;
};

export const useTeacherAuthenticationPopup = ({
  isOpen,
  onClose,
  onAuthenticated,
  expectedAnswer,
  answerLength,
  questionText,
  sourceEntryPoint = TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS.PARENT_SETTINGS_TAB,
}: TeacherAuthenticationPopupProps) => {
  const [openVersion, setOpenVersion] = useState<number>(0);
  const [isSubmitSuccessFeedbackActive, setIsSubmitSuccessFeedbackActive] =
    useState<boolean>(false);
  const [isSubmitAttemptInProgress, setIsSubmitAttemptInProgress] =
    useState<boolean>(false);
  const submitFeedbackTimerRef = useRef<number | undefined>(undefined);
  const [generatedChallenge, setGeneratedChallenge] =
    useState<TeacherAuthenticationChallenge>(
      generateTeacherAuthenticationChallenge,
    );
  const attemptNumberRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) {
      if (submitFeedbackTimerRef.current !== undefined) {
        window.clearTimeout(submitFeedbackTimerRef.current);
        submitFeedbackTimerRef.current = undefined;
      }
      setIsSubmitSuccessFeedbackActive(false);
      setIsSubmitAttemptInProgress(false);
      return;
    }

    attemptNumberRef.current = 0;
    setOpenVersion((previousValue) => previousValue + 1);
    if (!expectedAnswer && !questionText) {
      const nextChallenge = generateTeacherAuthenticationChallenge();
      setGeneratedChallenge(nextChallenge);
      void Util.logEvent(EVENTS.TEACHER_AUTH_GATE_VIEWED, {
        source_entry_point: sourceEntryPoint,
        generated_problem: getGeneratedProblem(nextChallenge),
      });
      return;
    }

    void Util.logEvent(EVENTS.TEACHER_AUTH_GATE_VIEWED, {
      source_entry_point: sourceEntryPoint,
      generated_problem: getGeneratedProblem(undefined, questionText),
    });
  }, [isOpen, expectedAnswer, questionText, sourceEntryPoint]);

  useEffect(() => {
    return () => {
      if (submitFeedbackTimerRef.current !== undefined) {
        window.clearTimeout(submitFeedbackTimerRef.current);
      }
    };
  }, []);

  const resolvedExpectedAnswer = expectedAnswer ?? generatedChallenge.answer;

  const {
    enteredDigits,
    keypadKeys,
    expectedDigitCount,
    canSubmit,
    showError,
    handleKeyPress,
    handleSubmit,
    handleReset,
    backspaceKey,
  } = useTeacherAuthentication({
    expectedAnswer: resolvedExpectedAnswer,
    answerLength,
    resetKey: openVersion,
    authenticationDelayMs: SUBMIT_SUCCESS_FEEDBACK_MS,
    onAuthenticated,
  });

  if (!isOpen) {
    return null;
  }

  const displayedQuestionText =
    questionText ??
    t('How much is {{firstNumber}} + {{secondNumber}} = ?', {
      firstNumber: generatedChallenge.firstNumber,
      secondNumber: generatedChallenge.secondNumber,
    });
  const submitButtonClassName = `teacher-authentication-popup-submit-button ${
    isSubmitSuccessFeedbackActive
      ? 'teacher-authentication-popup-submit-button-success-feedback'
      : ''
  }`;

  const handleSubmitClick = async (): Promise<void> => {
    if (!canSubmit || isSubmitAttemptInProgress) {
      return;
    }

    const userInput = enteredDigits.join('');
    const isAuthenticated = userInput === resolvedExpectedAnswer;
    const attemptNumber = attemptNumberRef.current + 1;
    attemptNumberRef.current = attemptNumber;
    setIsSubmitAttemptInProgress(true);

    await Util.logEvent(EVENTS.TEACHER_AUTH_GATE_ATTEMPTED, {
      success: isAuthenticated,
      user_input: Number(userInput),
      correct_answer: Number(resolvedExpectedAnswer),
      attempt_number: attemptNumber,
    });

    handleSubmit();
    setIsSubmitAttemptInProgress(false);
    setIsSubmitSuccessFeedbackActive(isAuthenticated);
    if (!isAuthenticated) {
      return;
    }

    if (submitFeedbackTimerRef.current !== undefined) {
      window.clearTimeout(submitFeedbackTimerRef.current);
    }
    submitFeedbackTimerRef.current = window.setTimeout(() => {
      submitFeedbackTimerRef.current = undefined;
      setIsSubmitSuccessFeedbackActive(false);
    }, SUBMIT_SUCCESS_FEEDBACK_MS);
  };
  return {
    backspaceKey,
    canSubmit,
    displayedQuestionText,
    enteredDigits,
    expectedDigitCount,
    getKeyClassName,
    getKeyLabel,
    handleKeyPress,
    handleReset,
    handleSubmitClick,
    isSubmitAttemptInProgress,
    isSubmitSuccessFeedbackActive,
    keypadKeys,
    onClose,
    showError,
    submitButtonClassName,
    t,
  };
};
