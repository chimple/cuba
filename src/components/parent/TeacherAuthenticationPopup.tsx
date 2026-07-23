import { useTeacherAuthenticationPopup } from '../../hooks/useTeacherAuthenticationPopup';
import './TeacherAuthenticationPopup.css';

const TeacherAuthenticationPopup = (props: Parameters<typeof useTeacherAuthenticationPopup>[0]) => {
  const viewProps = useTeacherAuthenticationPopup(props);

  if (!viewProps) {
    return null;
  }

  const {
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
  } = viewProps;

  return (
    <div
      id="teacher-authentication-popup-overlay"
      className="teacher-authentication-popup-overlay"
    >
      <section
        id="teacher-authentication-popup"
        className="teacher-authentication-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-authentication-popup-title"
      >
        <div
          id="teacher-authentication-popup-inner"
          className="teacher-authentication-popup-inner"
        >
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
              id="teacher-authentication-popup-close-icon"
              className="teacher-authentication-popup-close-icon"
            />
          </button>

          <div
            id="teacher-authentication-popup-content"
            className="teacher-authentication-popup-content"
          >
            <div
              id="teacher-authentication-popup-question-container"
              className="teacher-authentication-popup-question-container"
            >
              <div
                id="teacher-authentication-popup-left-panel"
                className="teacher-authentication-popup-left-panel"
              >
                <h2
                  id="teacher-authentication-popup-title"
                  className="teacher-authentication-popup-title"
                >
                  {t('This question is for the Teacher:')}
                </h2>
                <p
                  id="teacher-authentication-popup-question"
                  className="teacher-authentication-popup-question"
                >
                  {displayedQuestionText}
                </p>
                <p
                  id="teacher-authentication-popup-help-text"
                  className="teacher-authentication-popup-help-text"
                >
                  {t('Enter your Answer in the keypad :')}
                </p>
                <div
                  id="teacher-authentication-popup-answer-slots"
                  className="teacher-authentication-popup-answer-slots"
                >
                  {Array.from({ length: expectedDigitCount }).map(
                    (_, index) => (
                      <span
                        id="teacher-authentication-popup-answer-slot"
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
                  id={`teacher-authentication-popup-error ${
                    showError
                      ? 'teacher-authentication-popup-error-visible'
                      : 'teacher-authentication-popup-error-hidden'
                  }`}
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
                  id={submitButtonClassName}
                  className={submitButtonClassName}
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={
                    !canSubmit ||
                    isSubmitSuccessFeedbackActive ||
                    isSubmitAttemptInProgress
                  }
                >
                  {t('Submit')}
                </button>
              </div>
            </div>

            <div
              id="teacher-authentication-popup-keypad-container"
              className="teacher-authentication-popup-keypad-container"
            >
              <div
                id="teacher-authentication-popup-keypad"
                className="teacher-authentication-popup-keypad"
              >
                {keypadKeys.map((key) => {
                  const isBackspaceKey = key === backspaceKey;
                  const isBackspaceDisabled =
                    isBackspaceKey && enteredDigits.length === 0;

                  if (isBackspaceDisabled) {
                    return (
                      <div
                        id="teacher-authentication-popup-key teacher-authentication-popup-key-backspace teacher-authentication-popup-key-backspace-hidden"
                        key={`key-${key}`}
                        className="teacher-authentication-popup-key teacher-authentication-popup-key-backspace teacher-authentication-popup-key-backspace-hidden"
                        aria-hidden="true"
                      />
                    );
                  }

                  return (
                    <button
                      id={getKeyClassName(key, backspaceKey)}
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
