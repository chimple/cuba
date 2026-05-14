import React, { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import {
  TeacherAuthenticationKey,
  useTeacherAuthentication,
} from './useTeacherAuthentication';
import {
  TeacherAuthenticationChallenge,
  generateTeacherAuthenticationChallenge,
} from './teacherAuthenticationChallenge';
import './TeacherAuthenticationPopup.css';

const KEY_ZERO = '0';
const SUBMIT_SUCCESS_FEEDBACK_MS = 160;

export interface TeacherAuthenticationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  expectedAnswer?: string;
  answerLength?: number;
  questionText?: string;
}

const getKeyLabel = (
  key: TeacherAuthenticationKey,
  backspaceKey: string,
): React.ReactNode => {
  if (key === backspaceKey) {
    return (
      <svg
        className="teacher-authentication-popup-backspace-icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M18 8L3 23L18 38L22.2 33.8L14.4 26H43V20H14.4L22.2 12.2L18 8Z"
        />
      </svg>
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

const TeacherAuthenticationPopup: React.FC<TeacherAuthenticationPopupProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  expectedAnswer,
  answerLength,
  questionText,
}) => {
  const [openVersion, setOpenVersion] = useState<number>(0);
  const [isSubmitSuccessFeedbackActive, setIsSubmitSuccessFeedbackActive] =
    useState<boolean>(false);
  const submitFeedbackTimerRef = useRef<number | undefined>(undefined);
  const [generatedChallenge, setGeneratedChallenge] =
    useState<TeacherAuthenticationChallenge>(
      generateTeacherAuthenticationChallenge,
    );

  useEffect(() => {
    if (!isOpen) {
      if (submitFeedbackTimerRef.current !== undefined) {
        window.clearTimeout(submitFeedbackTimerRef.current);
        submitFeedbackTimerRef.current = undefined;
      }
      setIsSubmitSuccessFeedbackActive(false);
      return;
    }

    setOpenVersion((previousValue) => previousValue + 1);
    if (!expectedAnswer && !questionText) {
      setGeneratedChallenge(generateTeacherAuthenticationChallenge());
    }
  }, [isOpen, expectedAnswer, questionText]);

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

  const handleSubmitClick = (): void => {
    const isAuthenticated = handleSubmit();
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

  return (
    <div className="teacher-authentication-popup-overlay">
      <section
        className="teacher-authentication-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-authentication-popup-title"
      >
        <div className="teacher-authentication-popup-inner">
          <button
            id="teacher-authentication-popup-close-button"
            className="teacher-authentication-popup-close-button"
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            aria-label={String(t('Close authentication popup') ?? '')}
          >
            <img
              src="/assets/popup-close.svg"
              alt={String(t('Close') ?? '')}
              className="teacher-authentication-popup-close-icon"
            />
          </button>

          <div className="teacher-authentication-popup-content">
            <div className="teacher-authentication-popup-question-container">
              <div className="teacher-authentication-popup-left-panel">
                <h2
                  id="teacher-authentication-popup-title"
                  className="teacher-authentication-popup-title"
                >
                  {t('This question is for the Teacher:')}
                </h2>
                <p className="teacher-authentication-popup-question">
                  {displayedQuestionText}
                </p>
                <p className="teacher-authentication-popup-help-text">
                  {t('Enter your Answer in the keypad :')}
                </p>
                <div className="teacher-authentication-popup-answer-slots">
                  {Array.from({ length: expectedDigitCount }).map(
                    (_, index) => (
                      <span
                        key={`answer-slot-${index}`}
                        className="teacher-authentication-popup-answer-slot"
                        aria-label={String(t('Answer digit slot') ?? '')}
                      >
                        {enteredDigits[index] ?? ''}
                      </span>
                    ),
                  )}
                </div>
                <p
                  className={`teacher-authentication-popup-error ${
                    showError
                      ? 'teacher-authentication-popup-error-visible'
                      : 'teacher-authentication-popup-error-hidden'
                  }`}
                  aria-live="polite"
                >
                  {showError ? t('Wrong Answer, please try again.') : ''}
                </p>
                <button
                  id="teacher-authentication-popup-submit-button"
                  className={submitButtonClassName}
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={!canSubmit && !isSubmitSuccessFeedbackActive}
                >
                  {t('Submit')}
                </button>
              </div>
            </div>

            <div className="teacher-authentication-popup-keypad-container">
              <div className="teacher-authentication-popup-keypad">
                {keypadKeys.map((key) => {
                  const isBackspaceKey = key === backspaceKey;
                  const isBackspaceDisabled =
                    isBackspaceKey && enteredDigits.length === 0;

                  if (isBackspaceDisabled) {
                    return (
                      <div
                        key={`key-${key}`}
                        className="teacher-authentication-popup-key teacher-authentication-popup-key-backspace teacher-authentication-popup-key-backspace-hidden"
                        aria-hidden="true"
                      />
                    );
                  }

                  return (
                    <button
                      id={`teacher-authentication-popup-key-${key}`}
                      key={`key-${key}`}
                      className={getKeyClassName(key, backspaceKey)}
                      type="button"
                      onClick={() => handleKeyPress(key)}
                      aria-label={
                        isBackspaceKey
                          ? String(t('Backspace') ?? '')
                          : `${String(t('Key') ?? '')} ${key}`
                      }
                    >
                      {getKeyLabel(key, backspaceKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherAuthenticationPopup;
