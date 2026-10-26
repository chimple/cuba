import React from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CampaignMessageRow,
  CampaignMessagesController,
} from './CampaignMessagesLogic';

interface CampaignMessageRowItemProps {
  controller: CampaignMessagesController;
  row: CampaignMessageRow;
}

const CampaignMessageRowItem: React.FC<CampaignMessageRowItemProps> = ({
  controller,
  row,
}) => {
  const { t } = useTranslation();
  const isMessageDisabled = controller.isEditMode && !row.messageEditable;
  const isPollDisabled = controller.isEditMode && !row.pollEditable;
  const isRowDisabled =
    controller.isEditMode && !row.messageEditable && !row.pollEditable;
  const pollOptions = controller.getPollOptionsForEdit(row);
  const originalOptionCount =
    controller.originalOptionCountByRowId[row.id] ?? pollOptions.length;
  const isRowCollapsed = controller.collapsedRowIds[row.id] ?? false;

  return (
    <article
      className={`campaign-messages-row${
        isRowDisabled ? ' campaign-messages-row-disabled' : ''
      }${row.isEditable ? ' campaign-messages-row-editable' : ''}${
        isRowCollapsed ? ' campaign-messages-row-collapsed' : ''
      }`}
    >
      <button
        className="campaign-messages-mobile-row-head"
        type="button"
        aria-expanded={!isRowCollapsed}
        onClick={() => controller.toggleRowCollapsed(row.id)}
      >
        <div>
          <p className="campaign-messages-date-label">{row.dayLabel}</p>
          <p className="campaign-messages-date-subtext">{row.dateLabel}</p>
        </div>
      </button>
      <div className="campaign-messages-date-cell">
        <p className="campaign-messages-date-label">{row.dayLabel}</p>
        <p className="campaign-messages-date-subtext">{row.dateLabel}</p>
      </div>

      {controller.isEditMode ? (
        <textarea
          className="campaign-messages-edit-field campaign-messages-message-edit-field"
          value={row.message}
          placeholder={String(t('Enter daily campaign message...'))}
          disabled={isMessageDisabled}
          onChange={(event) =>
            controller.updateRowField(row.id, 'message', event.target.value)
          }
        />
      ) : (
        <p className="campaign-messages-cell campaign-messages-message-cell">
          {controller.getReadonlyText(row.message)}
        </p>
      )}

      <div className="campaign-messages-cell campaign-messages-media-cell">
        {controller.isEditMode ? (
          <textarea
            className="campaign-messages-edit-field campaign-messages-media-link-edit-field"
            value={row.mediaLink}
            placeholder={String(t('Paste media drive link...'))}
            disabled={isMessageDisabled}
            onChange={(event) =>
              controller.updateRowField(row.id, 'mediaLink', event.target.value)
            }
          />
        ) : (
          <p className="campaign-messages-readonly-field campaign-messages-media-link-field">
            {controller.getReadonlyText(row.mediaLink)}
          </p>
        )}
      </div>

      <div className="campaign-messages-poll-cell">
        {controller.isEditMode ? (
          <>
            <input
              className="campaign-messages-edit-field campaign-messages-poll-question-edit-field"
              value={row.pollQuestion}
              placeholder={String(t('Poll question...'))}
              disabled={isPollDisabled}
              onChange={(event) =>
                controller.updateRowField(
                  row.id,
                  'pollQuestion',
                  event.target.value,
                )
              }
            />
            {pollOptions.map((option, optionIndex) => {
              const canRemoveOption =
                row.isEditable &&
                optionIndex > 1 &&
                optionIndex >= originalOptionCount;

              return (
                <div
                  className="campaign-messages-poll-option-edit-row"
                  key={`${row.id}-poll-option-${optionIndex}`}
                >
                  <input
                    className="campaign-messages-edit-field campaign-messages-poll-option-edit-field"
                    value={option}
                    placeholder={String(t(`Option ${optionIndex + 1}`))}
                    disabled={isPollDisabled}
                    onChange={(event) =>
                      controller.updatePollOption(
                        row.id,
                        optionIndex,
                        event.target.value,
                      )
                    }
                  />
                  {canRemoveOption && (
                    <button
                      className="campaign-messages-remove-option-button"
                      type="button"
                      aria-label={String(t('Remove option'))}
                      disabled={isPollDisabled}
                      onClick={() =>
                        controller.removePollOption(row.id, optionIndex)
                      }
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
            {row.isEditable && (
              <button
                className="campaign-messages-add-option-button"
                type="button"
                disabled={isPollDisabled}
                onClick={() => controller.addPollOption(row.id)}
              >
                {t('+ Option')}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="campaign-messages-readonly-field campaign-messages-poll-question">
              {controller.getReadonlyText(row.pollQuestion)}
            </p>
            {pollOptions.map((option, optionIndex) => (
              <p
                className="campaign-messages-readonly-field campaign-messages-poll-option"
                key={`${row.id}-poll-option-${optionIndex}`}
              >
                {controller.getReadonlyText(option)}
              </p>
            ))}
          </>
        )}
      </div>

      {controller.isEditMode && row.isEditable && (
        <div className="campaign-messages-row-actions">
          <button
            className="campaign-messages-clear-row-button"
            type="button"
            onClick={() => controller.clearRow(row.id)}
          >
            {t('Clear')}
          </button>
        </div>
      )}
    </article>
  );
};

export default CampaignMessageRowItem;
