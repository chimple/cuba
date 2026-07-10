import React from 'react';
import { useTranslation } from 'react-i18next';
import DataTablePagination from '../DataTablePagination';
import {
  CAMPAIGN_MESSAGES_EDIT_ICON_SRC,
  HOUR_OPTIONS,
  PERIOD_OPTIONS,
  useCampaignMessagesController,
} from './CampaignMessagesLogic';
import type { CampaignMessagesScheduleType } from './CampaignMessagesLogic';
import './CampaignMessages.css';

interface CampaignMessagesProps {
  campaignId?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
}

const CampaignMessages: React.FC<CampaignMessagesProps> = ({
  campaignId,
  campaignStartDate,
  campaignEndDate,
}) => {
  const { t } = useTranslation();
  const controller = useCampaignMessagesController({
    campaignId,
    campaignStartDate,
    campaignEndDate,
    translate: (key) => String(t(key)),
  });

  const renderScheduleTimePicker = (
    scheduleType: CampaignMessagesScheduleType,
    label: string,
  ) => {
    const currentTime =
      scheduleType === 'message'
        ? controller.editedMessageTime
        : controller.editedPollTime;
    const currentParts = controller.getScheduleTimeParts(currentTime);
    const isPickerOpen = controller.openSchedulePicker === scheduleType;
    const isTimeEditable = currentParts !== null;

    return (
      <div className="campaign-messages-time-picker-wrapper">
        <button
          className="campaign-messages-time campaign-messages-time-button campaign-messages-time-editable"
          type="button"
          aria-label={label}
          aria-expanded={isPickerOpen}
          disabled={!isTimeEditable}
          onClick={() =>
            controller.setOpenSchedulePicker((currentPicker) =>
              currentPicker === scheduleType ? null : scheduleType,
            )
          }
        >
          {currentTime}
        </button>

        {isPickerOpen && isTimeEditable && (
          <div
            className="campaign-messages-time-picker"
            role="group"
            aria-label={label}
          >
            <div className="campaign-messages-time-picker-column">
              {HOUR_OPTIONS.map((hour) => (
                <button
                  className="campaign-messages-time-picker-option"
                  type="button"
                  aria-selected={currentParts?.hour === hour}
                  key={`${scheduleType}-hour-${hour}`}
                  ref={(element) => {
                    controller.hourOptionRefs.current[
                      `${scheduleType}-hour-${hour}`
                    ] = element;
                  }}
                  onClick={() =>
                    controller.updateScheduleTime(scheduleType, 'hour', hour)
                  }
                >
                  {hour}
                </button>
              ))}
            </div>
            <div className="campaign-messages-time-picker-column campaign-messages-time-picker-period-column">
              {PERIOD_OPTIONS.map((period) => (
                <button
                  className="campaign-messages-time-picker-option"
                  type="button"
                  aria-selected={currentParts?.period === period}
                  key={`${scheduleType}-period-${period}`}
                  ref={(element) => {
                    controller.periodOptionRefs.current[
                      `${scheduleType}-period-${period}`
                    ] = element;
                  }}
                  onClick={() =>
                    controller.updateScheduleTime(
                      scheduleType,
                      'period',
                      period,
                    )
                  }
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className={`campaign-messages${
        controller.isEditMode ? ' campaign-messages-editing' : ''
      }`}
      aria-label={String(t('Campaign messages'))}
    >
      <div className="campaign-messages-schedule">
        <div className="campaign-messages-schedule-grid">
          <h2 className="campaign-messages-subtitle campaign-messages-schedule-heading">
            {t('Global Send Schedule')}
          </h2>
          <div className="campaign-messages-field-block">
            <p className="campaign-messages-field-label">{t('Message Time')}</p>
            {controller.isEditMode ? (
              renderScheduleTimePicker('message', String(t('Message Time')))
            ) : (
              <p className="campaign-messages-time">
                {controller.messagesData.messageTime}
              </p>
            )}
          </div>
          <div className="campaign-messages-field-block">
            <p className="campaign-messages-field-label">{t('Poll Time')}</p>
            {controller.isEditMode ? (
              renderScheduleTimePicker('poll', String(t('Poll Time')))
            ) : (
              <p className="campaign-messages-time">
                {controller.messagesData.pollTime}
              </p>
            )}
          </div>
          <p className="campaign-messages-schedule-note campaign-messages-schedule-note-mobile">
            {t('Applied globally across all campaign days.')}
          </p>
          <p className="campaign-messages-schedule-note campaign-messages-schedule-note-desktop">
            {t('Applied globally across all campaign days.')}
          </p>
          {controller.canEdit && (
            <button
              className={`campaign-messages-schedule-edit${
                !controller.hasEditableRows
                  ? ' campaign-messages-schedule-edit-disabled'
                  : ''
              }`}
              type="button"
              aria-label={String(t('Edit global send schedule'))}
              disabled={!controller.hasEditableRows || controller.isEditMode}
              onClick={controller.handleEdit}
            >
              <img
                src={CAMPAIGN_MESSAGES_EDIT_ICON_SRC}
                alt=""
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      <div
        className={`campaign-messages-table${
          controller.isEditMode ? ' campaign-messages-table-editing' : ''
        }`}
      >
        <div className="campaign-messages-table-head">
          <span>{t('Date')}</span>
          <span>{t('Daily Message')}</span>
          <span>{t('Media Link')}</span>
          <span>{t('Poll')}</span>
        </div>
        <div className="campaign-messages-table-body">
          {controller.displayedRows.map((row) => {
            const isMessageDisabled =
              controller.isEditMode && !row.messageEditable;
            const isPollDisabled = controller.isEditMode && !row.pollEditable;
            const isRowDisabled =
              controller.isEditMode &&
              !row.messageEditable &&
              !row.pollEditable;
            const pollOptions = controller.getPollOptionsForEdit(row);
            const originalOptionCount =
              controller.originalOptionCountByRowId[row.id] ??
              pollOptions.length;
            const isRowCollapsed = controller.collapsedRowIds[row.id] ?? false;

            return (
              <article
                className={`campaign-messages-row${
                  isRowDisabled ? ' campaign-messages-row-disabled' : ''
                }${row.isEditable ? ' campaign-messages-row-editable' : ''}${
                  isRowCollapsed ? ' campaign-messages-row-collapsed' : ''
                }`}
                key={row.id}
              >
                <button
                  className="campaign-messages-mobile-row-head"
                  type="button"
                  aria-expanded={!isRowCollapsed}
                  onClick={() => controller.toggleRowCollapsed(row.id)}
                >
                  <div>
                    <p className="campaign-messages-date-label">
                      {row.dayLabel}
                    </p>
                    <p className="campaign-messages-date-subtext">
                      {row.dateLabel}
                    </p>
                  </div>
                </button>
                <div className="campaign-messages-date-cell">
                  <p className="campaign-messages-date-label">{row.dayLabel}</p>
                  <p className="campaign-messages-date-subtext">
                    {row.dateLabel}
                  </p>
                </div>

                {controller.isEditMode ? (
                  <textarea
                    className="campaign-messages-edit-field campaign-messages-message-edit-field"
                    value={row.message}
                    placeholder={String(t('Enter daily campaign message...'))}
                    disabled={isMessageDisabled}
                    onChange={(event) =>
                      controller.updateRowField(
                        row.id,
                        'message',
                        event.target.value,
                      )
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
                        controller.updateRowField(
                          row.id,
                          'mediaLink',
                          event.target.value,
                        )
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
                              placeholder={String(
                                t(`Option ${optionIndex + 1}`),
                              )}
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
                                  controller.removePollOption(
                                    row.id,
                                    optionIndex,
                                  )
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
          })}
          {controller.isLoading && (
            <div className="campaign-messages-loading-state">
              <p>{t('Loading...')}</p>
            </div>
          )}
          {!controller.isLoading &&
            controller.messagesData.rows.length === 0 && (
              <div className="campaign-messages-empty-state">
                <p>{t('No configured communication days.')}</p>
              </div>
            )}
        </div>
      </div>

      {controller.messagesData.rows.length > 0 && (
        <div className="campaign-messages-pagination-footer">
          <div className="campaign-messages-pagination-center">
            <DataTablePagination
              page={controller.page}
              pageCount={controller.pageCount}
              onPageChange={controller.setPage}
            />
          </div>

          {controller.isEditMode && (
            <div className="campaign-messages-edit-actions">
              <button
                className="campaign-messages-cancel-button"
                type="button"
                disabled={controller.isSaving}
                onClick={controller.handleCancel}
              >
                {t('Cancel')}
              </button>
              <button
                className="campaign-messages-save-button"
                type="button"
                disabled={controller.isSaving}
                onClick={() => void controller.handleSave()}
              >
                {controller.isSaving ? t('Saving...') : t('Save Changes')}
              </button>
            </div>
          )}
        </div>
      )}
      {controller.toastMessage.length > 0 && (
        <div className="campaign-messages-toast" role="status">
          {controller.toastMessage}
        </div>
      )}
    </section>
  );
};

export default CampaignMessages;
