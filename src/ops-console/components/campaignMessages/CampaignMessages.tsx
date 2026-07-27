import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DataTablePagination from '../DataTablePagination';
import {
  CAMPAIGN_MESSAGES_EDIT_ICON_SRC,
  useCampaignMessagesController,
} from './CampaignMessagesLogic';
import type { CampaignMessagesScheduleType } from './CampaignMessagesLogic';
import type { CampaignFrequency } from '../../../services/api/ServiceApi';
import './CampaignMessages.css';
import CampaignMessageRowItem from './CampaignMessageRowItem';
import CampaignScheduleTimePicker from './CampaignScheduleTimePicker';

interface CampaignMessagesProps {
  campaignId?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignFrequency?: CampaignFrequency;
  isCampaignCancelled?: boolean;
}

const CampaignMessages: React.FC<CampaignMessagesProps> = ({
  campaignId,
  campaignStartDate,
  campaignEndDate,
  campaignFrequency,
  isCampaignCancelled,
}) => {
  const { t } = useTranslation();
  const controller = useCampaignMessagesController({
    campaignId,
    campaignStartDate,
    campaignEndDate,
    campaignFrequency,
    isCampaignCancelled,
    translate: (key) => String(t(key)),
  });
  const timePickerWrapperRefs = useRef<
    Partial<Record<CampaignMessagesScheduleType, HTMLDivElement | null>>
  >({});

  useEffect(() => {
    if (!controller.openSchedulePicker) {
      return;
    }

    const activeSchedulePicker = controller.openSchedulePicker;

    const handlePointerDownOutsidePicker = (event: MouseEvent): void => {
      const activeWrapper = timePickerWrapperRefs.current[activeSchedulePicker];
      const targetNode = event.target;

      if (
        activeWrapper &&
        targetNode instanceof Node &&
        !activeWrapper.contains(targetNode)
      ) {
        controller.setOpenSchedulePicker(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutsidePicker);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutsidePicker);
    };
  }, [controller, controller.openSchedulePicker]);

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
              <CampaignScheduleTimePicker
                controller={controller}
                label={String(t('Message Time'))}
                scheduleType="message"
                wrapperRefs={timePickerWrapperRefs}
              />
            ) : (
              <p className="campaign-messages-time">
                {controller.messagesData.messageTime}
              </p>
            )}
          </div>
          <div className="campaign-messages-field-block">
            <p className="campaign-messages-field-label">{t('Poll Time')}</p>
            {controller.isEditMode ? (
              <CampaignScheduleTimePicker
                controller={controller}
                label={String(t('Poll Time'))}
                scheduleType="poll"
                wrapperRefs={timePickerWrapperRefs}
              />
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
          {controller.displayedRows.map((row) => (
            <CampaignMessageRowItem
              controller={controller}
              key={row.id}
              row={row}
            />
          ))}
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
