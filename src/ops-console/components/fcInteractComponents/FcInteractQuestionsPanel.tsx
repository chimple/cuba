import React from 'react';
import { t } from 'i18next';
import AttachMedia from '../../common/AttachMedia';
import type { FcQuestion } from './fcInteractOptions';

type FcInteractQuestionsPanelProps = {
  handleResponseChange: (id: string, value: string) => void;
  isSaving: boolean;
  mandatoryQuestions: FcQuestion[];
  media: any;
  otherComments: string;
  otherQuestions: FcQuestion[];
  responses: Record<string, string>;
  setOtherComments: React.Dispatch<React.SetStateAction<string>>;
  setTechIssueDetails: React.Dispatch<React.SetStateAction<string>>;
  setTechIssueMarked: React.Dispatch<React.SetStateAction<boolean | null>>;
  showMandatory: boolean;
  techIssueDetails: string;
  techIssueMarked: boolean | null;
  translate: (key: string) => string;
};

export default function FcInteractQuestionsPanel({
  handleResponseChange,
  isSaving,
  mandatoryQuestions,
  media,
  otherComments,
  otherQuestions,
  responses,
  setOtherComments,
  setTechIssueDetails,
  setTechIssueMarked,
  showMandatory,
  techIssueDetails,
  techIssueMarked,
  translate,
}: FcInteractQuestionsPanelProps) {
  return (
    <div className="fc-interact-popup-right-area" id="fc-right-area">
      <div
        className="fc-interact-popup-questions-grid"
        id="fc-questions-grid"
      >
        {showMandatory &&
          mandatoryQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="fc-interact-popup-question-row"
              id={`fc-question-${q.id}`}
            >
              <div
                className="fc-interact-popup-question-header"
                id={`fc-question-header-${q.id}`}
              >
                <span
                  className="fc-interact-popup-badge"
                  id={`fc-badge-${q.id}`}
                >
                  {idx + 1}
                </span>

                <div
                  className="fc-interact-popup-question-text"
                  id={`fc-question-text-${q.id}`}
                >
                  {q.question}
                  <span
                    className="fc-interact-popup-required"
                    id={`fc-required-${q.id}`}
                  >
                    *
                  </span>
                </div>
              </div>

              <textarea
                className="fc-interact-popup-textarea-input"
                rows={3}
                id={`fc-textarea-${q.id}`}
                value={responses[q.id] ?? ''}
                onChange={(e) => handleResponseChange(q.id, e.target.value)}
                placeholder={t('Type your answer...') || ''}
                disabled={!showMandatory}
              />
            </div>
          ))}

        {otherQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="fc-interact-popup-question-row"
            id={`fc-question-${q.id}`}
          >
            <div
              className="fc-interact-popup-question-header"
              id={`fc-question-header-${q.id}`}
            >
              <span
                className="fc-interact-popup-badge"
                id={`fc-badge-${q.id}`}
              >
                {mandatoryQuestions.length + idx + 1}
              </span>
              <div
                className="fc-interact-popup-question-text"
                id={`fc-question-text-${q.id}`}
              >
                {q.question}
              </div>
            </div>

            <textarea
              className="fc-interact-popup-textarea-input"
              rows={3}
              id={`fc-textarea-${q.id}`}
              value={responses[q.id] ?? ''}
              onChange={(e) => handleResponseChange(q.id, e.target.value)}
              placeholder={t('Type your answer...') || ''}
            />
          </div>
        ))}
      </div>

      <div
        className="fc-interact-popup-section fc-interact-popup-comments-section"
        id="fc-comments-section"
      >
        <div
          className="fc-interact-popup-label-other-comments"
          id="fc-comments-label"
        >
          {showMandatory && mandatoryQuestions.length > 0 && (
            <span className="fc-interact-popup-badge">
              {mandatoryQuestions.length + 1}
            </span>
          )}
          {t('Any other questions or comments?')}
        </div>
        <textarea
          className="fc-interact-popup-textarea-input"
          rows={3}
          id="fc-comments-textarea"
          value={otherComments}
          onChange={(e) => setOtherComments(e.target.value)}
          placeholder={
            t('Add any additional points, observations, or feedback here...') ||
            ''
          }
        />
      </div>

      <div
        className="fc-interact-popup-section fc-interact-popup-tech-section"
        id="fc-tech-section"
      >
        <div
          className="fc-interact-popup-question-row"
          id="fc-tech-question-row"
        >
          <div className="fc-interact-popup-tech-header" id="fc-tech-header">
            <div
              className="fc-interact-popup-question-header"
              id="fc-tech-question-header"
            >
              {showMandatory && mandatoryQuestions.length > 0 && (
                <span className="fc-interact-popup-badge" id="fc-tech-badge">
                  {mandatoryQuestions.length + 2}
                </span>
              )}

              <div
                className="fc-interact-popup-question-text"
                id="fc-tech-label"
              >
                {t('Any tech issues reported')}?
                <span
                  className="fc-interact-popup-required"
                  id="fc-tech-required"
                >
                  *
                </span>
              </div>
            </div>

            <div
              className="fc-interact-popup-radio-group fc-interact-popup-tech-radio-options"
              id="fc-tech-radio-group"
            >
              <label
                className="fc-interact-popup-radio-item"
                id="fc-tech-yes-label"
              >
                <input
                  type="radio"
                  name="tech-issue"
                  id="fc-tech-yes"
                  checked={techIssueMarked === true}
                  onChange={() => setTechIssueMarked(true)}
                />
                {t('Yes')}
              </label>

              <label
                className="fc-interact-popup-radio-item"
                id="fc-tech-no-label"
              >
                <input
                  type="radio"
                  name="tech-issue"
                  id="fc-tech-no"
                  checked={techIssueMarked === false}
                  onChange={() => {
                    setTechIssueMarked(false);
                    setTechIssueDetails('');
                  }}
                />
                {t('No')}
              </label>
            </div>
          </div>

          {techIssueMarked && (
            <textarea
              className="fc-interact-popup-textarea-input"
              rows={3}
              id="fc-tech-textarea"
              value={techIssueDetails}
              onChange={(e) => setTechIssueDetails(e.target.value)}
              placeholder={t('Add if any tech issues were reported...') || ''}
            />
          )}
        </div>
      </div>

      <AttachMedia
        variant="fc-interact"
        t={translate}
        media={media}
        disabled={isSaving}
      />
    </div>
  );
}
